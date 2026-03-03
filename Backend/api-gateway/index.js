import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import "dotenv/config"

import authRoutes from "./routes/authRoutes.js"
import homepageProxy from "./routes/homepageProxy.js"
import bookingProxy from "./routes/bookingProxy.js"
import mailProxy from "./routes/mailProxy.js"

const app = express()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.use("/auth", authRoutes)
app.use("/", homepageProxy)
app.use("/", bookingProxy)
app.use("/", mailProxy)

app.listen(4000, () => {
  console.log("API Gateway running on port 4000")
})