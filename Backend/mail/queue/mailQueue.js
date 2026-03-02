import { Queue } from "bullmq"
import { redisConnection } from "../config/redis.js"

export const mailQueue = new Queue("mailQueue", {
  connection: redisConnection
})