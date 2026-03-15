import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Download, Trash2, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const REPORT_TYPES = [
  { val: 'executive_summary', label: 'Executive Summary' },
  { val: 'annual_audit', label: 'Annual Audit Report' },
  { val: 'consent_management', label: 'Consent Management Report' },
  { val: 'nomination_registry', label: 'Nomination Registry Report' },
]

const STATUS_CFG = {
  ready: { icon: CheckCircle, color: 'var(--c4)', label: 'Ready' },
  generating: { icon: Clock, color: 'var(--c5)', label: 'Generating' },
  queued: { icon: Clock, color: 'var(--muted)', label: 'Queued' },
  failed: { icon: AlertCircle, color: 'var(--c3)', label: 'Failed' },
}

export default function Reports() {
  const qc = useQueryClient()
  const [type, setType] = useState('executive_summary')

  const { data = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/reports').then(r => r.data.data),
    refetchInterval: 8000
  })

  const genMut = useMutation({
    mutationFn: () => api.post('/reports/generate', { type, title: REPORT_TYPES.find(r => r.val === type)?.label }),
    onSuccess: () => { qc.invalidateQueries(['reports']); toast.success('Report generation started') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to generate')
  })

  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/reports/${id}`),
    onSuccess: () => { qc.invalidateQueries(['reports']); toast.success('Report deleted') }
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Reports</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Generate DPDPA-compliant reports for your DPO and management</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input" value={type} onChange={e => setType(e.target.value)} style={{ width: 260 }}>
            {REPORT_TYPES.map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
          </select>
          <button onClick={() => genMut.mutate()} disabled={genMut.isPending} className="btn-primary">
            <Plus size={14} /> {genMut.isPending ? 'Starting...' : 'Generate'}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No reports yet</h3>
          <p style={{ fontSize: 14 }}>Generate your first compliance report above</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {data.map((r, i) => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.queued
            return (
              <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} style={{ color: 'var(--c1)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{r.title}</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{r.type?.replace(/_/g, ' ').toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>•</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{format(new Date(r.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>•</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>by {r.generatedBy?.name || 'System'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <cfg.icon size={13} style={{ color: cfg.color }} />
                    <span style={{ fontSize: 11, color: cfg.color, fontFamily: 'JetBrains Mono' }}>{cfg.label}</span>
                  </div>
                  {r.status === 'ready' && (
                    <button 
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('ds_access_token')
                          const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/${r._id}/download`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          })
                          if (!response.ok) throw new Error('Download failed')
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${r.title.replace(/\s+/g, '_')}.pdf`
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                          toast.success('Report downloaded')
                        } catch (err) {
                          toast.error('Download failed')
                        }
                      }}
                      className="btn-secondary" 
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      <Download size={12} /> Download
                    </button>
                  )}
                  <button onClick={() => delMut.mutate(r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
