import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { Agent } from 'undici'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: envPath })

// Save original fetch first
const originalFetch = globalThis.fetch

// Create IPv4-only agent
const ipv4Agent = new Agent({
  connect: {
    family: 4
  }
})

// Override fetch safely
globalThis.fetch = (url, options = {}) => {
  return originalFetch(url, {
    ...options,
    dispatcher: ipv4Agent
  })
}

// Create Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)