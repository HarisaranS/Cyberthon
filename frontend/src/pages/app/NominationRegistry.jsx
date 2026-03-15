import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Shield, Info, Plus, Search, Filter, Trash2, Edit, ChevronRight, CheckCircle, Clock, Building, X } from 'lucide-react'
import api from '../../lib/axios'

const STATUS_MAP = {
  verified: { color: 'var(--c4)', bg: 'rgba(0,255,157,0.1)', icon: CheckCircle, label: 'VERIFIED', glow: '0,255,157' },
  pending: { color: 'var(--c5)', bg: 'rgba(255,176,32,0.1)', icon: Clock, label: 'AWAITING KYC', glow: '255,176,32' },
  revoked: { color: 'var(--c3)', bg: 'rgba(255,77,109,0.1)', icon: Trash2, label: 'REVOKED', glow: '255,77,109' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function NominationRegistry() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNomination, setNewNomination] = useState({ principalName: '', principalId: '', nomineeName: '', relation: 'Spouse' })
  const queryClient = useQueryClient()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['nominations'],
    queryFn: () => api.get('/dpdpa/nomination').then(r => r.data.data)
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/dpdpa/nomination', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['nominations'])
      setShowAddModal(false)
      setNewNomination({ principalName: '', principalId: '', nomineeName: '', relation: 'Spouse' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/dpdpa/nomination/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['nominations'])
  })

  const stats = {
    total: records.length,
    verified: records.filter(r => r.status === 'verified').length,
    pending: records.filter(r => r.status === 'pending').length
  }

  return (
    <>
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ padding: 12, background: 'rgba(124,95,255,0.1)', borderRadius: 16, border: '1px solid rgba(124,95,255,0.2)' }}>
            <Building size={28} style={{ color: 'var(--c2)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>Right to Nominate Registry</h1>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, maxWidth: 600 }}>
              Immutable recording of Data Principal succession rights (DPDPA 2023 Section 10). Cryptographically verified nominee delegations.
            </div>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ fontSize: 13, height: 40, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c2)', color: '#fff', border: 'none' }}>
           <Plus size={16} /> Lodge Nomination
        </button>
      </motion.div>

      {/* DPDPA Alert Box */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <div style={{ padding: '16px 20px', background: 'rgba(124,95,255,0.08)', border: '1px solid rgba(124,95,255,0.2)', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(124,95,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c2)', flexShrink: 0, boxShadow: '0 0 20px rgba(124,95,255,0.2)' }}>
             <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '0.3px' }}>Section 10 Preservation Mandate</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              Data principals retain the right to nominate an individual to exercise their rights in the event of death or incapacity. This registry maintains verified, immutable relationships linking Principal IDs to Nominee KYC parameters.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Layer */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {[
          { label: 'Total Delegations', val: stats.total, color: 'var(--text)' },
          { label: 'KYC Verified Nominees', val: stats.verified, color: 'var(--c4)' },
          { label: 'Verification Awaited', val: stats.pending, color: 'var(--c5)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 42, fontFamily: 'Syne', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={itemVariants} className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input 
            className="input" 
            placeholder="Search by Principal Hash, Name, or Nominee..." 
            style={{ paddingLeft: 46, fontSize: 14, height: 44, width: '100%', background: 'var(--bg)', borderColor: 'transparent' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Premium Registry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            Retrieving succession matrix...
          </div>
        ) : records.filter(n => 
          (n.principalName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (n.nomineeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n._id || '').includes(searchTerm)
        ).map((n, i) => {
          const status = STATUS_MAP[n.status] || STATUS_MAP.pending
          return (
            <motion.div 
              key={n._id} variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', background: 'var(--s1)' }}
            >
              <div style={{ padding: 24, background: 'var(--bg)', flex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                   <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,95,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,95,255,0.2)' }}>
                     <User size={24} style={{ color: 'var(--c2)' }} />
                   </div>
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 20, background: status.bg, border: `1px solid rgba(${status.glow},0.2)` }}>
                      <status.icon size={12} style={{ color: status.color }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: status.color, letterSpacing: '0.5px' }}>{status.label}</span>
                   </div>
                 </div>
                 
                 <div style={{ marginBottom: 16 }}>
                   <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>Designated Nominee</div>
                   <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{n.nomineeName}</div>
                   <div style={{ fontSize: 13, color: 'var(--c2)', marginTop: 2, fontWeight: 500 }}>{n.relation} of {n.principalName}</div>
                 </div>
                 
                 <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>Lodged Date</div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{new Date(n.lodgedAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>Registry ID</div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{n._id.slice(-8).toUpperCase()}</div>
                    </div>
                 </div>
              </div>
              
              <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>PRIN: {n.principalId.slice(0, 8)}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, transition: 'color 0.2s ease' }} title="Analyze Chain">
                    <Shield size={14} /> Audit
                  </button>
                  <button onClick={() => deleteMutation.mutate(n._id)} style={{ background: 'none', border: 'none', color: 'var(--c3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, transition: 'color 0.2s ease' }} title="Revoke">
                    <Trash2 size={14} /> Revoke
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Section info */}
      <motion.div variants={itemVariants} style={{ marginTop: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.3px' }}>
          Displaying verified internal nomination records. All mappings are cryptographically bound to Data Principal identifiers.
        </p>
      </motion.div>
    </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="card" style={{ width: 440, padding: 32, background: 'var(--s1)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 700 }}>Lodge Succession Right</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Principal Identifier (PRIN-XXXX)</label>
                   <input className="input" placeholder="e.g. PRIN-9999" value={newNomination.principalId} onChange={e => setNewNomination({...newNomination, principalId: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Data Principal Name</label>
                   <input className="input" placeholder="e.g. John Doe" value={newNomination.principalName} onChange={e => setNewNomination({...newNomination, principalName: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Designated Nominee Name</label>
                   <input className="input" placeholder="e.g. Jane Doe" value={newNomination.nomineeName} onChange={e => setNewNomination({...newNomination, nomineeName: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Relationship to Principal</label>
                   <select className="input" value={newNomination.relation} onChange={e => setNewNomination({...newNomination, relation: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}>
                     <option value="Spouse">Spouse</option>
                     <option value="Child">Child</option>
                     <option value="Parent">Parent</option>
                     <option value="Sibling">Sibling</option>
                     <option value="Legal Representative">Legal Representative</option>
                   </select>
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                   <button onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                   <button onClick={() => addMutation.mutate(newNomination)} disabled={addMutation.isPending || !newNomination.principalName || !newNomination.nomineeName || !newNomination.principalId} className="btn-primary" style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--c2)', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: (!newNomination.principalName || !newNomination.nomineeName || !newNomination.principalId || addMutation.isPending) ? 0.5 : 1 }}>
                     {addMutation.isPending ? 'Cryptographically Binding...' : 'Confirm Delegation'}
                   </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
