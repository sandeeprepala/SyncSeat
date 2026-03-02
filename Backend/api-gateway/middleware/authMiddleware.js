import jwt from "jsonwebtoken"

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ message: "No token" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded   // ⭐️ CRITICAL

    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" })
  }
}