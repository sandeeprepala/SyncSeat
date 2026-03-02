import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

import express from "express"
import 'dotenv/config'
import mailRoutes from "./routes/mailRoutes.js"

const app = express()
app.use(express.json())

app.use("/mail", mailRoutes)

app.listen(process.env.PORT, () => {
  console.log("Mail service running")
})