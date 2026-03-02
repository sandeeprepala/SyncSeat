import express from "express"
import {
  addMovie,
  getMovies,
  addTheatre,
  getTheatres,
  addScreen,
  getScreens,
  addShow,
  getShows,
  getSeatLayout,
    addSeatsToScreen,
} from "../controllers/homepageController.js"
import upload from "../middleware/upload.js"

const router = express.Router()

router.post("/movies", upload.single("poster"),addMovie)
router.get("/movies", getMovies)

router.post("/theatres", addTheatre)
router.get("/theatres", getTheatres)

router.post("/screens", addScreen)
router.get("/screens/:theatreId", getScreens)

router.post("/shows", addShow)
router.get("/shows/:movieId", getShows)

router.get("/seats/:showId", getSeatLayout)

router.post("/seats", addSeatsToScreen)

export default router