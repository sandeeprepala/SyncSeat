import express from "express"
import { sendTicketMail } from "../controllers/mailController.js"

const router = express.Router()

router.post("/ticket", sendTicketMail)

export default router