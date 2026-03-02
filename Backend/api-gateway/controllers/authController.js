import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"
import { supabase } from "../config/supabaseClient.js"
import { generateToken } from "../config/jwt.js"

export const signup = async (req, res) => {
  const { email, password, city } = req.body

  const hashed = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from("users")
    .insert([{
      id: uuid(),
      email,
      password: hashed,
      city
    }])
    .select()

  if (error) return res.status(400).json(error)

  const token = generateToken(data[0])

  res.cookie("token", token, {
  httpOnly: true,
  secure: false,   // true in production (HTTPS)
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000
})

res.json({ message: "Signup successful" })
}

export const login = async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single()

  if (error || !data) return res.status(400).json({ message: "Invalid credentials" })

  const match = await bcrypt.compare(password, data.password)

  if (!match) return res.status(400).json({ message: "Invalid credentials" })

  const token = generateToken(data)

  res.cookie("token", token, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000
})

res.json({ message: "Login successful" })
}

export const logout = (req, res) => {
  res.clearCookie("token")
  res.json({ message: "Logged out" })
}