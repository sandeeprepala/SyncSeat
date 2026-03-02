import express from "express"
import 'dotenv/config'
import bookingRoutes from "./routes/bookingRoutes.js"

const app = express()
app.use(express.json())

app.use("/booking", bookingRoutes)

app.listen(process.env.PORT, () => {
  console.log("Booking service running")
})