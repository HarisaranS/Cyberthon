import React, { useState, useEffect } from 'react'
import { Play, Loader } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function Scans() {
  const [sources, setSources] = useState([])
  const [scans, setScans] = useState([])
  const [selectedSource, setSelectedSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    fetchSources()
    fetchScans()
    const interval = setInterval(fetchScans, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchSources = async () => {
    try {
      const res = await api.get('/sources')
      const data = Array.isArray(res.data.data) ? res.data.data : []
      setSources(data)
    } catch (err) {
      console.error('Failed to fetch sources:', err)
      setSources([])
    }
  }

  const fetchScans = async () => {
    try {
      const res = await api.get('/scans')
      const data = Array.isArray(res.data.data) ? res.data.data : []
      setScans(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch scans:', err)
      setScans([])
      setLoading(false)
    }
  }

  const handleStartScan = async () => {
    if (!selectedSource) {
      toast.error('Please select a source')
      return
    }
    setScanning(true)
    try {
      await api.post('/scans', { connectorId: selectedSource, name: 'Manual scan' })
      toast.success('Scan started!')
      setSelectedSource('')
      await new Promise(r => setTimeout(r, 1000))
      fetchScans()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start scan')
    } finally {
      setScanning(false)
    }
  }

  const getSourceName = (sourceId) => {
    const source = sources.find(s => s._id === sourceId)
    return source?.name || 'Unknown'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e'
      case 'running': return '#3b82f6'
      case 'queued': return '#f59e0b'
      case 'failed': return '#ef4444'
      case 'cancelled': return '#6b7280'
      default: return '#94a3b8'
    }
  }

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>Scans</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>Manage and monitor PII discovery scans</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '32px' }}>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          disabled={scanning}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            width: '200px',
            background: 'white',
            cursor: scanning ? 'not-allowed' : 'pointer',
            opacity: scanning ? 0.6 : 1
          }}
        >
          <option value="">Select source...</option>
          {sources.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        <button
          onClick={handleStartScan}
          disabled={!selectedSource || scanning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: selectedSource && !scanning ? '#0052cc' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedSource && !scanning ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '14px',
            opacity: scanning ? 0.7 : 1
          }}
        >
          {scanning ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
          {scanning ? 'Starting...' : 'Start Scan'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>Loading scans...</div>
      ) : scans.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px 24px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <Play size={48} style={{ opacity: '0.3', marginBottom: '16px', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>No scans yet</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Select a data source above and run your first scan</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Source</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>PII Found</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Progress</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Started</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan, idx) => (
                <tr key={scan._id} style={{ borderBottom: idx < scans.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {scan.connectorId?.name || getSourceName(scan.connectorId)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: `${getStatusColor(scan.status)}20`,
                      color: getStatusColor(scan.status),
                      fontWeight: '600',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}>
                      {scan.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: scan.totalPIIFound > 0 ? '#ef4444' : '#22c55e', fontWeight: '600' }}>
                    {scan.totalPIIFound || 0}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                    {scan.progress || 0}%
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                    {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
