import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
const AuthContext = createContext()
const Auth_Service = import.meta.env.VITE_AUTH_SERVICE
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check login on app load
  const checkAuth = async () => {
    try {
      const res = await axios.get(`${Auth_Service}/auth/me`, {
        withCredentials: true
      })
      setUser(res.data.user)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const logout = async () => {
    await axios.post(`${Auth_Service}/auth/logout`, {}, {
      withCredentials: true
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)