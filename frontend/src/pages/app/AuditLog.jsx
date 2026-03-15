import React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ScrollText, ShieldCheck, Link, Download, FileJson } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AuditLog() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get('/dashboard/audit', { params: { limit: 50 } }).then(r => r.data.data)
  })

  const verifyMut = useMutation({
    mutationFn: () => api.get('/dashboard/audit/verify').then(r => r.data.data),
    onSuccess: (d) => toast.success(d.message || (d.valid ? 'Chain integrity verified!' : 'Chain integrity violation!')),
    onError: () => toast.error('Verification failed')
  })

  const exportCSV = () => {
    const headers = ['Action', 'User', 'Details', 'Outcome', 'Time', 'Hash']
    const rows = data.map(e => [
      e.action,
      e.userEmail,
      `${e.resourceType || ''} ${e.ipAddress}`,
      e.outcome,
      format(new Date(e.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      e.entryHash
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Audit Log</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Immutable audit trail with SHA-256 hash chain verification</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportCSV} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={exportJSON} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <FileJson size={14} /> JSON
          </button>
          <button onClick={() => verifyMut.mutate()} disabled={verifyMut.isPending} className="btn-primary">
            <ShieldCheck size={14} /> Verify Chain Integrity
          </button>
        </div>
      </div>

      <div style={{ padding: '10px 16px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link size={12} style={{ color: 'var(--c1)' }} />
        <span>Every entry is hashed and linked to the previous entry. Tampering with any record breaks the chain and is immediately detectable.</span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Loading audit log...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
          <ScrollText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No audit entries yet</h3>
          <p>Actions taken in the system will appear here</p>
        </div>
      ) : (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div className="table-row table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
            <span>ACTION</span><span>USER</span><span>DETAILS</span><span>OUTCOME</span><span>TIME</span><span>HASH (SHA-256)</span>
          </div>
          {data.map((entry, i) => (
            <motion.div key={entry._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="table-row" style={{ gridTemplateColumns: '1.2fr 1fr 1.5fr 0.8fr 1fr 1fr', padding: '12px 16px' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--c1)', fontWeight: '600' }}>{entry.action}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>{entry.userEmail?.split('@')[0] || 'system'}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{entry.userRole}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.resourceType && <span style={{ color: 'var(--text)', opacity: 0.8 }}>{entry.resourceType} • </span>}{entry.ipAddress}
              </div>
              <span className={`badge badge-${entry.outcome === 'success' ? 'low' : 'critical'}`} style={{ fontSize: 9, width: 'fit-content' }}>
                {entry.outcome}
              </span>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                {format(new Date(entry.timestamp), 'dd/MM HH:mm:ss')}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--muted)', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {entry.entryHash?.substring(0, 16)}...
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
