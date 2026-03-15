import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, Filter, ChevronDown, ChevronRight, Eye, AlertTriangle, Trash2 } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const SENSITIVITY_COLOR = { sensitive_personal: 'var(--c3)', personal: 'var(--c5)', internal: 'var(--c1)', public: 'var(--c4)' }

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [sensitivity, setSensitivity] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory', search, sensitivity],
    queryFn: () => api.get('/dashboard/inventory', { params: { search, sensitivity, limit: 50 } }).then(r => r.data.data)
  })

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => api.get('/dashboard/inventory/stats').then(r => r.data.data)
  })

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.get('/sources').then(r => (r.data.data && r.data.data.data) || [])
  })

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

  const items = data || []
  const srcList = sources || []

  // Categorize sources
  const onPremSources = srcList.filter(s => ['local', 'mysql', 'postgresql', 'mongodb', 'mssql'].includes(s.type))
  const cloudSources = srcList.filter(s => ['s3', 'gcs', 'azure_blob'].includes(s.type))

  // Categorize inventory items by dataSourceId type
  const onPremItems = items.filter(item => {
    const sourceType = item.dataSourceId?.type
    return !sourceType || ['local', 'mysql', 'postgresql', 'mongodb', 'mssql'].includes(sourceType)
  })
  
  const cloudItems = items.filter(item => {
    const sourceType = item.dataSourceId?.type
    return sourceType && ['s3', 'gcs', 'azure_blob'].includes(sourceType)
  })

  const renderInventoryTable = (itemList, emptyMessage) => {
    if (itemList.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--muted)', background: 'var(--s2)', borderRadius: 8 }}>
          <p style={{ fontSize: 13 }}>{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div className="table-row table-header" style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr 100px' }}>
          <span>FILE / PATH</span><span>SENSITIVITY</span><span>PII TYPES</span><span>RISK SCORE</span><span>REMEDIATION</span>
        </div>
        {itemList.map((item, i) => (
          <React.Fragment key={item._id}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="table-row" style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr 100px', cursor: 'pointer' }}
              onClick={() => setExpandedRow(expandedRow === item._id ? null : item._id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {expandedRow === item._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: 'var(--text)' }}>{item.fileName}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{item.assetPath}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, color: SENSITIVITY_COLOR[item.sensitivityLevel], fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                {item.sensitivityLevel?.replace('_', ' ')}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(item.detectedPII || []).slice(0, 4).map((p, j) => (
                  <span key={j} className="badge badge-info" style={{ fontSize: 9, padding: '2px 5px' }}>{p.piiType}</span>
                ))}
                {item.detectedPII?.length > 4 && (
                  <span className="badge" style={{ fontSize: 9, padding: '2px 5px', background: 'var(--muted)', color: 'var(--text)' }}>+{item.detectedPII.length - 4}</span>
                )}
              </div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: item.riskScore >= 80 ? 'var(--c3)' : item.riskScore >= 60 ? 'var(--c5)' : 'var(--c4)' }}>
                {item.riskScore}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                <select 
                  value={item.remediationStatus}
                  onChange={async (e) => {
                    try {
                      await api.patch(`/dashboard/inventory/${item._id}`, { status: e.target.value })
                      window.location.reload()
                    } catch (err) {
                      console.error('Update failed', err)
                    }
                  }}
                  className="input" 
                  style={{ fontSize: 10, padding: '4px 6px', height: 28, width: 110 }}
                >
                  <option value="pending">PENDING</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="accepted_risk">ACCEPTED</option>
                </select>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {expandedRow === item._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', background: 'var(--s2)' }}
                >
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <AlertTriangle size={16} color="var(--c3)" />
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>Detected PII Details ({item.detectedPII?.length || 0} instances)</h3>
                    </div>
                    
                    <div style={{ display: 'grid', gap: 12 }}>
                      {(item.detectedPII || []).map((pii, idx) => (
                        <div key={idx} style={{ 
                          background: 'var(--s1)', 
                          border: '1px solid var(--border)', 
                          borderRadius: 8, 
                          padding: 12,
                          display: 'grid',
                          gridTemplateColumns: '120px 200px 1fr 80px',
                          gap: 12,
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase' }}>PII Type</div>
                            <span className="badge badge-danger" style={{ fontSize: 10 }}>{pii.piiType}</span>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase' }}>Masked Value</div>
                            <div style={{ 
                              fontFamily: 'JetBrains Mono', 
                              fontSize: 11, 
                              color: 'var(--c3)',
                              background: 'var(--s2)',
                              padding: '4px 8px',
                              borderRadius: 4,
                              border: '1px solid var(--border)'
                            }}>
                              {pii.maskedValue || '***REDACTED***'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase' }}>Context</div>
                            <div style={{ 
                              fontSize: 11, 
                              color: 'var(--muted)', 
                              fontFamily: 'JetBrains Mono',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {pii.contextSnippet || 'No context available'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase' }}>Confidence</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c4)' }}>
                              {Math.round((pii.confidence || 0.95) * 100)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: 16, padding: 12, background: 'var(--s1)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>⚠️ DPDPA 2023 Compliance Note:</div>
                      <div style={{ fontSize: 11, color: 'var(--text)' }}>
                        This asset contains <strong>{item.detectedPII?.length || 0} PII instances</strong> with risk score <strong style={{ color: 'var(--c3)' }}>{item.riskScore}</strong>. 
                        Under Section 8, you must implement appropriate security safeguards and notify the Data Protection Board within 72 hours of any breach.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Data Asset Inventory</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>All discovered PII assets across your data sources</div>
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Assets', val: stats?.total || 0, color: 'var(--c1)' },
          { label: 'Sensitive Personal', val: stats?.sensitive || 0, color: 'var(--c3)' },
          { label: 'Personal', val: stats?.personal || 0, color: 'var(--c5)' },
          { label: 'Internal', val: stats?.internal || 0, color: 'var(--c1)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 4, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" value={sensitivity} onChange={e => setSensitivity(e.target.value)} style={{ width: 200 }}>
          <option value="">All Sensitivity Levels</option>
          <option value="sensitive_personal">Sensitive Personal</option>
          <option value="personal">Personal</option>
          <option value="internal">Internal</option>
          <option value="public">Public</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Loading inventory...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No assets found</h3>
          <p>Run a scan first to populate your inventory</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* On-Premises Section */}
          {onPremItems.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg, var(--c1), var(--c2))', borderRadius: 2 }} />
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>On-Premises</h2>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', background: 'var(--s2)', padding: '2px 8px', borderRadius: 4 }}>
                  {onPremItems.length} {onPremItems.length === 1 ? 'asset' : 'assets'}
                </span>
              </div>
              {renderInventoryTable(onPremItems, 'No on-premises assets yet')}
            </div>
          )}

          {/* Cloud Section */}
          {cloudItems.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg, var(--c5), var(--c6))', borderRadius: 2 }} />
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Cloud</h2>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', background: 'var(--s2)', padding: '2px 8px', borderRadius: 4 }}>
                  {cloudItems.length} {cloudItems.length === 1 ? 'asset' : 'assets'}
                </span>
              </div>
              {renderInventoryTable(cloudItems, 'No cloud assets yet')}
            </div>
          )}
        </div>
      )}

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
