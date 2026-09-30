import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setEmail(user.email || '')
    }
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' })
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      await updateProfile({
        full_name: fullName,
        email,
        new_password: newPassword || undefined,
      })
      setStatus({ type: 'success', message: 'Profile updated.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 18 }}>Profile</h2>

      <form className="case-form" style={{ maxWidth: 380 }} onSubmit={handleSubmit}>
        <label>
          Username
          <input value={user?.username || ''} disabled />
        </label>

        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>

        <label>
          Email (used for login verification codes)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Role
          <input value={user?.role || ''} disabled />
        </label>

        <hr style={{ border: 'none', borderTop: '1px solid #232A35', margin: '6px 0' }} />

        <label>
          New password (leave blank to keep current password)
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <label>
          Confirm new password
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save changes'}
        </button>

        {status && (
          <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.message}</p>
        )}
      </form>
    </div>
  )
}
