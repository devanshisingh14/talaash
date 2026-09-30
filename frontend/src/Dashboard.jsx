import { useEffect, useRef, useState } from 'react'
import { API_BASE, WS_URL } from './config.js'
import { useAuth } from './AuthContext.jsx'

export default function Dashboard() {
  const { token } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setAlerts((prev) => [{ ...data, reviewStatus: 'Pending' }, ...prev].slice(0, 50))
    }

    return () => socket.close()
  }, [])

  async function review(detectionId, status) {
    setAlerts((prev) =>
      prev.map((a) => (a.detection_id === detectionId ? { ...a, reviewStatus: status } : a))
    )
    const formData = new FormData()
    formData.append('status', status)
    await fetch(`${API_BASE}/api/detections/${detectionId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
  }

  return (
    <div>
      <div className="status-line">
        <span className={`dot ${connected ? 'dot-live' : 'dot-off'}`} />
        {connected ? 'System monitoring live' : 'Not connected — check that the camera service is running'}
      </div>

      {alerts.length === 0 ? (
        <p className="empty">No alerts yet. This screen will update automatically the moment a possible match is found.</p>
      ) : (
        <div className="alert-list">
          {alerts.map((a, i) => (
            <div className="alert-card" key={i}>
              <div className="alert-head">
                <span className="badge badge-alert">Possible Match Found</span>
                <span className="alert-time">{a.time}</span>
              </div>
              <div className="alert-body">
                <div className="alert-name">{a.name}</div>
                <div className="alert-meta">Case {a.case_number} &middot; seen on {a.camera}</div>
              </div>
              <div className="confidence-row">
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${a.confidence}%` }} />
                </div>
                <span className="confidence-label">{a.confidence}% confidence</span>
              </div>

              {a.reviewStatus === 'Pending' ? (
                <div className="row-actions" style={{ marginTop: 10 }}>
                  <button onClick={() => review(a.detection_id, 'Verified')}>Confirm</button>
                  <button onClick={() => review(a.detection_id, 'Rejected')}>Reject</button>
                </div>
              ) : (
                <span
                  className={`badge badge-status-${a.reviewStatus.toLowerCase()}`}
                  style={{ marginTop: 10, display: 'inline-block' }}
                >
                  {a.reviewStatus}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
