import { useEffect, useState } from 'react'
import { API_BASE } from './config.js'
import { useAuth } from './AuthContext.jsx'

export default function AIDetectionPage() {
  const { token } = useAuth()
  const [detections, setDetections] = useState([])
  const [period, setPeriod] = useState('')
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  function load() {
    const url = period
      ? `${API_BASE}/api/detections?period=${period}`
      : `${API_BASE}/api/detections`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setDetections)
      .catch(() => setError('Could not load detections.'))
  }

  useEffect(load, [period, token])

  async function setStatus(id, status) {
    setBusyId(id)
    try {
      const formData = new FormData()
      formData.append('status', status)
      await fetch(`${API_BASE}/api/detections/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 18 }}>AI Detection</h2>

      <div className="filter-row">
        {[
          { key: '', label: 'All' },
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'Week' },
          { key: 'month', label: 'Month' },
        ].map((f) => (
          <button key={f.key} className={period === f.key ? 'active' : ''} onClick={() => setPeriod(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {!error && detections.length === 0 && <p className="empty">No detections in this period.</p>}

      <table className="detection-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Case</th>
            <th>Camera</th>
            <th>Confidence</th>
            <th>Time</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {detections.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td className="mono">{d.case_number}</td>
              <td>{d.camera}</td>
              <td className="mono">{(d.confidence * 100).toFixed(1)}%</td>
              <td className="mono">{d.created_at}</td>
              <td><span className={`badge badge-status-${d.status.toLowerCase()}`}>{d.status}</span></td>
              <td>
                {d.status === 'Pending' && (
                  <div className="row-actions">
                    <button disabled={busyId === d.id} onClick={() => setStatus(d.id, 'Verified')}>Confirm</button>
                    <button disabled={busyId === d.id} onClick={() => setStatus(d.id, 'Rejected')}>Reject</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
