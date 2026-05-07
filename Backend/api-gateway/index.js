import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import "dotenv/config"

import authRoutes from "./routes/authRoutes.js"
import homepageProxy from "./routes/homepageProxy.js"
import bookingProxy from "./routes/bookingProxy.js"
import mailProxy from "./routes/mailProxy.js"
import { startKeepAlive } from "../utils/keepAlive.js"

const app = express()

const allowedOrigins = [
  "https://sync-seat-seven.vercel.app",
  "http://localhost:5173", // for development
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.use("/auth", authRoutes)
app.use("/", homepageProxy)
app.use("/", bookingProxy)
app.use("/", mailProxy)

startKeepAlive()

app.listen(4000, () => {
  console.log("API Gateway running on port 4000")
})