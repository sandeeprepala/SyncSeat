import 'dotenv/config'
import Redis from "ioredis"

export const bullConnection = new Redis(process.env.UPSTASH_REDIS_URL)