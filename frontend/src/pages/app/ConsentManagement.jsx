import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, FileText, Plus, Search, Filter, Trash2, Download, ShieldCheck, Activity, Users, ChevronDown, X } from 'lucide-react'
import api from '../../lib/axios'

const STATUS_MAP = {
  obtained: { color: 'var(--c4)', bg: 'rgba(0,255,157,0.1)', icon: CheckCircle, label: 'OBTAINED', glow: '0,255,157' },
  active: { color: 'var(--c4)', bg: 'rgba(0,255,157,0.1)', icon: CheckCircle, label: 'OBTAINED', glow: '0,255,157' },
  withdrawn: { color: 'var(--c3)', bg: 'rgba(255,77,109,0.1)', icon: Trash2, label: 'WITHDRAWN', glow: '255,77,109' },
  pending: { color: 'var(--c5)', bg: 'rgba(255,176,32,0.1)', icon: Clock, label: 'PENDING', glow: '255,176,32' },
  expired: { color: 'var(--muted)', bg: 'rgba(255,255,255,0.05)', icon: Clock, label: 'EXPIRED', glow: '255,255,255' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function ConsentManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newConsent, setNewConsent] = useState({ principalName: '', principalEmail: '', purposeDescription: '', legalBasis: 'consent', collectionPoint: 'Web Portal' })
  const queryClient = useQueryClient()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['consents'],
    queryFn: () => api.get('/dpdpa/consent').then(r => r.data.data)
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/dpdpa/consent', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['consents'])
      setShowAddModal(false)
      setNewConsent({ principalName: '', principalEmail: '', purposeDescription: '', legalBasis: 'consent', collectionPoint: 'Web Portal' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/dpdpa/consent/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['consents'])
  })

  const stats = {
    total: records.length,
    active: records.filter(r => r.status === 'active' || r.status === 'obtained').length,
    withdrawn: records.filter(r => r.status === 'withdrawn').length,
    pending: records.filter(r => r.status === 'pending').length
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ padding: 12, background: 'rgba(0,102,204,0.1)', borderRadius: 16, border: '1px solid rgba(0,102,204,0.2)' }}>
            <ShieldCheck size={28} style={{ color: 'var(--c1)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>Consent Management Registry</h1>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, maxWidth: 600 }}>
              Immutable ledger of data principal consents compliant with DPDPA 2023 Section 6. Real-time verification routing and lifecycle tracking.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" style={{ fontSize: 13, height: 40, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Export Master Ledger
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ fontSize: 13, height: 40, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c1)', color: '#fff', border: 'none' }}>
            <Plus size={16} /> New Consent Entry
          </button>
        </div>
      </motion.div>

      {/* Stats Layer - Premium Glassmorphism */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Registered Consents', val: stats.total, color: 'var(--text)', icon: Users },
          { label: 'Active / Verified', val: stats.active, color: 'var(--c4)', icon: CheckCircle },
          { label: 'Withdrawal Rate (MTD)', val: stats.withdrawn, color: 'var(--c3)', icon: Activity },
          { label: 'Pending Verification', val: stats.pending, color: 'var(--c5)', icon: Clock },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'scale(2)' }}>
              <s.icon size={100} style={{ color: s.color }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 36, fontFamily: 'Syne', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </motion.div>

      {/* Dynamic Data Grid */}
      <motion.div variants={itemVariants} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--s1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 320 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              className="input" 
              placeholder="Search Cryptographic ID or Principal..." 
              style={{ paddingLeft: 42, fontSize: 13, height: 40, width: '100%', background: 'var(--bg)', borderColor: 'transparent' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary" style={{ height: 40, padding: '0 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} /> Advanced Filters
          </button>
        </div>

        {/* Grid Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr 1.5fr 1.5fr 50px', gap: 16, padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          {['Registry ID', 'Data Principal', 'Data Purpose', 'Timestamp', 'State', ''].map((h, i) => (
             <div key={i} style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</div>
          ))}
        </div>

        {/* Grid Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Synchronizing with ledger...</div>
          ) : records.filter(c => (c.principalName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c._id || '').includes(searchTerm.toLowerCase())).map((c, i) => {
            const status = STATUS_MAP[c.status] || STATUS_MAP.pending
            const isExpanded = expandedId === c._id
            return (
              <React.Fragment key={c._id}>
                <div 
                  className="hover-row"
                  onClick={() => setExpandedId(isExpanded ? null : c._id)}
                  style={{ 
                    display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr 1.5fr 1.5fr 50px', gap: 16, 
                    padding: '20px 24px', 
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--s1)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: 'var(--c1)', fontWeight: 500 }}>{c._id.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{c.principalName}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.purposeDescription}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{new Date(c.grantedAt).toLocaleDateString()}</div>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 24, background: status.bg, border: `1px solid rgba(${status.glow},0.2)`, boxShadow: (c.status === 'obtained' || c.status === 'active') ? `0 0 10px rgba(${status.glow},0.1)` : 'none' }}>
                      <status.icon size={14} style={{ color: status.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: status.color, letterSpacing: '0.5px' }}>{status.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--muted)' }}>
                    <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>Source Integration</div>
                          <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{c.collectionPoint || 'Public Portal'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>Notice Reference</div>
                          <div style={{ fontSize: 14, color: 'var(--c1)', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}>View Legal Basis: {c.legalBasis}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>Registry Object ID</div>
                          <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'JetBrains Mono', background: 'var(--bg)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12 }}>{c._id}</div>
                          <button onClick={() => deleteMutation.mutate(c._id)} style={{ background: 'rgba(255,77,109,0.1)', color: 'var(--c3)', border: '1px solid rgba(255,77,109,0.2)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                            <Trash2 size={14} /> Revoke & Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            )
          })}
        </div>
      </motion.div>

      {/* Compliance Warning */}
      <motion.div variants={itemVariants} style={{ marginTop: 32, padding: '20px 24px', background: 'rgba(0,102,204,0.08)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: 16, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,102,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c1)', flexShrink: 0, boxShadow: '0 0 20px rgba(0,102,204,0.2)' }}>
          <FileText size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '0.3px' }}>DPDPA Section 6 Compliance Notice</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Data Sentinel provides an immutable ledger for consent records. Ensure notice-specific metadata (Notice ID, Purpose, and Withdrawal paths) is cryptographically linked to every entry for full regulatory alignment.
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="card" style={{ width: 440, padding: 32, background: 'var(--s1)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 700 }}>Register New Consent</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Data Principal Name</label>
                   <input className="input" placeholder="e.g. John Doe" value={newConsent.principalName} onChange={e => setNewConsent({...newConsent, principalName: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Principal Email</label>
                   <input className="input" placeholder="e.g. john@example.com" value={newConsent.principalEmail} onChange={e => setNewConsent({...newConsent, principalEmail: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Purpose of Processing</label>
                   <input className="input" placeholder="e.g. Marketing & Analytics" value={newConsent.purposeDescription} onChange={e => setNewConsent({...newConsent, purposeDescription: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Legal Basis</label>
                   <select className="input" value={newConsent.legalBasis} onChange={e => setNewConsent({...newConsent, legalBasis: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}>
                     <option value="consent">Consent</option>
                     <option value="legitimate_interest">Legitimate Interest</option>
                     <option value="legal_obligation">Legal Obligation</option>
                   </select>
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                   <button onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                   <button onClick={() => addMutation.mutate(newConsent)} disabled={addMutation.isPending || !newConsent.principalName} className="btn-primary" style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--c1)', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: (!newConsent.principalName || addMutation.isPending) ? 0.5 : 1 }}>
                     {addMutation.isPending ? 'Registering...' : 'Register Object'}
                   </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
