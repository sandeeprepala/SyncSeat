import nodemailer from "nodemailer"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// ensure environment variables are loaded when this module runs
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../.env") })

// the .env uses MAIL_USER / MAIL_PASS, not EMAIL_USER
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

transporter.verify().then(() => {
  console.log("Mail transporter ready - using", process.env.MAIL_USER)
}).catch(err => {
  console.error("Mail transporter verification failed", err)
})

export const sendMail = async (to, subject, text) => {
  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text
  })
}