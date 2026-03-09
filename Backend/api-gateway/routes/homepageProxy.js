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
    const cacheKey = `${req.method}:${req.originalUrl}`

    // Check cache for GET requests
    if (req.method === 'GET') {
      const cachedResponse = cache.get(cacheKey)
      if (cachedResponse) {
        console.log(`[CACHE HIT] ${req.originalUrl}`)
        return res.json(cachedResponse)
      }

      // Deduplicate: if this request is already in-flight, wait for it
      const inFlightPromise = cache.getInFlight(cacheKey)
      if (inFlightPromise) {
        console.log(`[DEDUP] Waiting for in-flight request: ${req.originalUrl}`)
        try {
          const data = await inFlightPromise
          return res.json(data)
        } catch (err) {
          throw err
        }
      }
    }

    // Make the actual request
    const fullUrl = `${HOMEPAGE}${req.originalUrl}`
    const requestPromise = axios({
      method: req.method,
      url: fullUrl,
      data: req.body,
      timeout: 15000 // 15 second timeout
    })

    // Track in-flight GET requests for deduplication
    if (req.method === 'GET') {
      const dataPromise = requestPromise.then(response => response.data)
      cache.setInFlight(cacheKey, dataPromise)
    }

    const response = await requestPromise

    // Cache successful GET responses
    if (req.method === 'GET' && response.status === 200) {
      const ttl = getCacheTTL(req.originalUrl)
      cache.set(cacheKey, response.data, ttl)
      console.log(`[CACHED] ${req.originalUrl} for ${ttl}s`)
    }

    // Clear in-flight marker
    if (req.method === 'GET') {
      cache.clearInFlight(cacheKey)
    }

    res.json(response.data)

  } catch (err) {
    // Clear in-flight marker on error
    const cacheKey = `${req.method}:${req.originalUrl}`
    cache.clearInFlight(cacheKey)

    const statusCode = err.response?.status || 500
    const errorMessage = err.response?.data || err.message

    console.error(`[ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode}`, errorMessage)

    res.status(statusCode).json({
      error: errorMessage,
      message: statusCode === 429 
        ? 'Service temporarily overloaded, retrying...' 
        : 'Failed to fetch data from homepage service'
    })
  }
})

// Endpoint to clear cache (for admin use)
router.post("/clear-cache", (req, res) => {
  cache.clear()
  console.log('[ADMIN] Cache cleared')
  res.json({ message: "Cache cleared successfully" })
})

export default router