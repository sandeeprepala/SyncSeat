import dotenv from "dotenv"
dotenv.config()

import Redis from "ioredis"

console.log("Redis URL:", process.env.UPSTASH_REDIS_URL) // temporary debug

export const redisConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}
})