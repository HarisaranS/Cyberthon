import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/app')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛡</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--c1)' }}>DataSentinel</div>
          </Link>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>Sign in to your account</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontFamily: 'JetBrains Mono' }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@company.com" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontFamily: 'JetBrains Mono' }}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--c1)', textDecoration: 'none' }}>Create one</Link>
          </div>
        </div>

      </motion.div>
    </div>
  )
}
