import express from "express"
import axios from "axios"
import { cache } from "../utils/cache.js"

const router = express.Router()
const HOMEPAGE = "https://syncseat-homepage.onrender.com"

// Cache TTL in seconds - 5 minutes for static data like movies/theatres, 1 minute for dynamic data
const CACHE_TTL = {
  movies: 300,     // 5 minutes - movies change infrequently
  theatres: 300,   // 5 minutes
  screens: 300,    // 5 minutes
  shows: 120,      // 2 minutes - shows might change more frequently
  default: 60      // 1 minute fallback
}

function getCacheTTL(url) {
  if (url.includes('/movies')) return CACHE_TTL.movies
  if (url.includes('/theatres')) return CACHE_TTL.theatres
  if (url.includes('/screens')) return CACHE_TTL.screens
  if (url.includes('/shows')) return CACHE_TTL.shows
  return CACHE_TTL.default
}

router.use("/homepage", async (req, res) => {
  try {
    const fullUrl = `${HOMEPAGE}${req.originalUrl}`
    const cacheKey = `${req.method}:${req.originalUrl}`

    // Check cache for GET requests
    if (req.method === 'GET') {
      const cachedResponse = cache.get(cacheKey)
      if (cachedResponse) {
        return res.json(cachedResponse)
      }
    }

    const response = await axios({
      method: req.method,
      url: fullUrl,
      data: req.body,
      timeout: 10000 // 10 second timeout to prevent hanging
    })

    // Cache successful GET responses
    if (req.method === 'GET' && response.status === 200) {
      const ttl = getCacheTTL(req.originalUrl)
      cache.set(cacheKey, response.data, ttl)
    }

    res.json(response.data)

  } catch (err) {
    console.error('Homepage proxy error:', err.message)
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message })
  }
})

// Endpoint to clear cache (for admin use)
router.post("/clear-cache", (req, res) => {
  cache.clear()
  res.json({ message: "Cache cleared successfully" })
})

export default router