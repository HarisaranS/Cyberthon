import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import api from '../../lib/axios'
import { format } from 'date-fns'

const SENSITIVITY_COLOR = { sensitive_personal: 'var(--c3)', personal: 'var(--c5)', internal: 'var(--c1)', public: 'var(--c4)' }

export default function ScanDetail() {
  const { id } = useParams()
  const { data: scanData } = useQuery({ queryKey: ['scan', id], queryFn: () => api.get(`/scans/${id}`).then(r => r.data.data.job), refetchInterval: 5000 })
  const { data: results = [] } = useQuery({ queryKey: ['scan-results', id], queryFn: () => api.get(`/scans/${id}/results`).then(r => r.data.data) })

  const scan = scanData

  if (!scan) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/app/scans" style={{ color: 'var(--muted)', display: 'flex', textDecoration: 'none' }}><ArrowLeft size={20} /></Link>
        <div>
          <h1 style={{ fontSize: 22 }}>{scan.name}</h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
            {scan.startedAt ? format(new Date(scan.startedAt), 'dd MMM yyyy, HH:mm') : '—'} • {scan.status?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Files Scanned', val: scan.totalFilesScanned || 0, color: 'var(--c1)' },
          { label: 'PII Found', val: scan.totalPIIFound || 0, color: 'var(--c3)' },
          { label: 'Critical', val: scan.criticalFindings || 0, color: 'var(--c3)' },
          { label: 'High', val: scan.highFindings || 0, color: 'var(--c5)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 4, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {scan.status === 'running' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13 }}>Scanning: {scan.currentFile || 'Initializing...'}</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--c1)' }}>{scan.progress || 0}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${scan.progress || 0}%` }} />
          </div>
        </div>
      )}

      {/* Insight summary */}
      {scan.insightSummary && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(0,229,255,0.2)' }}>
          <div style={{ fontSize: 11, color: 'var(--c1)', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>AI INSIGHT SUMMARY</div>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{scan.insightSummary}</p>
        </div>
      )}

      {/* Results table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15 }}>Findings ({results.length})</h3>
        </div>
        {results.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            {scan.status === 'running' ? 'Scanning in progress...' : 'No findings yet'}
          </div>
        ) : (
          <div>
            <div className="table-row table-header" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 100px' }}>
              <span>FILE</span><span>PII TYPES FOUND</span><span>SENSITIVITY</span><span>RISK SCORE</span><span>STATUS</span>
            </div>
            {results.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="table-row" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 100px' }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: 'var(--text)' }}>{r.fileName}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.assetPath}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(r.detectedPII || []).slice(0, 3).map((p, j) => (
                    <span key={j} className={`badge badge-info`} style={{ fontSize: 9, padding: '2px 6px' }}>{p.piiType}</span>
                  ))}
                  {(r.detectedPII || []).length > 3 && <span style={{ fontSize: 10, color: 'var(--muted)' }}>+{r.detectedPII.length - 3}</span>}
                </div>
                <div style={{ fontSize: 12, color: SENSITIVITY_COLOR[r.sensitivityLevel] || 'var(--muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                  {r.sensitivityLevel?.replace('_', ' ')}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: r.riskScore >= 80 ? 'var(--c3)' : r.riskScore >= 60 ? 'var(--c5)' : 'var(--c4)' }}>
                  {r.riskScore}
                </div>
                <div>
                  <select 
                    value={r.remediationStatus}
                    onChange={async (e) => {
                      try {
                        await api.patch(`/dashboard/inventory/${r._id}`, { status: e.target.value })
                        window.location.reload()
                      } catch (err) {
                        console.error('Update failed', err)
                      }
                    }}
                    className="input" 
                    style={{ fontSize: 10, padding: '4px 6px', height: 26, width: 100 }}
                  >
                    <option value="pending">PENDING</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="resolved">RESOLVED</option>
                    <option value="accepted_risk">ACCEPTED</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
