import express from "express"
import axios from "axios"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()
const BOOKING = "https://syncseat-booking.onrender.com"

// Retry logic with exponential backoff for booking operations
async function fetchWithRetry(url, config, maxRetries = 3) {
  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios({
        method: config.method,
        url: url,
        data: config.data,
        timeout: 20000, // 20 second timeout for booking operations
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          ...config.headers
        }
      })

      // Check if response is HTML (Cloudflare challenge)
      if (response.headers['content-type']?.includes('text/html')) {
        throw new Error('Cloudflare protection detected. Service temporarily unavailable.')
      }

      return response
    } catch (err) {
      lastError = err

      // If 429 (Too Many Requests) or 503 (Service Unavailable), retry with exponential backoff
      if (err.response?.status === 429 || err.response?.status === 503) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 10000) // 2s, 4s, 8s max
        console.warn(`[BOOKING RETRY] ${err.response?.status} on attempt ${attempt + 1}, waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Don't retry other errors
      throw err
    }
  }

  throw lastError
}

router.use("/booking", verifyToken, async (req, res) => {
  try {
    const fullUrl = `${BOOKING}${req.originalUrl}`

    const response = await fetchWithRetry(fullUrl, {
      method: req.method,
      data: {
        ...req.body,
        userId: req.user.id
      }
    })

    console.log(`[BOOKING SUCCESS] ${req.method} ${req.originalUrl} - User: ${req.user.id}`)
    res.json(response.data)

  } catch (err) {
    const statusCode = err.response?.status || 500
    const errorData = err.response?.data || err.message

    console.error(`[BOOKING ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode}`, errorData)

    // Handle Cloudflare protection specifically
    if (errorData.includes('Cloudflare') || errorData.includes('Just a moment')) {
      return res.status(503).json({
        error: 'Service temporarily protected by security measures. Please try again in a few moments.',
        message: 'Booking service is currently under protection. Please wait and retry your booking.'
      })
    }

    res.status(statusCode).json({
      error: errorData,
      message: statusCode === 429
        ? 'Booking service is rate-limited. Please wait a moment and try again.'
        : statusCode === 503
        ? 'Booking service is temporarily unavailable. Please try again later.'
        : 'Failed to process booking request'
    })
  }
})

export default router