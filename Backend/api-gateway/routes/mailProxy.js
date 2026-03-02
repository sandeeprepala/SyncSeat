import express from "express"
import axios from "axios"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()
const MAIL = "http://localhost:5003"

router.use("/mail", verifyToken, async (req, res) => {
  try {

    const response = await axios({
      method: req.method,
      url: `${MAIL}${req.originalUrl}`,
      data: {
        ...req.body,
        userId: req.user.id
      }
    })
    console.log("Mail service response:", response.data)
    res.json(response.data)

  } catch (err) {
    res.status(500).json(err.response?.data || err.message)
  }
})

export default router