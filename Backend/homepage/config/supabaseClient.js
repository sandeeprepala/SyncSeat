import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Agent } from 'undici'

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