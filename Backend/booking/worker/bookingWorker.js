import 'dotenv/config'
import { Worker } from "bullmq"
import Redis from "ioredis"
import { supabase } from "../config/supabaseClient.js"

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

const worker = new Worker(
  "bookingQueue",
  async job => {
    try {

      const { showId, seatIds, userId } = job.data

      console.log("Processing booking:", showId, seatIds)

      const locksToCreate = []

      // STEP 1 — Check DB state first
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

      // STEP 2 — Lock in Redis
      for (let item of locksToCreate) {
        const result = await lockRedis.set(item.lockKey, userId, "EX", 600)
        console.log("Redis SET result:", result)
      }

      console.log("Redis locks created")

      // STEP 3 — Update DB
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
          throw error
        }

        if (!data.length) {
          console.log("DB update failed — seat already taken")
          return
        }
      }

      console.log("Seats locked successfully")

    } catch (error) {
      console.error("Error in booking job:", error)
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