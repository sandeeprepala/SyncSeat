import { bookingQueue } from "../queue/bookingQueue.js"
import Redis from "ioredis"
import { supabase } from "../config/supabaseClient.js"
import axios from "axios"
import dotenv from 'dotenv'
dotenv.config()

const redis = new Redis(process.env.UPSTASH_REDIS_URL)
const MAIL_URL = process.env.MAIL_URL;


/* -----------------------------------------
   1. USER CLICKS BOOK → ADD TO QUEUE
------------------------------------------ */

export const lockSeatRequest = async (req, res) => {
  try {

    const { showId, seatIds,userId } = req.body

    if (!showId || !seatIds || !userId) {
      return res.status(400).json({ message: "Missing fields" })
    }

    await bookingQueue.add("lockSeat", {
      showId,
      seatIds,
      userId
    })

    res.json({
      message: "Booking request added to queue"
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/* -----------------------------------------
   2. CHECK LOCK STATUS (for frontend polling)
------------------------------------------ */

export const checkLockStatus = async (req, res) => {

  const { showId, seatIds } = req.body

  for (let seatId of seatIds) {
    const lockKey = `lock:${showId}:${seatId}`
    const value = await redis.get(lockKey)

    if (!value) {
      return res.json({ locked: false })
    }
  }

  res.json({ locked: true })
}

/* -----------------------------------------
   3. CONFIRM BOOKING (PAYMENT SUCCESS)
------------------------------------------ */

export const confirmBooking = async (req, res) => {
  try {

    const { showId, seatIds,userId } = req.body

    for (let seatId of seatIds) {

      const lockKey = `lock:${showId}:${seatId}`
      const lockedBy = await redis.get(lockKey)

      if (!lockedBy || lockedBy !== userId) {
        return res.json({
          message: "Session timeout"
        })
      }

      await supabase
        .from("show_seats")
        .update({
          status: "BOOKED",
          locked_until: null
        })
        .eq("show_id", showId)
        .eq("seat_id", seatId)

      await redis.del(lockKey)
    }

    await axios.post(`${MAIL_URL}/mail/ticket`, {
      userId,
      showId,
      seatIds
    })

    res.json({
      message: "Booking confirmed successfully"
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}