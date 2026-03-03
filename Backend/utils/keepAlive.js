import 'dotenv/config'

function getDefaultUrl() {
  return (
    process.env.KEEP_ALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.WEBSITE_URL ||
    process.env.HEROKU_APP_URL ||
    null
  )
}

export function startKeepAlive(options = {}) {
  const enabled = process.env.ENABLE_KEEP_ALIVE !== 'false'
  if (!enabled) return null

  const url = options.url || getDefaultUrl()
  const intervalMs = Number(options.intervalMs) || Number(process.env.KEEP_ALIVE_INTERVAL_MS) || 5 * 60 * 1000

  if (!url) {
    console.warn('keepAlive: no KEEP_ALIVE_URL or equivalent env var found — skipping')
    return null
  }

  console.log(`keepAlive: pinging ${url} every ${Math.round(intervalMs / 1000)}s`)

  const id = setInterval(async () => {
    try {
      // Use global fetch (Node 18+) — fall back to require if unavailable
      const f = (typeof fetch === 'function') ? fetch : (await import('node-fetch')).default
      await f(url, { method: 'GET' })
      // minimal logging to avoid noise
    } catch (err) {
      console.warn('keepAlive: ping failed:', err?.message || err)
    }
  }, intervalMs)

  // Return a stop function
  return () => clearInterval(id)
}

export default startKeepAlive
