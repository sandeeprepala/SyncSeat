import { Queue } from "bullmq"
import { bullConnection } from "../config/bullConnection.js"

export const bookingQueue = new Queue("bookingQueue", {
  connection: bullConnection
})