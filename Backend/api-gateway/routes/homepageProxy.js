import express from "express"
import axios from "axios"

const router = express.Router()
const HOMEPAGE = "https://syncseat-homepage.onrender.com"

router.use("/homepage", async (req, res) => {
  try {

    const response = await axios({
      method: req.method,
      url: `${HOMEPAGE}${req.originalUrl}`,
      data: req.body
    })

    res.json(response.data)

  } catch (err) {
    res.status(500).json(err.response?.data || err.message)
  }
})

export default router