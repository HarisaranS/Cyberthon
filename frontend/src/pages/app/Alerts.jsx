import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Eye } from 'lucide-react'
import api from '../../lib/axios'
import { useAlertStore } from '../../store/alertStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const SEV_COLOR = { critical: 'var(--c3)', high: 'var(--c5)', medium: 'var(--c6)', low: 'var(--c4)', info: 'var(--c1)' }

export default function Alerts() {
  const qc = useQueryClient()
  const { fetchUnread } = useAlertStore()
  const [severity, setSeverity] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['alerts', severity],
    queryFn: () => api.get('/alerts', { params: { severity, limit: 50 } }).then(r => r.data.data),
    refetchInterval: 15000
  })

  const markAllMut = useMutation({
    mutationFn: () => api.post('/alerts/mark-all-read'),
    onSuccess: () => { qc.invalidateQueries(['alerts']); fetchUnread(); toast.success('All marked as read') }
  })

  const readMut = useMutation({
    mutationFn: (id) => api.patch(`/alerts/${id}/read`),
    onSuccess: () => { qc.invalidateQueries(['alerts']); fetchUnread() }
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Alerts</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Security and compliance alerts from your data sources</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input" value={severity} onChange={e => setSeverity(e.target.value)} style={{ width: 160 }}>
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending} className="btn-secondary">
            <CheckCheck size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Loading...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
          <Bell size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No alerts</h3>
          <p>You're all clear. Alerts will appear when scan findings need attention.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((alert, i) => (
            <motion.div key={alert._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', opacity: alert.isRead ? 0.7 : 1, borderColor: !alert.isRead ? `rgba(${alert.severity === 'critical' ? '255,77,109' : '255,176,32'},0.2)` : 'var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEV_COLOR[alert.severity] || 'var(--muted)', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>{alert.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                    <span className={`badge badge-${alert.severity}`} style={{ fontSize: 9 }}>{alert.severity}</span>
                    {!alert.isRead && (
                      <button onClick={() => readMut.mutate(alert._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {alert.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{alert.description}</div>}
                {alert.affectedAsset && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>Asset: {alert.affectedAsset}</div>}
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{format(new Date(alert.createdAt), 'dd MMM yyyy, HH:mm')}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
