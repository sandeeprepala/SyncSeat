import 'dotenv/config'
import { supabase } from "../config/supabaseClient.js"

console.log("Lock cleanup worker started...")

setInterval(async () => {
  try {

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("show_seats")
      .update({
        status: "AVAILABLE",
        locked_until: null
      })
      .eq("status", "LOCKED")
      .lt("locked_until", now)
      .select()

    if (error) {
      console.error("Cleanup error:", error)
      return
    }

    if (data.length) {
      console.log(`Released ${data.length} expired locks`)
    }

  } catch (err) {
    console.error("Cleanup worker error:", err)
  }
}, 30000)