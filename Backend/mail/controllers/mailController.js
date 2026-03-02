import { mailQueue } from "../queue/mailQueue.js"

export const sendTicketMail = async (req, res) => {
  try {

    const { userId, showId, seatIds } = req.body

    await mailQueue.add("ticketMail", {
      userId,
      showId,
      seatIds
    })

    res.json({ message: "Mail job added" })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}