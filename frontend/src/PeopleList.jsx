import { useEffect, useState } from 'react'
import { API_BASE } from './config.js'

export default function PeopleList({ refreshKey }) {
  const [people, setPeople] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/people`)
      .then((res) => res.json())
      .then(setPeople)
      .catch(() => setError('Could not load enrolled people.'))
  }, [refreshKey])

  if (error) return <p className="form-error">{error}</p>
  if (people.length === 0) return <p className="empty">No one enrolled yet.</p>

  return (
    <ul className="people-list">
      {people.map((p) => (
        <li key={p.id}>
          <b>{p.name}</b>
          {p.age ? ` · ${p.age}` : ''}
          {p.gender ? ` · ${p.gender}` : ''}
          {p.contact ? ` · ${p.contact}` : ''}
        </li>
      ))}
    </ul>
  )
}
