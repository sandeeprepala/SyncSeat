import express from "express"
import axios from "axios"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()
const BOOKING = "http://localhost:5000"

router.use("/booking", verifyToken, async (req, res) => {
  try {

    const response = await axios({
      method: req.method,
      url: `${BOOKING}${req.originalUrl}`,
      data: {
        ...req.body,
        userId: req.user.id
      }
    })
    console.log("User in proxy:", req.user)
    res.json(response.data)

  } catch (err) {
    res.status(500).json(err.response?.data || err.message)
  }
})

export default router