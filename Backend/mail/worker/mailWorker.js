import dns from "dns"
dns.setDefaultResultOrder("ipv4first")
import { sendMail } from "../utils/sendMail.js"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { Worker } from "bullmq"
import Redis from "ioredis"
import { createClient } from "@supabase/supabase-js"
import { Agent } from "undici"

// 🔹 Load ENV from mail/.env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../.env") })

// debug environment variables for mail
console.log("Loaded env MAIL_USER:", process.env.MAIL_USER)
console.log("Loaded env MAIL_PASS:", process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/./g, '*') : undefined)
console.log("Redis URL:", process.env.UPSTASH_REDIS_URL)
console.log("Supabase URL:", process.env.SUPABASE_URL)

// 🔹 Fix IPv6 issue for Supabase
const originalFetch = globalThis.fetch
const ipv4Agent = new Agent({ connect: { family: 4 } })

globalThis.fetch = (url, options = {}) => {
  return originalFetch(url, {
    ...options,
    dispatcher: ipv4Agent
  })
}

// 🔹 Supabase Client (use SERVICE ROLE key)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 🔹 Upstash Redis Connection
const connection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}
})

connection.on("connect", () => console.log("Redis connecting..."))
connection.on("ready", () => console.log("Redis ready"))
connection.on("error", err => console.error("Redis error:", err))

// 🔹 Worker
const worker = new Worker(
  "mailQueue",
  async (job) => {

    console.log("Processing mail job:", job.data)

    const { userId, showId, seatIds } = job.data

    // 🔹 Fetch User
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single()

    if (!user) throw new Error("User not found")

    // 🔹 Fetch Show
    const { data: show } = await supabase
      .from("shows")
      .select("start_time, movie_id, screen_id")
      .eq("id", showId)
      .single()

    if (!show) throw new Error("Show not found")

    // 🔹 Fetch Movie
    const { data: movie } = await supabase
      .from("movies")
      .select("title")
      .eq("id", show.movie_id)
      .single()

    if (!movie) throw new Error("Movie not found")

    // 🔹 Fetch Screen
    const { data: screen } = await supabase
      .from("screens")
      .select("name, theatre_id")
      .eq("id", show.screen_id)
      .single()

    if (!screen) throw new Error("Screen not found")

    // 🔹 Fetch Theatre
    const { data: theatre } = await supabase
      .from("theatres")
      .select("name")
      .eq("id", screen.theatre_id)
      .single()

    if (!theatre) throw new Error("Theatre not found")

    // 🔹 Fetch Seats
    const { data: seats } = await supabase
      .from("seats")
      .select("row_label, seat_number")
      .in("id", seatIds)

    if (!seats || !seats.length) throw new Error("Seats not found")

    const seatList = seats.map(s => `${s.row_label}${s.seat_number}`).join(", ")

    const subject = "Your Movie Ticket 🎟️"

    const message = `
Movie: ${movie.title}
Theatre: ${theatre.name}
Screen: ${screen.name}
Seats: ${seatList}
Show Time: ${show.start_time}
`

    // 🔹 Save Mail Log
    // 🔹 Send Email
await sendMail(user.email, subject, message)

// 🔹 Save Mail Log
const { error } = await supabase
  .from("mail_logs")
  .insert([{
    email: user.email,
    subject,
    message
  }])

    if (error) throw error

    console.log("Mail job completed ✅")
  },
  { connection }
)

// 🔹 Events
worker.on("completed", job => {
  console.log(`Job ${job.id} completed`)
})

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)
})

worker.on("error", err => {
  console.error("Worker error:", err)
})

console.log("Mail worker started 🚀")