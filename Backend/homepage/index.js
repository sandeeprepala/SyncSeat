import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

import express from "express"
import cors from "cors"
import 'dotenv/config'
import homepageRoutes from "./routes/homepageRoutes.js"

const app = express()

app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())

app.use("/homepage", homepageRoutes)

app.get("/", (req, res) => {
  res.send("Welcome to the Homepage Service!")
})

const PORT = process.env.PORT || 4001

app.listen(PORT, () => {
  console.log("Homepage service running")
})