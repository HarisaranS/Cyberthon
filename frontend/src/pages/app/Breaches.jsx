import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Plus, Clock, X, AlertTriangle } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { format, differenceInHours } from 'date-fns'

const STATUS_COLOR = { detected: 'var(--c3)', investigating: 'var(--c5)', contained: 'var(--c6)', notified: 'var(--c1)', closed: 'var(--c4)' }

export default function Breaches() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', severity: 'high' })

  const { data = [] } = useQuery({
    queryKey: ['breaches'],
    queryFn: () => api.get('/dashboard/breaches').then(r => r.data.data)
  })

  const createMut = useMutation({
    mutationFn: (d) => api.post('/dashboard/breaches', d),
    onSuccess: () => { qc.invalidateQueries(['breaches']); toast.success('Breach logged'); setShowModal(false); setForm({ title: '', description: '', severity: 'high' }) },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed')
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Breach Management</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>72-hour DPB notification compliance tracking</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-danger">
          <Plus size={14} /> Log Breach
        </button>
      </div>

      <div style={{ padding: '12px 16px', background: 'rgba(255,77,109,0.05)', border: '1px solid rgba(255,77,109,0.15)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--text)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <AlertTriangle size={14} style={{ color: 'var(--c3)', flexShrink: 0 }} />
        <span>Under global standards (GDPR/DPDPA), data breaches must be reported to the appropriate authority within <strong>72 hours</strong>. Non-compliance can result in significant financial and reputational loss.</span>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
          <Swords size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No breach events</h3>
          <p>Log a breach event when a personal data incident is detected</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((breach, i) => {
            const hoursLeft = breach.notifyDeadline ? Math.max(0, 72 - differenceInHours(new Date(), new Date(breach.detectedAt))) : null
            const urgent = hoursLeft !== null && hoursLeft < 12 && breach.status !== 'notified' && breach.status !== 'closed'
            return (
              <motion.div key={breach._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card" style={{ padding: '18px 20px', borderColor: urgent ? 'rgba(255,77,109,0.4)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{breach.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Detected: {format(new Date(breach.detectedAt), 'dd MMM yyyy, HH:mm')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge badge-${breach.severity}`} style={{ fontSize: 10 }}>{breach.severity}</span>
                    <span style={{ fontSize: 11, color: STATUS_COLOR[breach.status], fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>{breach.status}</span>
                  </div>
                </div>
                {breach.description && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{breach.description}</p>}
                {hoursLeft !== null && breach.status !== 'closed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: urgent ? 'rgba(255,77,109,0.08)' : 'rgba(0,229,255,0.05)', border: `1px solid ${urgent ? 'rgba(255,77,109,0.2)' : 'rgba(0,229,255,0.1)'}` }}>
                    <Clock size={13} style={{ color: urgent ? 'var(--c3)' : 'var(--c1)' }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: urgent ? 'var(--c3)' : 'var(--c1)', fontWeight: 600 }}>
                      {hoursLeft}h remaining for DPB notification
                    </span>
                    {urgent && <span className="badge badge-critical" style={{ fontSize: 9 }}>URGENT</span>}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{ background: 'var(--s1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, color: 'var(--c3)' }}>Log Breach Event</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>INCIDENT TITLE</label>
                  <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Describe the breach incident" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>SEVERITY</label>
                  <select className="input" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>DESCRIPTION</label>
                  <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What happened? What data was affected?" style={{ resize: 'vertical' }} />
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(255,77,109,0.05)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', border: '1px solid rgba(255,77,109,0.1)' }}>
                  ⚠️ 72-hour countdown starts immediately upon logging
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button onClick={() => createMut.mutate(form)} disabled={!form.title || createMut.isPending} className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                    {createMut.isPending ? 'Logging...' : 'Log Breach'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
