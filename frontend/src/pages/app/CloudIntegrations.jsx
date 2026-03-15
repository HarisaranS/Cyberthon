import React, { useState, useEffect } from 'react'
import {
  Cloud, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle,
  Database, HardDrive, Globe, Cpu, Shield, ChevronDown, ChevronUp,
  Eye, EyeOff, Loader, Server
} from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const PROVIDER_META = {
  aws:   { label: 'Amazon Web Services', color: '#FF9900', icon: '🟠', bg: '#FF990015' },
  gcp:   { label: 'Google Cloud Platform', color: '#4285F4', icon: '🔵', bg: '#4285F415' },
  azure: { label: 'Microsoft Azure', color: '#0089D6', icon: '🩵', bg: '#0089D615' },
}

const RESOURCE_TYPE_ICONS = {
  s3: HardDrive, azure_blob: HardDrive, gcs: HardDrive,
  mysql: Database, postgresql: Database, mssql: Database,
  dynamodb: Cpu, rest_api: Globe, unknown: Server
}

function StatBadge({ children, color }) {
  return (
    <span style={{ background: `${color}15`, color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {children}
    </span>
  )
}

function ProviderCard({ provider, credentials, onDelete, onDiscover }) {
  const meta = PROVIDER_META[provider] || {}
  const creds = credentials.filter(c => c.provider === provider)

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16, padding: 24,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          {meta.icon}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{meta.label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{creds.length} credential set{creds.length !== 1 ? 's' : ''} configured</div>
        </div>
      </div>

      {creds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', borderRadius: 10, border: '1px dashed var(--border)', fontSize: 13 }}>
          No {provider.toUpperCase()} credentials added yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {creds.map(cred => (
            <div key={cred._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--s2)', borderRadius: 10, padding: '12px 16px',
              border: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{cred.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {cred.discoveredResources > 0 && <StatBadge color={meta.color}>{cred.discoveredResources} resources</StatBadge>}
                  {cred.lastDiscoveredAt && <span>Last: {new Date(cred.lastDiscoveredAt).toLocaleDateString()}</span>}
                  <span style={{ fontWeight: 600, color: cred.status === 'active' ? '#22c55e' : cred.status === 'error' ? '#ef4444' : '#f59e0b' }}>
                    ● {cred.status}
                  </span>
                </div>
                {cred.lastError && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>{cred.lastError}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onDiscover(cred._id)}
                  title="Discover cloud resources"
                  style={{ padding: '6px 12px', background: meta.color, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                >
                  Discover
                </button>
                <button
                  onClick={() => onDelete(cred._id)}
                  title="Remove credentials"
                  style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #ef444440', borderRadius: 6, cursor: 'pointer', color: '#ef4444' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddCredentialForm({ onAdd, onCancel }) {
  const [provider, setProvider] = useState('aws')
  const [label, setLabel] = useState('')
  const [fields, setFields] = useState({
    accessKeyId: '', secretAccessKey: '', region: 'us-east-1',
    projectId: '', serviceAccountJson: '',
    tenantId: '', clientId: '', clientSecret: '', subscriptionId: ''
  })
  const [loading, setLoading] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!label) return toast.error('Please enter a label for these credentials')
    setLoading(true)
    try {
      let credentials = {}
      if (provider === 'aws') {
        if (!fields.accessKeyId || !fields.secretAccessKey) return toast.error('Access Key ID and Secret are required')
        credentials = { accessKeyId: fields.accessKeyId, secretAccessKey: fields.secretAccessKey, region: fields.region }
      } else if (provider === 'gcp') {
        if (!fields.projectId) return toast.error('Project ID is required')
        credentials = { projectId: fields.projectId, serviceAccountJson: fields.serviceAccountJson ? JSON.parse(fields.serviceAccountJson) : null }
      } else if (provider === 'azure') {
        if (!fields.tenantId || !fields.clientId || !fields.clientSecret || !fields.subscriptionId) {
          return toast.error('All Azure fields are required')
        }
        credentials = { tenantId: fields.tenantId, clientId: fields.clientId, clientSecret: fields.clientSecret, subscriptionId: fields.subscriptionId }
      }
      await onAdd({ label, provider, credentials })
    } catch (err) {
      toast.error(err.message || 'Failed to add credentials')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
    background: 'var(--s2)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box'
  }

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid #2563eb40', borderRadius: 16, padding: 24, marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plus size={18} color="#2563eb" /> Add Cloud IAM Credentials
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Cloud Provider</label>
            <select value={provider} onChange={e => setProvider(e.target.value)} style={{ ...inputStyle }}>
              <option value="aws">Amazon Web Services (AWS)</option>
              <option value="gcp">Google Cloud Platform (GCP)</option>
              <option value="azure">Microsoft Azure</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Label (friendly name)</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production AWS, Dev GCP..."
              style={{ ...inputStyle }} required />
          </div>
        </div>

        {/* AWS Fields */}
        {provider === 'aws' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Access Key ID</label>
              <input value={fields.accessKeyId} onChange={e => setFields(f => ({ ...f, accessKeyId: e.target.value }))} placeholder="AKIAIOSFODNN7EXAMPLE" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Secret Access Key</label>
              <div style={{ position: 'relative' }}>
                <input type={showSecrets ? 'text' : 'password'} value={fields.secretAccessKey}
                  onChange={e => setFields(f => ({ ...f, secretAccessKey: e.target.value }))} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCY..." style={{ ...inputStyle, paddingRight: 36 }} />
                <button type="button" onClick={() => setShowSecrets(!showSecrets)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Region</label>
              <select value={fields.region} onChange={e => setFields(f => ({ ...f, region: e.target.value }))} style={inputStyle}>
                {['ap-south-1','us-east-1','us-west-2','eu-west-1','ap-southeast-1','ap-northeast-1'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* GCP Fields */}
        {provider === 'gcp' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Project ID</label>
              <input value={fields.projectId} onChange={e => setFields(f => ({ ...f, projectId: e.target.value }))} placeholder="my-gcp-project-123" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Service Account JSON (paste content)</label>
              <textarea value={fields.serviceAccountJson} onChange={e => setFields(f => ({ ...f, serviceAccountJson: e.target.value }))}
                placeholder='{"type":"service_account","project_id":"..."}' rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
            </div>
          </div>
        )}

        {/* Azure Fields */}
        {provider === 'azure' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'tenantId', label: 'Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
              { key: 'clientId', label: 'Client (App) ID', placeholder: 'xxxxxxxx-xxxx-...' },
              { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your client secret value', type: 'password' },
              { key: 'subscriptionId', label: 'Subscription ID', placeholder: 'xxxxxxxx-xxxx-...' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{label}</label>
                <input type={type === 'password' && !showSecrets ? 'password' : 'text'} value={fields[key]}
                  onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--s2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
            {loading ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function CloudIntegrations() {
  const [credentials, setCredentials] = useState([])
  const [resources, setResources] = useState({ byProvider: { aws: [], gcp: [], azure: [], other: [] } })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [activeTab, setActiveTab] = useState('credentials')

  const fetchData = async () => {
    try {
      const [credsRes, resourcesRes, statsRes] = await Promise.all([
        api.get('/cloud/credentials'),
        api.get('/cloud/resources'),
        api.get('/cloud/stats')
      ])
      setCredentials(credsRes.data.data || [])
      setResources(resourcesRes.data.data || { byProvider: {}, sources: [] })
      setStats(statsRes.data.data)
      setLoading(false)
    } catch (err) {
      console.error('Cloud data fetch error:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const i = setInterval(fetchData, 20000)
    return () => clearInterval(i)
  }, [])

  const handleAddCredential = async (data) => {
    try {
      await api.post('/cloud/credentials', data)
      toast.success(`${data.provider.toUpperCase()} credentials saved securely (AES-256 encrypted).`)
      setShowAddForm(false)
      fetchData()
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to save credentials')
    }
  }

  const handleDeleteCredential = async (id) => {
    if (!confirm('Remove these cloud credentials?')) return
    try {
      await api.delete(`/cloud/credentials/${id}`)
      toast.success('Credentials removed')
      fetchData()
    } catch (err) {
      toast.error('Failed to remove credentials')
    }
  }

  const handleDiscover = async (credentialId) => {
    setDiscovering(credentialId || 'all')
    try {
      await api.post('/cloud/discover', credentialId ? { credentialId } : {})
      toast.success('Cloud discovery started! Resources will appear below as they are found.')
      setTimeout(() => { setDiscovering(false); fetchData() }, 6000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discovery failed')
      setDiscovering(false)
    }
  }

  const allSources = resources.sources || []

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Cloud size={28} color="#7c3aed" />
            Cloud Integrations
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>
            Connect AWS, GCP & Azure accounts to automatically discover cloud data sources for PII scanning
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => handleDiscover(null)} disabled={!!discovering || credentials.length === 0}
            style={{ padding: '10px 18px', background: discovering ? '#4c1d95' : '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: credentials.length === 0 || !!discovering ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: credentials.length === 0 ? 0.5 : 1 }}>
            {discovering ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
            {discovering ? 'Discovering...' : 'Discover All'}
          </button>
          <button onClick={() => setShowAddForm(true)}
            style={{ padding: '10px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Plus size={14} /> Add Cloud Account
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Cloud Accounts Connected', value: stats.credentialsConfigured, color: '#7c3aed' },
            { label: 'Resources Discovered', value: stats.resourcesDiscovered, color: '#2563eb' },
            { label: 'Total PII Found', value: stats.totalPIIFound, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && <AddCredentialForm onAdd={handleAddCredential} onCancel={() => setShowAddForm(false)} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['credentials', 'resources'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: activeTab === tab ? '#7c3aed' : 'var(--muted)',
              borderBottom: `2px solid ${activeTab === tab ? '#7c3aed' : 'transparent'}`, transition: 'all 0.15s', textTransform: 'capitalize' }}>
            {tab === 'credentials' ? 'Cloud Accounts' : `Discovered Resources (${allSources.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
          Loading cloud data...
        </div>
      ) : activeTab === 'credentials' ? (
        /* Cloud Accounts Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {Object.keys(PROVIDER_META).map(provider => (
            <ProviderCard
              key={provider}
              provider={provider}
              credentials={credentials}
              onDelete={handleDeleteCredential}
              onDiscover={handleDiscover}
            />
          ))}
        </div>
      ) : (
        /* Discovered Resources Tab */
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {allSources.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
              <Cloud size={40} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No cloud resources discovered yet</div>
              <div style={{ fontSize: 13 }}>Add cloud account credentials and click "Discover All" to find your cloud data sources</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 120px 80px', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                {['', 'Resource Name', 'Provider', 'Type', 'Status', 'PII Found'].map((h, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>
              {allSources.map((src, idx) => {
                const providerKey = src.name.startsWith('AWS ') ? 'aws' : src.name.startsWith('GCP ') ? 'gcp' : src.name.startsWith('Azure ') ? 'azure' : null
                const pMeta = providerKey ? PROVIDER_META[providerKey] : null
                const TypeIcon = RESOURCE_TYPE_ICONS[src.type] || Server
                return (
                  <div key={src._id} style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 120px 80px',
                    padding: '12px 20px', alignItems: 'center',
                    borderBottom: idx < allSources.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <TypeIcon size={16} color="var(--muted)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{src.name}</div>
                      {src.tags?.length > 0 && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{src.tags.join(', ')}</div>}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      {pMeta ? <span style={{ background: `${pMeta.color}15`, color: pMeta.color, borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>{providerKey.toUpperCase()}</span> : <span>On-Prem</span>}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)' }}>{src.type}</div>
                    <div>
                      <span style={{
                        background: src.healthStatus === 'healthy' ? '#22c55e20' : src.healthStatus === 'error' ? '#ef444420' : '#f59e0b20',
                        color: src.healthStatus === 'healthy' ? '#22c55e' : src.healthStatus === 'error' ? '#ef4444' : '#f59e0b',
                        borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600
                      }}>{src.healthStatus}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: src.totalPIIFound > 0 ? '#ef4444' : '#22c55e' }}>
                      {src.totalPIIFound || 0}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
