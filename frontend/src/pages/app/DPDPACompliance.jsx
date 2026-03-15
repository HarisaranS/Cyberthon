import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle, AlertCircle, XCircle, Activity, Lock, Database, Trash2, Plus, X } from 'lucide-react'
import api from '../../lib/axios'

const STATUS_ICONS = {
  compliant: { icon: CheckCircle, color: 'var(--c4)', label: 'COMPLIANT' },
  partial: { icon: AlertCircle, color: 'var(--c5)', label: 'PARTIAL' },
  non_compliant: { icon: XCircle, color: 'var(--c3)', label: 'NON-COMPLIANT' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function DPDPACompliance() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({ section: 'Section ', requirement: '', status: 'non_compliant', evidence: '' })
  const queryClient = useQueryClient()

  const { data: compliance } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => api.get('/dpdpa/compliance').then(r => r.data)
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/dpdpa/compliance', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance'])
      setShowAddModal(false)
      setNewItem({ section: 'Section ', requirement: '', status: 'non_compliant', evidence: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/dpdpa/compliance/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['compliance'])
  })

  const score = compliance?.score || 0
  const checklist = compliance?.checklist || []

  // Dynamic gradient based on health
  const glowColor = score >= 80 ? '0,255,157' : score >= 60 ? '255,176,32' : '255,77,109'
  const scoreHex = score >= 80 ? 'var(--c4)' : score >= 60 ? 'var(--c5)' : 'var(--c3)'

  return (
    <>
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ padding: 12, background: 'rgba(124,95,255,0.1)', borderRadius: 16, border: '1px solid rgba(124,95,255,0.2)' }}>
          <Shield size={28} style={{ color: 'var(--c2)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>Compliance Master Hub</h1>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, maxWidth: 600 }}>
            Centralized orchestration engine for DPDPA 2023 readiness. Monitoring algorithmic tracking, consent lifecycles, and cryptographic boundary protections.
          </div>
        </div>
      </motion.div>

      {/* Top Interactive Metric Layer */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 24, marginBottom: 32 }}>
        
        {/* Core Score Ring */}
        <div className="card" style={{ position: 'relative', padding: 32, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, background: `radial-gradient(circle, rgba(${glowColor},0.15) 0%, rgba(0,0,0,0) 70%)` }} />
          
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
              <span 
                className={score >= 60 && score < 80 ? "animate-pulse" : ""}
                style={{ 
                  fontFamily: 'Syne', 
                  fontWeight: 800, 
                  fontSize: 84, 
                  lineHeight: 1, 
                  textShadow: `0 0 30px rgba(${glowColor},0.4)`,
                  ...(score >= 60 && score < 80 
                    ? { background: 'linear-gradient(90deg, #f97316, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
                    : { color: scoreHex }
                  )
                }}>
                {score}
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--muted)' }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, letterSpacing: '2px', marginTop: 16, textTransform: 'uppercase' }}>
              Nexus Health Index
            </div>
          </div>
        </div>

        {/* Pillar Breakdown with Hover Effects */}
        <div className="card" style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Activity size={18} style={{ color: 'var(--muted)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Compliance DNA Breakdown</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(compliance?.pillars || { consent: 92, rights: 85, obligations: 64, technical: 98 }).map(([key, val], idx) => {
               const pColor = val >= 80 ? 'var(--c4)' : val >= 60 ? 'var(--c5)' : 'var(--c3)'
               return (
                <motion.div key={key} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 0.3 + (idx*0.1), duration: 0.8, ease: "easeOut" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key} Vectors</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 600, color: pColor }}>{val}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6, background: 'var(--s1)', borderRadius: 3 }}>
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${val}%` }} 
                      transition={{ delay: 0.5 + (idx*0.1), duration: 1, type: 'spring' }}
                      className="progress-fill" 
                      style={{ 
                        height: '100%', 
                        borderRadius: 3, 
                        background: `linear-gradient(90deg, ${pColor}, color-mix(in srgb, ${pColor} 50%, transparent))`, 
                        boxShadow: `0 0 10px color-mix(in srgb, ${pColor} 30%, transparent)` 
                      }} 
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* DPDPA Checklist Grid */}
      <motion.div variants={itemVariants} className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--s1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={16} style={{ color: 'var(--c1)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.5px' }}>Section Adherence Ledger</h3>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Real-time audit trailing</div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ fontSize: 12, height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--c1)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
               <Plus size={14} /> Add Requirement
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {checklist.length === 0 ? (
             <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
               Initializing regulatory manifest...
             </div>
          ) : checklist.map((item, i) => {
            const cfg = STATUS_ICONS[item.status] || STATUS_ICONS.partial
            return (
              <motion.div 
                key={item._id || i} 
                className="hover-row"
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: i < checklist.length - 1 ? '1px solid var(--border)' : 'none', 
                  display: 'flex', 
                  gap: 20, 
                  alignItems: 'center',
                  background: 'transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `var(--s1)`, border: `1px solid ${cfg.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <cfg.icon size={20} style={{ color: cfg.color }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                    <span className="badge" style={{ fontSize: 10, background: 'rgba(0,102,204,0.1)', color: 'var(--c1)', borderColor: 'rgba(0,102,204,0.2)' }}>{item.section}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{item.requirement}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={12} />
                    {item.evidence || 'Awaiting cryptographic evidence link...'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select 
                    value={item.status}
                    onChange={async (e) => {
                      try {
                        await api.patch(`/dashboard/compliance/${item._id}`, { status: e.target.value })
                        window.location.reload()
                      } catch (err) {
                        console.error('Update failed', err)
                      }
                    }}
                    className="input" 
                    style={{ 
                      fontSize: 12, 
                      fontWeight: 600,
                      padding: '8px 12px', 
                      width: 160, 
                      height: 38,
                      background: 'var(--s1)',
                      color: cfg.color,
                      borderColor: `var(--border)`,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="non_compliant">NON-COMPLIANT</option>
                    <option value="partial">PARTIAL</option>
                    <option value="compliant">COMPLIANT</option>
                  </select>
                  <button onClick={() => deleteMutation.mutate(item._id)} style={{ background: 'none', border: 'none', color: 'var(--c3)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 8, borderRadius: 6, opacity: 0.7 }} title="Delete Requirement">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="card" style={{ width: 440, padding: 32, background: 'var(--s1)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 700 }}>Add Compliance Requirement</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Section Reference</label>
                   <input className="input" placeholder="e.g. Section 12" value={newItem.section} onChange={e => setNewItem({...newItem, section: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Requirement Description</label>
                   <input className="input" placeholder="e.g. Data Portability" value={newItem.requirement} onChange={e => setNewItem({...newItem, requirement: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Current Status</label>
                   <select className="input" value={newItem.status} onChange={e => setNewItem({...newItem, status: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}>
                     <option value="non_compliant">NON-COMPLIANT</option>
                     <option value="partial">PARTIAL</option>
                     <option value="compliant">COMPLIANT</option>
                   </select>
                 </div>
                 <div>
                   <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Evidentiary Link</label>
                   <input className="input" placeholder="e.g. Verified via API" value={newItem.evidence} onChange={e => setNewItem({...newItem, evidence: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                   <button onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                   <button onClick={() => addMutation.mutate(newItem)} disabled={addMutation.isPending || !newItem.section || !newItem.requirement} className="btn-primary" style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--c1)', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: (!newItem.section || !newItem.requirement || addMutation.isPending) ? 0.5 : 1 }}>
                     {addMutation.isPending ? 'Saving...' : 'Add Requirement'}
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
