import { useEffect, useState } from 'react'
import { API_BASE } from './config.js'
import { useAuth } from './AuthContext.jsx'

const STATUS_LABEL = { Active: 'Active', Found: 'Found', Closed: 'Closed' }

function StatusBadge({ status }) {
  return <span className={`badge badge-status-${status.toLowerCase()}`}>{STATUS_LABEL[status] || status}</span>
}

function CaseRow({ c, onChanged, token }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [busy, setBusy] = useState(false)

  const authHeaders = { Authorization: `Bearer ${token}` }

  async function toggleExpand() {
    const next = !expanded
    setExpanded(next)
    if (next) {
      const res = await fetch(`${API_BASE}/api/cases/${c.id}`, { headers: authHeaders })
      const data = await res.json()
      setNotes(data.notes || [])
    }
  }

  async function changeStatus(status) {
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append('status', status)
      await fetch(`${API_BASE}/api/cases/${c.id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: formData,
      })
      onChanged?.()
    } finally {
      setBusy(false)
    }
  }

  async function submitNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append('note', newNote)
      const res = await fetch(`${API_BASE}/api/cases/${c.id}/notes`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      })
      const data = await res.json()
      setNotes(data.notes || [])
      setNewNote('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="case-card">
      <div className="case-card-head" onClick={toggleExpand}>
        <div>
          <span className="case-number">{c.case_number}</span>
          <span className="case-name">{c.name}</span>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="case-card-meta">
        {c.age ? `${c.age} yrs` : ''}
        {c.gender ? ` · ${c.gender}` : ''}
        {c.last_known_location ? ` · last seen: ${c.last_known_location}` : ''}
      </div>

      {expanded && (
        <div className="case-card-expanded">
          <div className="status-actions">
            <button disabled={busy || c.status === 'Active'} onClick={() => changeStatus('Active')}>
              Mark Active
            </button>
            <button disabled={busy || c.status === 'Found'} onClick={() => changeStatus('Found')}>
              Mark Found
            </button>
            <button disabled={busy || c.status === 'Closed'} onClick={() => changeStatus('Closed')}>
              Close Case
            </button>
          </div>

          <div className="notes-section">
            <h4>Investigation notes</h4>
            {notes.length === 0 ? (
              <p className="empty">No notes yet.</p>
            ) : (
              <ul className="notes-list">
                {notes.map((n) => (
                  <li key={n.id}>
                    <span className="note-time">{n.created_at}</span>
                    {n.note}
                  </li>
                ))}
              </ul>
            )}
            <form className="note-form" onSubmit={submitNote}>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an update..."
              />
              <button type="submit" disabled={busy}>Add</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CasesList({ refreshKey, statusFilter }) {
  const { token } = useAuth()
  const [cases, setCases] = useState([])
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState(statusFilter || '')

  function load() {
    const url = filter ? `${API_BASE}/api/cases?status=${filter}` : `${API_BASE}/api/cases`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setCases)
      .catch(() => setError('Could not load cases.'))
  }

  useEffect(load, [refreshKey, filter, token])

  return (
    <div>
      {!statusFilter && (
        <div className="filter-row">
          {['', 'Active', 'Found', 'Closed'].map((s) => (
            <button key={s || 'all'} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {!error && cases.length === 0 && <p className="empty">No cases found.</p>}

      <div className="case-list">
        {cases.map((c) => (
          <CaseRow key={c.id} c={c} onChanged={load} token={token} />
        ))}
      </div>
    </div>
  )
}
