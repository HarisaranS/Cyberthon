import React, { useState, useEffect, useCallback } from 'react'
import {
  Network, Server, Mail, HardDrive, Database, Globe, Monitor,
  Printer, Cpu, RefreshCw, Shield, Eye, Play, AlertTriangle,
  CheckCircle, XCircle, Clock, Filter, Search, ChevronRight,
  Wifi, Lock, Unlock
} from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const ASSET_TYPE_META = {
  database:       { icon: Database,  color: '#2563eb', label: 'Database' },
  mail_server:    { icon: Mail,      color: '#7c3aed', label: 'Mail Server' },
  file_server:    { icon: HardDrive, color: '#0891b2', label: 'File Server' },
  web_server:     { icon: Globe,     color: '#16a34a', label: 'Web Server' },
  ssh_host:       { icon: Server,    color: '#d97706', label: 'SSH Host' },
  ldap_directory: { icon: Shield,    color: '#dc2626', label: 'Directory' },
  cache_server:   { icon: Cpu,       color: '#9333ea', label: 'Cache/Queue' },
  search_engine:  { icon: Search,    color: '#0284c7', label: 'Search Engine' },
  workstation:    { icon: Monitor,   color: '#64748b', label: 'Workstation' },
  printer:        { icon: Printer,   color: '#78716c', label: 'Printer' },
  switch:         { icon: Wifi,      color: '#475569', label: 'Network Device' },
  router:         { icon: Wifi,      color: '#475569', label: 'Router' },
  unknown:        { icon: Server,    color: '#9ca3af', label: 'Unknown' },
}

const AUTH_STATUS_META = {
  accessible_no_auth:       { label: 'Open Access',    color: '#ef4444', icon: Unlock },
  accessible_credentials:   { label: 'Authenticated',  color: '#22c55e', icon: CheckCircle },
  requires_credentials:     { label: 'Auth Required',  color: '#f59e0b', icon: Lock },
  inaccessible:             { label: 'Inaccessible',   color: '#94a3b8', icon: XCircle },
  unknown:                  { label: 'Not Tested',     color: '#64748b', icon: Clock },
}

function PortBadge({ port, service }) {
  const colors = {
    database: '#2563eb20', mail_server: '#7c3aed20', ssh_host: '#d9770620',
    web_server: '#16a34a20', file_server: '#0891b220'
  }
  return (
    <span style={{
      background: '#1e293b', color: '#94a3b8', borderRadius: 4,
      padding: '1px 6px', fontSize: 10, fontFamily: 'monospace',
      border: '1px solid #334155', whiteSpace: 'nowrap'
    }}>
      {port}/{service}
    </span>
  )
}

function StatCard({ value, label, color, icon: Icon }) {
  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

export default function AssetInventory() {
  const [assets, setAssets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [discovering, setDiscovering] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterAuth, setFilterAuth] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [authenticating, setAuthenticating] = useState(null)
  const [scanning, setScanning] = useState(null)
  const [customCreds, setCustomCreds] = useState({ user: '', password: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 30 })
      if (filterType) params.set('assetType', filterType)
      if (filterAuth) params.set('authStatus', filterAuth)

      const [assetsRes, statsRes] = await Promise.all([
        api.get(`/assets?${params}`),
        api.get('/assets/stats')
      ])
      setAssets(assetsRes.data.data || [])
      setTotalPages(assetsRes.data.totalPages || 1)
      setStats(statsRes.data.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch assets:', err)
      setLoading(false)
    }
  }, [page, filterType, filterAuth])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleDiscover = async () => {
    setDiscovering(true)
    try {
      await api.post('/assets/discover')
      toast.success('Network discovery started! Asset inventory will update as devices are found (2-5 min for large networks).')
      setTimeout(() => { setDiscovering(false); fetchData() }, 8000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discovery failed')
      setDiscovering(false)
    }
  }

  const handleAuthenticate = async (asset) => {
    setAuthenticating(asset._id)
    try {
      const creds = customCreds.user ? [customCreds] : []
      const res = await api.post(`/assets/${asset._id}/authenticate`, { credentials: creds })
      toast.success(res.data.message)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed')
    } finally {
      setAuthenticating(null)
    }
  }

  const handleScan = async (asset) => {
    setScanning(asset._id)
    try {
      const res = await api.post(`/assets/${asset._id}/scan`)
      toast.success(res.data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed')
    } finally {
      setTimeout(() => setScanning(null), 2000)
    }
  }

  const filtered = assets.filter(a => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      return a.ip?.includes(q) || a.hostname?.toLowerCase().includes(q) || a.assetType?.includes(q)
    }
    return true
  })

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Network size={28} color="#2563eb" />
            IT Asset Inventory
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>
            Real-time enterprise network discovery — all devices, servers, and services across your environment
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchData}
            style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--s1)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            style={{ padding: '10px 20px', background: discovering ? '#1e3a5f' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: discovering ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, transition: 'all 0.2s' }}
          >
            {discovering ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Network size={14} />}
            {discovering ? 'Scanning Network...' : 'Run Network Discovery'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard value={stats.totalAssets} label="Total Assets Discovered" color="#2563eb" icon={Network} />
          <StatCard value={stats.aliveAssets} label="Currently Online" color="#22c55e" icon={CheckCircle} />
          <StatCard value={stats.accessibleAssets} label="Accessible Services" color="#f59e0b" icon={Unlock} />
          <StatCard value={`${stats.accessRate}%`} label="Access Rate" color="#7c3aed" icon={Shield} />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            placeholder="Search by IP, hostname, type..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32, padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--s1)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--s1)', color: 'var(--text)', fontSize: 13 }}
        >
          <option value="">All Types</option>
          {Object.entries(ASSET_TYPE_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterAuth}
          onChange={e => setFilterAuth(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--s1)', color: 'var(--text)', fontSize: 13 }}
        >
          <option value="">All Auth Status</option>
          {Object.entries(AUTH_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Asset Table */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 160px 1fr 160px 120px 180px', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
          {['IP Address', 'Asset Type', 'Auth Status', 'Open Ports', 'Last Seen', 'PII Found', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div>Loading asset inventory...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <Network size={40} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No assets discovered yet</div>
            <div style={{ fontSize: 13 }}>Click "Run Network Discovery" to scan your enterprise network</div>
          </div>
        ) : (
          filtered.map((asset, idx) => {
            const typeMeta = ASSET_TYPE_META[asset.assetType] || ASSET_TYPE_META.unknown
            const authMeta = AUTH_STATUS_META[asset.authStatus] || AUTH_STATUS_META.unknown
            const TypeIcon = typeMeta.icon
            const AuthIcon = authMeta.icon
            const isSelected = selectedAsset?._id === asset._id

            return (
              <div key={asset._id}>
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '120px 140px 160px 1fr 160px 120px 180px',
                    padding: '14px 20px', alignItems: 'center',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                    background: isSelected ? 'rgba(37,99,235,0.05)' : 'transparent'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--s2)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  onClick={() => setSelectedAsset(isSelected ? null : asset)}
                >
                  {/* IP */}
                  <div>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: asset.isAlive ? '#22c55e' : '#94a3b8', flexShrink: 0 }} />
                      {asset.ip}
                    </div>
                    {asset.hostname && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>{asset.hostname}</div>}
                  </div>

                  {/* Asset Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ background: `${typeMeta.color}15`, padding: 5, borderRadius: 6 }}>
                      <TypeIcon size={13} color={typeMeta.color} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{typeMeta.label}</span>
                  </div>

                  {/* Auth Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AuthIcon size={13} color={authMeta.color} />
                    <span style={{ fontSize: 11, color: authMeta.color, fontWeight: 600 }}>{authMeta.label}</span>
                  </div>

                  {/* Open Ports */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 44, overflow: 'hidden' }}>
                    {(asset.openPorts || []).slice(0, 6).map(p => (
                      <PortBadge key={`${p.port}-${p.service}`} port={p.port} service={p.service} />
                    ))}
                    {(asset.openPorts?.length || 0) > 6 && (
                      <span style={{ fontSize: 10, color: 'var(--muted)', padding: '1px 4px' }}>+{asset.openPorts.length - 6}</span>
                    )}
                  </div>

                  {/* Last Seen */}
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {asset.lastSeen ? new Date(asset.lastSeen).toLocaleString() : 'Never'}
                  </div>

                  {/* PII Found */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: asset.totalPIIFound > 0 ? '#ef4444' : '#22c55e' }}>
                    {asset.totalPIIFound || 0}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={e => { e.stopPropagation(); handleAuthenticate(asset) }}
                      disabled={authenticating === asset._id}
                      title="Test authentication"
                      style={{ padding: '5px 10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: authenticating === asset._id ? 0.6 : 1 }}
                    >
                      <Lock size={11} /> Auth
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleScan(asset) }}
                      disabled={scanning === asset._id}
                      title="Scan for PII"
                      style={{ padding: '5px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: scanning === asset._id ? 0.6 : 1 }}
                    >
                      <Play size={11} /> Scan
                    </button>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isSelected && (
                  <div style={{ background: 'var(--s2)', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* All Ports */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>All Open Ports</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(asset.openPorts || []).map(p => (
                            <div key={p.port} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px' }}>
                              <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{p.port}</span>
                              <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>{p.service}</span>
                              {p.banner && <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.banner}</div>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Auth */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Test Custom Credentials</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input placeholder="Username" value={customCreds.user} onChange={e => setCustomCreds(prev => ({ ...prev, user: e.target.value }))}
                            style={{ flex: 1, minWidth: 100, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--s1)', color: 'var(--text)', fontSize: 12 }} />
                          <input type="password" placeholder="Password" value={customCreds.password} onChange={e => setCustomCreds(prev => ({ ...prev, password: e.target.value }))}
                            style={{ flex: 1, minWidth: 100, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--s1)', color: 'var(--text)', fontSize: 12 }} />
                          <button onClick={() => handleAuthenticate(asset)} disabled={authenticating === asset._id}
                            style={{ padding: '6px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            {authenticating === asset._id ? 'Testing...' : 'Test'}
                          </button>
                        </div>
                        {/* Linked Sources */}
                        {asset.dataSourceIds?.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Linked Data Sources</div>
                            {asset.dataSourceIds.map(src => (
                              <div key={src._id || src} style={{ fontSize: 12, padding: '4px 8px', background: 'rgba(37,99,235,0.1)', borderRadius: 4, color: '#2563eb', display: 'inline-block', marginRight: 6 }}>
                                {src.name || src}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--s1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
            ← Prev
          </button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--muted)' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--s1)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
            Next →
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
