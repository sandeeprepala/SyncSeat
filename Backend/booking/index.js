import express from "express"
import 'dotenv/config'
import bookingRoutes from "./routes/bookingRoutes.js"

const app = express()
app.use(express.json())

// simple health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

app.use("/booking", bookingRoutes)

app.listen(process.env.PORT, () => {
  console.log("Booking service running on port", process.env.PORT)
  console.log("UPSTASH_REDIS_URL?", !!process.env.UPSTASH_REDIS_URL)
  console.log("SUPABASE_URL?", !!process.env.SUPABASE_URL)
  console.log("SUPABASE_SERVICE_ROLE_KEY?", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
})