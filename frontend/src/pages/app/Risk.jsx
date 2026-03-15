import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, TrendingUp, Trash2 } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function Risk() {
  const { data: risk, refetch } = useQuery({
    queryKey: ['risk'],
    queryFn: () => api.get('/dashboard/risk').then(r => r.data.data)
  })

  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)

  const overallRisk = risk?.overallRisk || 0
  const riskColor = overallRisk >= 75 ? 'var(--c3)' : overallRisk >= 50 ? 'var(--c5)' : overallRisk >= 25 ? 'var(--c6)' : 'var(--c4)'

  const handleClearData = async () => {
    setClearing(true)
    try {
      await api.delete('/dashboard/inventory/clear')
      toast.success('All inventory data cleared successfully')
      setShowClearModal(false)
      refetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear data')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Risk Center</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Organizational risk posture and exposure analysis</div>
        </div>
        <button
          onClick={() => setShowClearModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#FFEBEE',
            color: 'var(--c3)',
            border: '1px solid #FFCDD2',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '13px'
          }}
        >
          <Trash2 size={14} /> Clear All Data
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
        {/* Overall risk gauge */}
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 16 }}>OVERALL RISK SCORE</div>
          <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 20px' }}>
            <svg viewBox="0 0 160 160" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="65" fill="none" stroke="var(--s3)" strokeWidth="12" />
              <circle cx="80" cy="80" r="65" fill="none" stroke={riskColor} strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 65 * overallRisk / 100} ${2 * Math.PI * 65 * (1 - overallRisk / 100)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 40, color: riskColor }}>{overallRisk}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>/ 100</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: riskColor, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
            {overallRisk >= 75 ? 'CRITICAL RISK' : overallRisk >= 50 ? 'HIGH RISK' : overallRisk >= 25 ? 'MEDIUM RISK' : 'LOW RISK'}
          </div>
        </div>

        {/* Risk by type chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Risk by PII Type</h3>
          {(risk?.riskByType || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(risk?.riskByType || []).slice(0, 10)} layout="vertical">
                <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="_id" type="category" tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={4}>
                  {(risk?.riskByType || []).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? 'var(--c3)' : i === 1 ? 'var(--c5)' : i === 2 ? 'var(--c6)' : 'var(--c1)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No risk data yet. Run scans to populate.
            </div>
          )}
        </div>
      </div>

      {/* Risk factors */}
      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Risk Factors</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Unencrypted PII', val: risk?.factors?.unencrypted || 0, color: 'var(--c3)' },
            { label: 'Excessive Access', val: risk?.factors?.excessiveAccess || 0, color: 'var(--c5)' },
            { label: 'No Consent Record', val: risk?.factors?.noConsent || 0, color: 'var(--c5)' },
            { label: 'Retention Violation', val: risk?.factors?.retentionViolation || 0, color: 'var(--c6)' },
            { label: 'Orphaned Data', val: risk?.factors?.orphanedData || 0, color: 'var(--c1)' },
          ].map((f, i) => (
            <div key={i} style={{ padding: '16px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, color: f.color }}>{f.val}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }}
            style={{ background: 'var(--s1)', border: '1px solid rgba(211,47,47,0.4)', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-start' }}>
              <AlertTriangle size={22} color="#D32F2F" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Clear All Inventory Data?</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  This will permanently delete all scan results and PII findings from your inventory. This action cannot be undone. You can run new scans to repopulate the data.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowClearModal(false)} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
              <button onClick={handleClearData} disabled={clearing}
                style={{ background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: clearing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, opacity: clearing ? 0.7 : 1 }}>
                {clearing ? 'Clearing…' : 'Clear All Data'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
