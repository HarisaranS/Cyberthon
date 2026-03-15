import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to DataSentinel.')
      navigate('/app')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
    setLoading(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛡</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--c1)' }}>DataSentinel</div>
          </Link>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>Create your account — 14 days free</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'name', label: 'FULL NAME', type: 'text', placeholder: 'Priya Sharma' },
              { key: 'orgName', label: 'ORGANISATION NAME', type: 'text', placeholder: 'Acme Corp' },
              { key: 'email', label: 'WORK EMAIL', type: 'email', placeholder: 'you@company.com' },
              { key: 'password', label: 'PASSWORD', type: 'password', placeholder: '8+ characters' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, display: 'block', fontFamily: 'JetBrains Mono' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={set(f.key)} className="input" placeholder={f.placeholder} required />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--c1)', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
          By creating an account you agree to our Terms of Service and Privacy Policy
        </div>
      </motion.div>
    </div>
  )
}
