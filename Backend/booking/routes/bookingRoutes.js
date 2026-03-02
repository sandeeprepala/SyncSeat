import express from "express"
import {
  lockSeatRequest,
  confirmBooking,
  checkLockStatus
} from "../controllers/bookingController.js"

const router = express.Router()

router.post("/lock-seat", lockSeatRequest)
router.post("/confirm", confirmBooking)
router.post("/check-lock", checkLockStatus)

export default router