import { createContext, useContext, useEffect, useState } from 'react'
import { API_BASE } from './config.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('talaash_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired')
        return res.json()
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('talaash_token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function login(username, password) {
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('password', password)

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Login failed.')
    }

    // Password was correct, but this does NOT log the person in yet --
    // it only triggers an OTP email. verifyOtp() is what actually
    // issues a usable token.
    return await res.json()
  }

  async function verifyOtp(username, otp) {
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('otp', otp)

    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Verification failed.')
    }

    const data = await res.json()
    localStorage.setItem('talaash_token', data.access_token)
    setToken(data.access_token)
    setUser({ username: data.username, role: data.role, full_name: data.full_name })
    return data
  }

  function logout() {
    localStorage.removeItem('talaash_token')
    setToken(null)
    setUser(null)
  }

  async function forgotPassword(username) {
    const body = new URLSearchParams()
    body.append('username', username)

    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Could not process that request.')
    return data
  }

  async function resetPassword(username, otp, newPassword) {
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('otp', otp)
    body.append('new_password', newPassword)

    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Could not reset the password.')
    return data
  }

  async function updateProfile({ full_name, email, new_password }) {
    const body = new URLSearchParams()
    if (full_name !== undefined) body.append('full_name', full_name)
    if (email !== undefined) body.append('email', email)
    if (new_password) body.append('new_password', new_password)

    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
      body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Could not update profile.')
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, verifyOtp, logout, forgotPassword, resetPassword, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
