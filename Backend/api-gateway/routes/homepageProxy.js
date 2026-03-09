import express from "express"
import axios from "axios"
import { cache } from "../utils/cache.js"

const router = express.Router()
const HOMEPAGE = "https://syncseat-homepage.onrender.com"

// Cache TTL in seconds
const CACHE_TTL = {
  movies: 300,     // 5 minutes
  theatres: 300,   // 5 minutes
  screens: 300,    // 5 minutes
  shows: 120,      // 2 minutes
  default: 60      // 1 minute fallback
}

function getCacheTTL(url) {
  if (url.includes('/movies')) return CACHE_TTL.movies
  if (url.includes('/theatres')) return CACHE_TTL.theatres
  if (url.includes('/screens')) return CACHE_TTL.screens
  if (url.includes('/shows')) return CACHE_TTL.shows
  return CACHE_TTL.default
}

// Retry logic with exponential backoff
async function fetchWithRetry(url, config, maxRetries = 3) {
  let lastError
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios({
        method: config.method,
        url: url,
        data: config.data,
        timeout: 15000
      })
      return response
    } catch (err) {
      lastError = err
      
      // If 429 (Too Many Requests), retry with exponential backoff
      if (err.response?.status === 429) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // 1s, 2s, 4s max
        console.warn(`[RETRY] 429 on attempt ${attempt + 1}, waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry other errors
      throw err
    }
  }
  
  throw lastError
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

      // Deduplicate: if request already in-flight, wait for it
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

    // Make the actual request with retry logic
    const fullUrl = `${HOMEPAGE}${req.originalUrl}`
    const requestPromise = fetchWithRetry(fullUrl, {
      method: req.method,
      data: req.body
    })

    // Track in-flight GET requests
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
    const errorData = err.response?.data || err.message

    console.error(`[ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode}`, errorData)

    res.status(statusCode).json({
      error: errorData,
      message: statusCode === 429 
        ? 'Service temporarily rate-limited. Please try again in a moment.' 
        : 'Failed to fetch data'
    })
  }
})

// Cache management endpoint
router.post("/clear-cache", (req, res) => {
  cache.clear()
  console.log('[ADMIN] Cache cleared')
  res.json({ message: "Cache cleared successfully" })
})

export default router