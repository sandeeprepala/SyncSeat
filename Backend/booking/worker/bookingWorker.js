import 'dotenv/config'
import { Worker } from "bullmq"
import Redis from "ioredis"
import { supabase } from "../config/supabaseClient.js"
import startKeepAlive from "../../utils/keepAlive.js"

/**
 * ========== 2-PHASE COMMIT (2PC) TRANSACTION PATTERN ==========
 * 
 * This booking worker implements a 2PC pattern to ensure consistency between
 * Redis locks and Supabase database state. If either phase fails, the transaction
 * is rolled back.
 *
 * PHASE 1: PREPARE
 *   - Validate seat existence and availability in DB
 *   - Create Redis locks with 10-minute TTL (EX 600)
 *   - If any lock creation fails → throw error (triggers rollback)
 *
 * PHASE 2: PREPARE DB UPDATES
 *   - For each seat, attempt conditional update: set status=LOCKED where status=AVAILABLE
 *   - This prevents race conditions: concurrent requests will fail the WHERE clause
 *   - If any DB update fails → throw error (triggers rollback)
 *
 * PHASE 3: COMMIT
 *   - Both phases succeeded → transaction is committed
 *   - Seats are now reserved for this user
 *
 * ROLLBACK:
 *   - On any error, delete all created Redis locks
 *   - Supabase updates are not undone (conditional WHERE ensures we only updated AVAILABLE seats)
 *   - Job fails and BullMQ retries it
 *
 * BENEFITS:
 *   - Prevents seat double-booking
 *   - If service crashes after Redis lock but before DB update → job retries
 *   - If DB update fails after Redis lock → rollback cleans up locks
 * ========================================================================
 */

// Shared Redis connection
const connection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  retryStrategy: (times) => Math.min(times * 100, 2000)
})

connection.on('connect', () => console.log('Redis connecting...'))
connection.on('ready', () => console.log('Redis connection ready'))
connection.on('close', () => console.warn('Redis connection closed'))
connection.on('reconnecting', (delay) => console.warn('Redis reconnecting, delay:', delay))
connection.on('error', (err) => console.error('Redis error:', err))



// 🔹 BullMQ connection
const queueConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}
})

// 🔹 Separate Redis connection for locking
const lockRedis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: {}
})

console.log("Booking worker started...")

// Start keep-alive pings to prevent free hosts from idling (configure KEEP_ALIVE_URL)
startKeepAlive()

const worker = new Worker(
  "bookingQueue",
  async job => {
    let createdLocks = []
    let successfulDbUpdates = []
    let txnPhase = "INIT"

    try {
      const { showId, seatIds, userId } = job.data

      console.log("Processing booking:", showId, seatIds)

      const locksToCreate = []

      // STEP 0 — Validate seat existence and status in DB
      txnPhase = "VALIDATION"
      const { data: seatsInDB, error: dbError } = await supabase
        .from("show_seats")
        .select("seat_id, status")
        .eq("show_id", showId)
        .in("seat_id", seatIds)

      if (dbError) {
        console.error("DB fetch error:", dbError)
        throw dbError
      }

      if (!seatsInDB || seatsInDB.length !== seatIds.length) {
        console.log("Some seats not found in DB → aborting")
        return
      }

      for (let seat of seatsInDB) {
        if (seat.status !== "AVAILABLE") {
          console.log("Seat already LOCKED/BOOKED in DB → aborting")
          return
        }

        const lockKey = `lock:${showId}:${seat.seat_id}`
        const alreadyLocked = await lockRedis.get(lockKey)

        if (alreadyLocked) {
          console.log("Seat already locked in Redis → aborting")
          return
        }

        locksToCreate.push({ seatId: seat.seat_id, lockKey })
      }

      // ========== 2PC PHASE 1: PREPARE ==========
      txnPhase = "PHASE_1_PREPARE_LOCKS"
      console.log("2PC: Phase 1 - Creating Redis locks...")

      for (let item of locksToCreate) {
        const result = await lockRedis.set(item.lockKey, userId, "EX", 600)
        if (result !== "OK") {
          throw new Error(`Failed to create lock for seat ${item.seatId}`)
        }
        createdLocks.push(item)
      }

      console.log("2PC: Phase 1 - Redis locks prepared:", createdLocks.length)

      // ========== 2PC PHASE 2: PREPARE DB UPDATES ==========
      txnPhase = "PHASE_2_PREPARE_DB"
      console.log("2PC: Phase 2 - Attempting DB updates...")

      const lockExpiry = new Date(Date.now() + 600000)

      for (let item of locksToCreate) {
        const { data, error } = await supabase
          .from("show_seats")
          .update({
            status: "LOCKED",
            locked_until: lockExpiry
          })
          .eq("show_id", showId)
          .eq("seat_id", item.seatId)
          .eq("status", "AVAILABLE")
          .select()

        if (error) {
          console.error("Supabase update error:", error)
          throw new Error(`DB update failed for seat ${item.seatId}: ${error.message}`)
        }

        if (!data || !data.length) {
          throw new Error(`DB concurrent update detected for seat ${item.seatId} — seat already taken`)
        }

        // Track successful DB update for potential rollback
        successfulDbUpdates.push({ seatId: item.seatId, data: data[0] })
      }

      // ========== 2PC PHASE 3: COMMIT ==========
      txnPhase = "PHASE_3_COMMIT"
      console.log("2PC: Phase 3 - Committing transaction...")
      console.log("✅ Seats locked successfully:", successfulDbUpdates.map(u => u.seatId).join(", "))

    } catch (error) {
      // ========== 2PC ROLLBACK ==========
      console.error(`❌ 2PC: Error in phase [${txnPhase}]:`, error.message)
      
      // ROLLBACK PHASE 1: Delete all created Redis locks
      console.error("2PC: ROLLING BACK - Deleting", createdLocks.length, "Redis locks...")
      for (let lock of createdLocks) {
        try {
          await lockRedis.del(lock.lockKey)
          console.log(`   ↳ Rolled back Redis lock for seat ${lock.seatId}`)
        } catch (rollbackErr) {
          console.error(`   ↳ FAILED to rollback Redis lock ${lock.lockKey}:`, rollbackErr)
        }
      }

      // ROLLBACK PHASE 2: Revert successful DB updates back to AVAILABLE
      if (successfulDbUpdates.length > 0) {
        console.error("2PC: ROLLING BACK - Reverting", successfulDbUpdates.length, "DB updates...")
        for (let update of successfulDbUpdates) {
          try {
            const { error } = await supabase
              .from("show_seats")
              .update({
                status: "AVAILABLE",
                locked_until: null
              })
              .eq("seat_id", update.seatId)
              .eq("status", "LOCKED")

            if (error) {
              console.error(`   ↳ FAILED to revert DB for seat ${update.seatId}:`, error)
            } else {
              console.log(`   ↳ Reverted DB for seat ${update.seatId} back to AVAILABLE`)
            }
          } catch (rollbackErr) {
            console.error(`   ↳ FAILED to revert DB for seat ${update.seatId}:`, rollbackErr)
          }
        }
      }

      console.error("2PC: Rollback completed")
      throw error
    }
  },
  { connection: queueConnection }
)

worker.on("completed", job => {
  console.log(`Job ${job.id} completed`)
})

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err)
})

worker.on("error", err => {
  console.error("Worker error:", err)
})