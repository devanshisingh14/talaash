import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function LoginPage() {
  // 'password' | 'otp' | 'forgot' | 'reset'
  const [step, setStep] = useState('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { login, verifyOtp, forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = await login(username, password)
      setInfo(data.message || 'A verification code has been sent to your registered email.')
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = await verifyOtp(username, otp)
      navigate(data.role === 'admin' ? '/admin' : '/officer')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = await forgotPassword(username)
      setInfo(data.message)
      setStep('reset')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await resetPassword(username, otp, newPassword)
      setInfo('Password updated. Please log in with your new password.')
      setStep('password')
      setPassword('')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function backToLogin() {
    setStep('password')
    setOtp('')
    setError(null)
    setInfo(null)
  }

  return (
    <div className="login-screen">
      {step === 'password' && (
        <form className="login-card" onSubmit={handlePasswordSubmit}>
          <div className="brand-mark" />
          <h1>TALAASH</h1>
          <p className="brand-sub">AI Missing Person System — Authorized Personnel Login</p>

          <label>
            User ID
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Checking...' : 'Login'}
          </button>

          <button type="button" className="link-btn" onClick={() => { setStep('forgot'); setError(null); setInfo(null) }}>
            Forgot password?
          </button>

          {info && <p className="form-success">{info}</p>}
          {error && <p className="form-error">{error}</p>}
        </form>
      )}

      {step === 'otp' && (
        <form className="login-card" onSubmit={handleOtpSubmit}>
          <div className="brand-mark" />
          <h1>Verify it's you</h1>
          <p className="brand-sub">{info}</p>

          <label>
            6-digit code
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
              maxLength={6}
              inputMode="numeric"
              placeholder="000000"
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify & Login'}
          </button>

          <button type="button" className="link-btn" onClick={backToLogin}>
            Back to login
          </button>

          {error && <p className="form-error">{error}</p>}
        </form>
      )}

      {step === 'forgot' && (
        <form className="login-card" onSubmit={handleForgotSubmit}>
          <div className="brand-mark" />
          <h1>Reset password</h1>
          <p className="brand-sub">Enter your User ID and we'll send a reset code to your registered email.</p>

          <label>
            User ID
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset code'}
          </button>

          <button type="button" className="link-btn" onClick={backToLogin}>
            Back to login
          </button>

          {error && <p className="form-error">{error}</p>}
        </form>
      )}

      {step === 'reset' && (
        <form className="login-card" onSubmit={handleResetSubmit}>
          <div className="brand-mark" />
          <h1>Enter reset code</h1>
          <p className="brand-sub">{info}</p>

          <label>
            6-digit code
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
              maxLength={6}
              inputMode="numeric"
              placeholder="000000"
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update password'}
          </button>

          <button type="button" className="link-btn" onClick={backToLogin}>
            Back to login
          </button>

          {error && <p className="form-error">{error}</p>}
        </form>
      )}
    </div>
  )
}
