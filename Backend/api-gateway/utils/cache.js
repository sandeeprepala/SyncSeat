// In-memory cache with TTL and request deduplication for API Gateway
class Cache {
  constructor() {
    this.store = new Map()
    this.inFlightRequests = new Map() // Track requests in-flight to deduplicate
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    this.store.set(key, { value, expiresAt })
  }

  get(key) {
    const item = this.store.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    
    return item.value
  }

  isExpired(key) {
    const item = this.store.get(key)
    if (!item) return true
    return Date.now() > item.expiresAt
  }

  // Track in-flight requests to deduplicate identical concurrent requests
  getInFlight(key) {
    return this.inFlightRequests.get(key)
  }

  setInFlight(key, promise) {
    this.inFlightRequests.set(key, promise)
  }

  clearInFlight(key) {
    this.inFlightRequests.delete(key)
  }

  clear() {
    this.store.clear()
    this.inFlightRequests.clear()
  }

  delete(key) {
    this.store.delete(key)
    this.inFlightRequests.delete(key)
  }
}

export const cache = new Cache()
