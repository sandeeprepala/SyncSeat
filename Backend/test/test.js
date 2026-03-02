import { supabase } from "./supabaseClient.js"
import { v4 as uuid } from "uuid"

const run = async () => {
  const { data, error } = await supabase.from("movies").insert([
    {
      id: uuid(),
      title: "Interstellar",
      duration: 169
    }
  ]).select()

  console.log("Data:", data)
  console.log("Error:", error)
}

run()