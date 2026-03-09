// Simple in-memory cache with TTL for API Gateway
class Cache {
  constructor() {
    this.store = new Map()
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

  clear() {
    this.store.clear()
  }

  delete(key) {
    this.store.delete(key)
  }
}

export const cache = new Cache()
