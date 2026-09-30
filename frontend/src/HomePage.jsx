import { useEffect, useState } from 'react'
import { API_BASE } from './config.js'
import { useAuth } from './AuthContext.jsx'

export default function HomePage() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }

    fetch(`${API_BASE}/api/stats/home`, { headers })
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setError('Could not load stats.'))

    fetch(`${API_BASE}/api/detections?limit=5`, { headers })
      .then((res) => res.json())
      .then(setRecent)
      .catch(() => {})
  }, [token])

  const cards = stats
    ? [
        { label: 'Total Missing Persons', value: stats.total_missing },
        { label: 'Active Cases', value: stats.active_cases },
        { label: 'Persons Found', value: stats.persons_found },
        { label: 'Cameras Online', value: stats.cameras_online },
        { label: 'AI Matches Today', value: stats.matches_today },
      ]
    : []

  return (
    <div>
      <h2 style={{ marginBottom: 18 }}>Home</h2>

      {error && <p className="form-error">{error}</p>}

      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '24px 0 12px' }}>Recent AI Matches</h3>
      {recent.length === 0 ? (
        <p className="empty">No matches recorded yet.</p>
      ) : (
        <div className="case-list">
          {recent.map((d) => (
            <div className="case-card" key={d.id}>
              <div className="case-card-head">
                <div>
                  <span className="case-number">{d.case_number}</span>
                  <span className="case-name">{d.name}</span>
                </div>
                <span className={`badge badge-status-${d.status.toLowerCase()}`}>{d.status}</span>
              </div>
              <div className="case-card-meta">
                {d.camera} &middot; {(d.confidence * 100).toFixed(1)}% confidence &middot; {d.created_at}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
