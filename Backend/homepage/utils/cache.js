// Cache utility for homepage service
class ServiceCache {
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

  clear() {
    this.store.clear()
  }

  delete(key) {
    this.store.delete(key)
  }
}

export const serviceCache = new ServiceCache()
