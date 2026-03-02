import { supabase } from "../config/supabaseClient.js"
import { v4 as uuid } from "uuid"

/* ---------------- MOVIES ---------------- */

export const addMovie = async (req, res) => {
  try {
    const { title, duration, language } = req.body

    if (!req.file) {
      return res.status(400).json({ message: "Poster image required" })
    }

    const poster_url = req.file.path

    const { data, error } = await supabase
      .from("movies")
      .insert([{
        id: uuid(),
        title,
        duration,
        language,
        poster_url
      }])
      .select()

    if (error) return res.status(400).json(error)
    res.json(data)

  } catch (err) {
    res.status(500).json({ message: "Server error", err })
  }
}

export const getMovies = async (req, res) => {
  const { data, error } = await supabase.from("movies").select("*")
  if (error) return res.status(400).json(error)
  res.json(data)
}

/* ---------------- THEATRES ---------------- */

export const addTheatre = async (req, res) => {
  const { name, city } = req.body

  const { data, error } = await supabase
    .from("theatres")
    .insert([{ id: uuid(), name, city }])
    .select()

  if (error) return res.status(400).json(error)
  res.json(data)
}

export const getTheatres = async (req, res) => {
  const { data, error } = await supabase.from("theatres").select("*")
  if (error) return res.status(400).json(error)
  res.json(data)
}

/* ---------------- SCREENS ---------------- */

export const addScreen = async (req, res) => {
  const { theatre_id, name } = req.body

  const { data, error } = await supabase
    .from("screens")
    .insert([{ id: uuid(), theatre_id, name }])
    .select()

  if (error) return res.status(400).json(error)
  res.json(data)
}

export const getScreens = async (req, res) => {
  const { theatreId } = req.params

  const { data, error } = await supabase
    .from("screens")
    .select("*")
    .eq("theatre_id", theatreId)

  if (error) return res.status(400).json(error)
  res.json(data)
}

/* ---------------- SEATS (STATIC PER SCREEN) ---------------- */

export const addSeatsToScreen = async (req, res) => {
  const { screen_id, rows, seats_per_row } = req.body

  const seatList = []

  for (let row of rows) {
    for (let num = 1; num <= seats_per_row; num++) {
      seatList.push({
        id: uuid(),
        screen_id,
        row_label: row,
        seat_number: num
      })
    }
  }

  const { data, error } = await supabase
    .from("seats")
    .upsert(seatList, {
      onConflict: "screen_id,row_label,seat_number"
    })
    .select()

  if (error) return res.status(400).json(error)
  res.json(data)
}

/* ---------------- SHOWS ---------------- */

export const addShow = async (req, res) => {
  const { movie_id, screen_id, start_time } = req.body
  const showId = uuid()

  // STEP 1: Create show
  const { data, error } = await supabase
    .from("shows")
    .insert([{ id: showId, movie_id, screen_id, start_time }])
    .select()

  if (error) return res.status(400).json(error)

  // STEP 2: Get all seats of this screen
  const { data: seats, error: seatError } = await supabase
    .from("seats")
    .select("id")
    .eq("screen_id", screen_id)

  if (seatError) return res.status(400).json(seatError)

  // STEP 3: Create show_seats snapshot (ONLY ONCE)
  const showSeats = seats.map(seat => ({
    id: uuid(),
    show_id: showId,
    seat_id: seat.id,
    status: "AVAILABLE",
    locked_until: null
  }))

  const { error: showSeatError } = await supabase
    .from("show_seats")
    .upsert(showSeats, {
      onConflict: "show_id,seat_id"
    })

  if (showSeatError) return res.status(400).json(showSeatError)

  res.json(data)
}

export const getShows = async (req, res) => {
  const { movieId } = req.params

  const { data, error } = await supabase
    .from("shows")
    .select("*")
    .eq("movie_id", movieId)

  if (error) return res.status(400).json(error)
  res.json(data)
}

/* ---------------- SEAT LAYOUT ---------------- */

export const getSeatLayout = async (req, res) => {
  const { showId } = req.params

  const { data, error } = await supabase
    .from("show_seats")
    .select(`
      seat_id,
      status,
      locked_until,
      seat:seat_id (
        row_label,
        seat_number
      )
    `)
    .eq("show_id", showId)

  if (error) return res.status(400).json(error)

  // derive UI status
  const now = new Date()

  const formatted = data.map(seat => {
    let derivedStatus = "AVAILABLE"

    if (seat.status === "BOOKED") {
      derivedStatus = "BOOKED"
    }
    else if (
      seat.status === "LOCKED" &&
      seat.locked_until &&
      new Date(seat.locked_until) > now
    ) {
      derivedStatus = "LOCKED"
    }

    return {
      seat_id: seat.seat_id,
      row: seat.seat.row_label,
      number: seat.seat.seat_number,
      status: derivedStatus
    }
  })

  res.json(formatted)
}

/* ---------------- SHOWS BY DATE ---------------- */

export const getShowsByDate = async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ message: "Date is required" })
    }

    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const { data, error } = await supabase
      .from("shows")
      .select(`
        id,
        start_time,
        movie:movie_id (
          id,
          title,
          poster_url,
          duration
        ),
        screen:screen_id (
          id,
          name
        )
      `)
      .gte("start_time", startOfDay)
      .lte("start_time", endOfDay)
      .order("start_time", { ascending: true })

    if (error) return res.status(400).json(error)
    res.json(data)

  } catch (err) {
    res.status(500).json({ message: "Server error", err })
  }
}