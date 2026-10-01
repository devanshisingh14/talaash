import { useEffect, useState } from 'react'

export default function MapTracking() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')
  const [tracking, setTracking] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setTracking(true)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        })

        setLastUpdated(new Date())
        setError('')
        setTracking(true)
      },
      (err) => {
        setTracking(false)
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '28px',
        background: '#f8fafc',
        color: '#111827',
        boxSizing: 'border-box',
      }}
    >
      {/* PAGE HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.5px',
            }}
          >
            Map View
          </h1>

          <p
            style={{
              margin: '7px 0 0',
              fontSize: '14px',
              color: '#64748b',
            }}
          >
            Real-time location monitoring and live device tracking
          </p>
        </div>

        {/* LIVE STATUS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 16px',
            background: tracking ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${
              tracking ? '#a7f3d0' : '#fecaca'
            }`,
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            color: tracking ? '#047857' : '#b91c1c',
          }}
        >
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: tracking ? '#10b981' : '#ef4444',
              boxShadow: tracking
                ? '0 0 0 4px rgba(16,185,129,0.12)'
                : 'none',
            }}
          />

          {tracking ? 'LIVE TRACKING' : 'TRACKING OFF'}
        </div>
      </div>

      {/* MAIN CARD */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
        }}
      >
        {/* CARD HEADER */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              Live Location
            </h2>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Current device position
            </p>
          </div>

          {lastUpdated && (
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                background: '#f8fafc',
                padding: '7px 11px',
                borderRadius: '7px',
              }}
            >
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* LOCATION DATA */}
        {location ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '14px',
                padding: '20px 22px',
              }}
            >
              {/* LATITUDE */}
              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '7px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Latitude
                </div>

                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                  }}
                >
                  {location.latitude.toFixed(6)}
                </div>
              </div>

              {/* LONGITUDE */}
              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '7px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Longitude
                </div>

                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                  }}
                >
                  {location.longitude.toFixed(6)}
                </div>
              </div>

              {/* ACCURACY */}
              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '7px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  GPS Accuracy
                </div>

                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                  }}
                >
                  ±{location.accuracy} m
                </div>
              </div>
            </div>

            {/* MAP */}
            <div
              style={{
                margin: '0 22px 22px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #dbe1e8',
                background: '#e5e7eb',
              }}
            >
              <iframe
                title="Live Location Map"
                width="100%"
                height="500"
                style={{
                  display: 'block',
                  border: 0,
                }}
                src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=16&output=embed`}
                allowFullScreen
              />
            </div>

            {/* INFO */}
            <div
              style={{
                margin: '0 22px 22px',
                padding: '13px 16px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '9px',
                color: '#075985',
                fontSize: '13px',
              }}
            >
              <strong>Live tracking active:</strong> Your browser location
              is being updated automatically while this page is open.
            </div>
          </>
        ) : (
          /* LOADING / ERROR */
          <div
            style={{
              padding: '70px 25px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '17px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              {error
                ? 'Unable to access location'
                : 'Getting current location...'}
            </div>

            <div
              style={{
                fontSize: '14px',
                color: error ? '#dc2626' : '#64748b',
              }}
            >
              {error ||
                'Please allow location access in your browser.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}