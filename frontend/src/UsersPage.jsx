import { useEffect, useState } from 'react'
import { API_BASE } from './config.js'
import { useAuth } from './AuthContext.jsx'

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('officer')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    fetch(`${API_BASE}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => setError('Could not load users.'))
  }

  useEffect(load, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('full_name', fullName)
    formData.append('email', email)
    formData.append('role', role)

    try {
      const res = await fetch(`${API_BASE}/api/auth/users`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not create user.')
      setStatus({ type: 'success', message: `Created ${data.role} account '${data.username}'.` })
      setUsername('')
      setFullName('')
      setEmail('')
      setPassword('')
      setRole('officer')
      load()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 18 }}>User Management</h2>

      <div className="cases-layout">
        <form className="case-form" onSubmit={handleSubmit}>
          <h2>Add User</h2>

          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label>
            Email (for OTP login codes)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Temporary password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create account'}
          </button>

          {status && (
            <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.message}</p>
          )}
        </form>

        <div>
          <h2>All Users</h2>
          {error && <p className="form-error">{error}</p>}
          <div className="case-list">
            {users.map((u) => (
              <div className="case-card" key={u.id}>
                <div className="case-card-head">
                  <div>
                    <span className="case-name">{u.full_name || u.username}</span>
                  </div>
                  <span className={`badge ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-officer'}`}>
                    {u.role}
                  </span>
                </div>
                <div className="case-card-meta">
                  @{u.username} {u.email ? `· ${u.email}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
