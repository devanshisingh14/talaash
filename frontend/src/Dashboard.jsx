import { useEffect, useRef, useState } from 'react'
import { API_BASE, WS_URL } from './config.js'
import { useAuth } from './AuthContext.jsx'

export default function Dashboard() {
  const { token } = useAuth()

  const [alerts, setAlerts] = useState([])
  const [connected, setConnected] = useState(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')

  const socketRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  /* ---------------- WEBSOCKET / AI ALERTS ---------------- */

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      setAlerts((prev) =>
        [
          {
            ...data,
            reviewStatus: 'Pending',
          },
          ...prev,
        ].slice(0, 50)
      )
    }

    return () => socket.close()
  }, [])

  /* ---------------- GET AVAILABLE CAMERAS ---------------- */

  async function getCameras() {
    try {
      setCameraError('')

      const devices = await navigator.mediaDevices.enumerateDevices()

      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      )

      setCameras(videoDevices)

      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId)
      }

      if (videoDevices.length === 0) {
        setCameraError('No camera was detected on this device.')
      }
    } catch (error) {
      console.error(error)
      setCameraError('Unable to access available cameras.')
    }
  }

  /* ---------------- START CAMERA ---------------- */

  async function startCamera(deviceId = selectedCamera) {
    try {
      setCameraError('')

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          'Camera access is not supported by this browser.'
        )
        return
      }

      /* Stop previous stream first */
      stopCamera()

      const constraints = {
        video: deviceId
          ? {
              deviceId: {
                exact: deviceId,
              },
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
            }
          : {
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
            },
        audio: false,
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(constraints)

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraActive(true)

      /* Refresh camera list after permission is granted */
      await getCameras()
    } catch (error) {
      console.error(error)

      setCameraActive(false)

      if (error.name === 'NotAllowedError') {
        setCameraError(
          'Camera permission was denied. Please allow camera access in your browser.'
        )
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera was found.')
      } else {
        setCameraError(
          'Unable to start the camera. Please check your camera connection.'
        )
      }
    }
  }

  /* ---------------- STOP CAMERA ---------------- */

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })

      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
  }

  /* ---------------- CAMERA CLEANUP ---------------- */

  useEffect(() => {
    getCameras()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [])

  /* ---------------- CAMERA SWITCH ---------------- */

  async function changeCamera(event) {
    const deviceId = event.target.value

    setSelectedCamera(deviceId)

    if (cameraActive) {
      await startCamera(deviceId)
    }
  }

  /* ---------------- REVIEW AI ALERT ---------------- */

  async function review(detectionId, status) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.detection_id === detectionId
          ? {
              ...a,
              reviewStatus: status,
            }
          : a
      )
    )

    const formData = new FormData()
    formData.append('status', status)

    await fetch(
      `${API_BASE}/api/detections/${detectionId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )
  }

  return (
    <div
      style={{
        padding: '24px',
        background: '#f8fafc',
        minHeight: '100%',
        color: '#111827',
      }}
    >
      {/* PAGE HEADER */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '22px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
            }}
          >
            Live CCTV
          </h1>

          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            Real-time camera monitoring and AI detection alerts
          </p>
        </div>

        {/* SYSTEM STATUS */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 15px',
            borderRadius: '9px',
            background: connected ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${
              connected ? '#a7f3d0' : '#fecaca'
            }`,
            color: connected ? '#047857' : '#b91c1c',
            fontSize: '13px',
            fontWeight: '700',
          }}
        >
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: connected ? '#10b981' : '#ef4444',
            }}
          />

          {connected
            ? 'AI Monitoring Connected'
            : 'AI Monitoring Offline'}
        </div>
      </div>

      {/* CAMERA SECTION */}

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
          marginBottom: '24px',
        }}
      >
        {/* CAMERA HEADER */}

        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              Camera Monitoring
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                fontSize: '13px',
                color: '#64748b',
              }}
            >
              Live camera feed for real-time monitoring
            </p>
          </div>

          {/* LIVE CAMERA STATUS */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 13px',
              borderRadius: '8px',
              background: cameraActive
                ? '#fef2f2'
                : '#f8fafc',
              color: cameraActive ? '#dc2626' : '#64748b',
              border: `1px solid ${
                cameraActive ? '#fecaca' : '#e5e7eb'
              }`,
              fontSize: '12px',
              fontWeight: '700',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: cameraActive
                  ? '#ef4444'
                  : '#94a3b8',
              }}
            />

            {cameraActive ? 'CAMERA LIVE' : 'CAMERA OFF'}
          </div>
        </div>

        {/* CAMERA BODY */}

        <div
          style={{
            padding: '20px 22px',
          }}
        >
          {/* CAMERA SELECT */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '18px',
            }}
          >
            <label
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              Camera:
            </label>

            <select
              value={selectedCamera}
              onChange={changeCamera}
              style={{
                minWidth: '230px',
                padding: '9px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {cameras.length === 0 ? (
                <option value="">
                  No cameras detected
                </option>
              ) : (
                cameras.map((camera, index) => (
                  <option
                    key={camera.deviceId}
                    value={camera.deviceId}
                  >
                    {camera.label ||
                      `Camera ${index + 1}`}
                  </option>
                ))
              )}
            </select>

            {!cameraActive ? (
              <button
                onClick={() => startCamera()}
                style={{
                  padding: '9px 17px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#111827',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                style={{
                  padding: '9px 17px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Stop Camera
              </button>
            )}

            <button
              onClick={getCameras}
              style={{
                padding: '9px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#374151',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Refresh Cameras
            </button>
          </div>

          {/* CAMERA ERROR */}

          {cameraError && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 15px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
              }}
            >
              {cameraError}
            </div>
          )}

          {/* VIDEO */}

          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#111827',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid #1f2937',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraActive
                  ? 'block'
                  : 'none',
              }}
            />

            {!cameraActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#d1d5db',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '42px',
                    marginBottom: '12px',
                  }}
                >
                  📹
                </div>

                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#f3f4f6',
                  }}
                >
                  Camera is currently off
                </div>

                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '13px',
                    color: '#9ca3af',
                  }}
                >
                  Select a camera and click Start Camera
                </div>
              </div>
            )}

            {/* LIVE LABEL */}

            {cameraActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#ef4444',
                  }}
                />

                LIVE
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI ALERT SECTION */}

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#111827',
            }}
          >
            AI Detection Alerts
          </h2>

          <p
            style={{
              margin: '5px 0 0',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            Possible matches detected by the monitoring system
          </p>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {alerts.length === 0 ? (
            <div
              style={{
                padding: '35px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                No AI alerts yet
              </div>

              <p
                style={{
                  margin: '7px 0 0',
                  fontSize: '13px',
                  color: '#6b7280',
                }}
              >
                This section will update automatically when
                a possible match is detected.
              </p>
            </div>
          ) : (
            <div className="alert-list">
              {alerts.map((a, i) => (
                <div
                  className="alert-card"
                  key={i}
                >
                  <div className="alert-head">
                    <span className="badge badge-alert">
                      Possible Match Found
                    </span>

                    <span className="alert-time">
                      {a.time}
                    </span>
                  </div>

                  <div className="alert-body">
                    <div className="alert-name">
                      {a.name}
                    </div>

                    <div className="alert-meta">
                      Case {a.case_number} · seen on{' '}
                      {a.camera}
                    </div>
                  </div>

                  <div className="confidence-row">
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${a.confidence}%`,
                        }}
                      />
                    </div>

                    <span className="confidence-label">
                      {a.confidence}% confidence
                    </span>
                  </div>

                  {a.reviewStatus === 'Pending' ? (
                    <div
                      className="row-actions"
                      style={{ marginTop: 10 }}
                    >
                      <button
                        onClick={() =>
                          review(
                            a.detection_id,
                            'Verified'
                          )
                        }
                      >
                        Confirm
                      </button>

                      <button
                        onClick={() =>
                          review(
                            a.detection_id,
                            'Rejected'
                          )
                        }
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`badge badge-status-${a.reviewStatus.toLowerCase()}`}
                      style={{
                        marginTop: 10,
                        display: 'inline-block',
                      }}
                    >
                      {a.reviewStatus}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}