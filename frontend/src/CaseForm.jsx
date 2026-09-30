import { useState } from 'react'
import { API_BASE } from './config.js'
import { useAuth } from './AuthContext.jsx'

export default function CaseForm({ onCreated }) {
  const { token } = useAuth()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [contact, setContact] = useState('')
  const [location, setLocation] = useState('')
  const [photo, setPhoto] = useState(null)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!photo) {
      setStatus({ type: 'error', message: 'Please choose a clear photo of the missing person.' })
      return
    }

    setSubmitting(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('name', name)
    if (age) formData.append('age', age)
    if (gender) formData.append('gender', gender)
    if (contact) formData.append('contact', contact)
    if (location) formData.append('last_known_location', location)
    formData.append('photo', photo)

    try {
      const res = await fetch(`${API_BASE}/api/cases`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Could not register this case.')
      }
      const data = await res.json()
      setStatus({ type: 'success', message: `Case ${data.case_number} opened for ${data.name}.` })
      setName('')
      setAge('')
      setGender('')
      setContact('')
      setLocation('')
      setPhoto(null)
      e.target.reset()
      onCreated?.()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="case-form" onSubmit={handleSubmit}>
      <h2>Register Missing Person</h2>

      <label>
        Full name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <div className="form-row">
        <label>
          Age
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label>
          Gender
          <input value={gender} onChange={(e) => setGender(e.target.value)} />
        </label>
      </div>

      <label>
        Last known location
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. MG Road junction"
        />
      </label>

      <label>
        Reporting contact
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="phone or email" />
      </label>

      <label>
        Photo (clear, front-facing)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0] || null)}
          required
        />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Registering...' : 'Open Case'}
      </button>

      {status && (
        <p className={status.type === 'error' ? 'form-error' : 'form-success'}>
          {status.message}
        </p>
      )}
    </form>
  )
}
