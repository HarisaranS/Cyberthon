import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Database, Trash2, Play, X, UploadCloud, FileText, AlertTriangle } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const TYPE_META = {
  local:      { icon: '📁', label: 'File Upload',  color: '#22c55e' },
  mysql:      { icon: '🐬', label: 'MySQL',         color: '#00bcd4' },
  postgresql: { icon: '🐘', label: 'PostgreSQL',    color: '#3b82f6' },
  mongodb:    { icon: '🍃', label: 'MongoDB',       color: '#4ade80' },
  mssql:      { icon: '🪟', label: 'SQL Server',    color: '#60a5fa' },
  s3:         { icon: '☁️', label: 'AWS S3',        color: '#fb923c' },
}

const DB_TYPES = ['mysql', 'postgresql', 'mongodb', 'mssql', 's3']

function Label({ children }) {
  return (
    <label style={{
      fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5,
      fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.07em'
    }}>
      {children}
    </label>
  )
}

function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>
}

function CredFields({ type, creds, setCreds }) {
  const set = (k, v) => setCreds(c => ({ ...c, [k]: v }))
  if (type === 'local') return null
  if (['mysql', 'postgresql', 'mssql'].includes(type)) return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <Field label="Host">
          <input className="input" value={creds.host || ''} onChange={e => set('host', e.target.value)} placeholder="db.example.com" />
        </Field>
        <Field label="Port">
          <input className="input" type="number" value={creds.port || ''} onChange={e => set('port', e.target.value)}
            placeholder={type === 'postgresql' ? '5432' : type === 'mssql' ? '1433' : '3306'} />
        </Field>
      </div>
      <Field label="Database Name">
        <input className="input" value={creds.database || ''} onChange={e => set('database', e.target.value)} placeholder="mydb" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Username">
          <input className="input" value={creds.username || ''} onChange={e => set('username', e.target.value)} placeholder="root" />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={creds.password || ''} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
        </Field>
      </div>
    </>
  )
  if (type === 'mongodb') return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <Field label="Host">
          <input className="input" value={creds.host || ''} onChange={e => set('host', e.target.value)} placeholder="cluster.mongodb.net" />
        </Field>
        <Field label="Port">
          <input className="input" type="number" value={creds.port || ''} onChange={e => set('port', e.target.value)} placeholder="27017" />
        </Field>
      </div>
      <Field label="Database Name">
        <input className="input" value={creds.database || ''} onChange={e => set('database', e.target.value)} placeholder="mydb" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Username (optional)">
          <input className="input" value={creds.username || ''} onChange={e => set('username', e.target.value)} />
        </Field>
        <Field label="Password (optional)">
          <input className="input" type="password" value={creds.password || ''} onChange={e => set('password', e.target.value)} />
        </Field>
      </div>
      <Field label="Or paste full URI (overrides above)">
        <input className="input" value={creds.uri || ''} onChange={e => set('uri', e.target.value)}
          placeholder="mongodb://user:pass@host:27017/db" />
      </Field>
    </>
  )
  if (type === 's3') return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Access Key ID">
          <input className="input" value={creds.accessKeyId || ''} onChange={e => set('accessKeyId', e.target.value)} placeholder="AKIA..." />
        </Field>
        <Field label="Secret Access Key">
          <input className="input" type="password" value={creds.secretAccessKey || ''} onChange={e => set('secretAccessKey', e.target.value)} placeholder="••••••••" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Region">
          <input className="input" value={creds.region || ''} onChange={e => set('region', e.target.value)} placeholder="ap-south-1" />
        </Field>
        <Field label="Bucket Name">
          <input className="input" value={creds.bucket || ''} onChange={e => set('bucket', e.target.value)} placeholder="my-data-bucket" />
        </Field>
      </div>
      <Field label="Prefix / Folder (optional)">
        <input className="input" value={creds.prefix || ''} onChange={e => set('prefix', e.target.value)} placeholder="data/hr/" />
      </Field>
    </>
  )
  return null
}

function DeleteModal({ source, onConfirm, onCancel, loading }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }}
        style={{ background: 'var(--s1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-start' }}>
          <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Delete "{source.name}"?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              All scans, findings, and uploaded files will be <strong>permanently deleted</strong>. This cannot be undone.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DataSources() {
  const [showModal, setShowModal] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [form, setForm] = useState({ name: '' })
  const [creds, setCreds] = useState({})
  const [files, setFiles] = useState([])
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const res = await api.get('/sources')
      const data = Array.isArray(res.data.data) ? res.data.data : []
      setSources(data)
    } catch (err) {
      console.error('Failed to fetch sources:', err)
      setSources([])
      toast.error('Failed to load sources')
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedType(null)
    setForm({ name: '' })
    setCreds({})
    setFiles([])
    setTestResult(null)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await api.post('/sources/test', { type: selectedType, credentials: creds })
      setTestResult({ ok: true, msg: r.data.data?.message || 'Connection successful' })
    } catch (e) {
      setTestResult({ ok: false, msg: e.response?.data?.message || 'Connection failed' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Source name is required')
    setSaving(true)
    try {
      if (selectedType === 'local') {
        if (files.length === 0) return toast.error('Upload at least one file')
        const fd = new FormData()
        fd.append('name', form.name.trim())
        files.forEach(f => fd.append('files', f))
        await api.post('/sources/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        const cloudTypes = ['s3', 'azure_blob', 'google_drive', 'onedrive', 'sharepoint']
        const infrastructure = cloudTypes.includes(selectedType) ? 'cloud' : 'on-premises'
        await api.post('/sources', { 
          name: form.name.trim(), 
          type: selectedType, 
          credentials: creds,
          infrastructure
        })
      }
      toast.success('Source added!')
      closeModal()
      await new Promise(r => setTimeout(r, 500))
      fetchSources()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add source')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/sources/${id}`)
      toast.success('Source deleted')
      setDeleteTarget(null)
      fetchSources()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  const handleScan = async (id) => {
    try {
      await api.post('/scans', { connectorId: id, name: 'Quick scan' })
      toast.success('Scan started!')
      fetchSources()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start scan')
    }
  }

  const dropFiles = (e) => {
    e.preventDefault()
    e.currentTarget.style.borderColor = 'var(--border)'
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Data Sources</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Connect databases, upload files, or link cloud storage</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Add Source</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>Loading…</div>
      ) : sources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
          <Database size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8, color: 'var(--text)' }}>No sources yet</h3>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Add a source and run your first scan to discover PII.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={14} /> Add Your First Source</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {sources.map((s, i) => {
            const meta = TYPE_META[s.type] || { icon: '🗄️', label: s.type, color: '#94a3b8' }
            return (
              <motion.div key={s._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 28 }}>{meta.icon}</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--text)' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: meta.color, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginTop: 2 }}>{meta.label}</div>
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 8, flexShrink: 0, background: s.healthStatus === 'healthy' ? '#22c55e' : s.healthStatus === 'error' ? '#ef4444' : '#94a3b8' }} />
                </div>
                <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>PII Found</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: s.totalPIIFound > 0 ? '#ef4444' : '#22c55e' }}>{s.totalPIIFound || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Items Scanned</div>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>{s.totalFilesScanned || 0}</div>
                  </div>
                  {s.lastScannedAt && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Last Scan</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{format(new Date(s.lastScannedAt), 'dd MMM, HH:mm')}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleScan(s._id)}
                    className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}>
                    <Play size={12} /> Scan Now
                  </button>
                  <button onClick={() => setDeleteTarget(s)} style={{ padding: '7px 12px', fontSize: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}
            onClick={e => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, margin: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h3 style={{ fontSize: 18 }}>{selectedType ? `Configure ${TYPE_META[selectedType]?.label || selectedType}` : 'Choose Source Type'}</h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {!selectedType ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <button key={k} onClick={() => setSelectedType(k)}
                      style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 10px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s, background 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = v.color; e.currentTarget.style.background = 'var(--s1)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)' }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>{v.icon}</div>
                      <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{v.label}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Source Name">
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={selectedType === 'local' ? 'HR Documents' : 'Production DB'} autoFocus />
                  </Field>

                  {selectedType === 'local' && (
                    <div>
                      <Label>Upload Files</Label>
                      <div onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e' }}
                        onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                        onDrop={dropFiles}
                        style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: 'var(--s2)', transition: 'border-color 0.2s' }}>
                        <UploadCloud size={28} style={{ color: 'var(--muted)', marginBottom: 8 }} />
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Drag & drop or click to browse</div>
                        <input ref={fileRef} type="file" multiple hidden
                          accept=".csv,.txt,.pdf,.docx,.xlsx,.xls,.json,.xml,.log,.zip,.jpg,.jpeg,.png,.py,.js,.ts,.java,.env,.yaml,.yml,.sql,.md"
                          onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                      </div>
                      {files.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                          {files.map((f, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--s2)', borderRadius: 7, padding: '6px 10px', fontSize: 12 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                                <FileText size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                              </span>
                              <button onClick={() => setFiles(files.filter((_, j) => j !== idx))}
                                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', flexShrink: 0 }}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <CredFields type={selectedType} creds={creds} setCreds={setCreds} />

                  {DB_TYPES.includes(selectedType) && selectedType !== 'local' && (
                    <div>
                      <button onClick={testConnection} disabled={testing}
                        style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', cursor: testing ? 'not-allowed' : 'pointer', color: 'var(--text)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: testing ? 0.7 : 1 }}>
                        🔌 {testing ? 'Testing…' : 'Test Connection'}
                      </button>
                      {testResult && (
                        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 7, fontSize: 12, background: testResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: testResult.ok ? '#22c55e' : '#ef4444', border: `1px solid ${testResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                          {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '10px 12px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
                    🔒 Credentials are AES-256 encrypted before storage.
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={() => { setSelectedType(null); setCreds({}); setFiles([]) }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                    <button onClick={handleSave} disabled={!form.name.trim() || saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      {saving ? 'Saving…' : 'Save Source'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            source={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget._id)}
            onCancel={() => setDeleteTarget(null)}
            loading={false}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
