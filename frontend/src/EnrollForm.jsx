import { useState } from 'react'
import { API_BASE } from './config.js'

export default function EnrollForm({ onEnrolled }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [contact, setContact] = useState('')
  const [photo, setPhoto] = useState(null)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message }
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!photo) {
      setStatus({ type: 'error', message: 'Please choose a photo first.' })
      return
    }

    setSubmitting(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('name', name)
    if (age) formData.append('age', age)
    if (gender) formData.append('gender', gender)
    if (contact) formData.append('contact', contact)
    formData.append('photo', photo)

    try {
      const res = await fetch(`${API_BASE}/api/enroll`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Enrollment failed.')
      }

      const data = await res.json()
      setStatus({ type: 'success', message: `Enrolled "${data.name}" (id ${data.id}).` })
      setName('')
      setAge('')
      setGender('')
      setContact('')
      setPhoto(null)
      e.target.reset()
      onEnrolled?.()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="enroll-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label>
        Age
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
      </label>

      <label>
        Gender
        <input value={gender} onChange={(e) => setGender(e.target.value)} />
      </label>

      <label>
        Contact
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="phone or email" />
      </label>

      <label>
        Photo
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0] || null)}
          required
        />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Enrolling...' : 'Enroll person'}
      </button>

      {status && (
        <p className={status.type === 'error' ? 'form-error' : 'form-success'}>
          {status.message}
        </p>
      )}
    </form>
  )
}
