import React, { useState, useEffect } from 'react'
import { Server, Cloud, Plus, Play } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function Infrastructure() {
  const [onPremises, setOnPremises] = useState([])
  const [cloudSources, setCloudSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanningSources, setScanningSources] = useState(new Set())
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetchHealth()
    const hitv = setInterval(fetchHealth, 5000)
    return () => clearInterval(hitv)
  }, [])

  const fetchHealth = async () => {
    try {
      const res = await api.get('/dashboard/health')
      setHealth(res.data.data)
    } catch (err) {
      console.error('Health fetch failed:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/sources')
      const all = Array.isArray(res.data.data) ? res.data.data : []
      setOnPremises(all.filter(s => s.infrastructure === 'on-premises'))
      setCloudSources(all.filter(s => s.infrastructure === 'cloud'))
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch sources:', err)
      setOnPremises([])
      setCloudSources([])
      setLoading(false)
    }
  }

  const handleScan = async (sourceId) => {
    try {
      setScanningSources(prev => new Set([...prev, sourceId]))
      const res = await api.post('/scans', { connectorId: sourceId, name: 'Quick scan' })
      console.log('Scan started:', res.data)
      toast.success('Scan started!')
      setTimeout(() => {
        setScanningSources(prev => {
          const next = new Set(prev)
          next.delete(sourceId)
          return next
        })
        fetchData()
      }, 2000)
    } catch (err) {
      console.error('Scan error:', err)
      setScanningSources(prev => {
        const next = new Set(prev)
        next.delete(sourceId)
        return next
      })
      toast.error(err.response?.data?.message || 'Failed to start scan')
    }
  }

  const Card3D = ({ icon: Icon, title, count, pii, color, sources }) => (
    <div style={{
      perspective: '1000px',
      cursor: 'pointer',
      transition: 'transform 0.3s ease'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'rotateY(5deg) rotateX(-5deg)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'rotateY(0) rotateX(0)'}>
      <div style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `2px solid ${color}40`,
        borderRadius: '16px',
        padding: '32px',
        boxShadow: `0 20px 40px ${color}20, inset 0 1px 0 rgba(255,255,255,0.5)`,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${color}40`
            }}>
              <Icon size={28} color={color} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0' }}>{title}</h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Infrastructure</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '12px', border: `1px solid ${color}20` }}>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>SOURCES</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: color }}>{count}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '12px', border: `1px solid ${color}20` }}>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>PII FOUND</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: pii > 0 ? '#ef4444' : '#22c55e' }}>{pii}</div>
            </div>
          </div>

          {/* Sources List */}
          {sources.length > 0 && (
            <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '16px' }}>
              {sources.map(src => (
                <div key={src._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }}>
                  <span style={{ color: '#374151', fontWeight: '500' }}>{src.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>{src.totalPIIFound} PII</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        {sources.length > 0 && (
          <button
            onClick={() => handleScan(sources[0]._id)}
            disabled={scanningSources.has(sources[0]._id)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: color,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: scanningSources.has(sources[0]._id) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: scanningSources.has(sources[0]._id) ? 0.6 : 1
            }}
            onMouseOver={e => !scanningSources.has(sources[0]._id) && (e.target.style.opacity = '0.9')}
            onMouseOut={e => !scanningSources.has(sources[0]._id) && (e.target.style.opacity = '1')}
          >
            <Play size={14} /> {scanningSources.has(sources[0]._id) ? 'Scanning...' : 'Scan Now'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Infrastructure Overview</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Monitor your on-premises and cloud data sources</p>
      </div>

      {/* System Health Nexus */}
      <div style={{ 
        background: 'var(--s1)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px', 
        padding: '24px', 
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '32px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Health Nexus</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted)' }}>Real-time subsystem operational telemetry</p>
        </div>
        
        {['mongodb', 'redis', 'ai_engine', 'backend'].map(key => {
          const status = health?.subsystems[key]?.status || 'unknown';
          const isActive = status === 'healthy';
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                background: isActive ? '#10b981' : '#ef4444',
                boxShadow: isActive ? '0 0 8px #10b981' : '0 0 8px #ef4444',
                animation: isActive ? 'pulse-badge 2s infinite' : 'none'
              }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text)' }}>
                  {key.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {status} {health?.subsystems[key]?.latency ? `(${health.subsystems[key].latency}ms)` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
          {/* On-Premises Card */}
          <Card3D
            icon={Server}
            title="On-Premises"
            count={onPremises.length}
            pii={onPremises.reduce((sum, s) => sum + (s.totalPIIFound || 0), 0)}
            color="#2563eb"
            sources={onPremises}
          />

          {/* Cloud Card */}
          <Card3D
            icon={Cloud}
            title="Cloud"
            count={cloudSources.length}
            pii={cloudSources.reduce((sum, s) => sum + (s.totalPIIFound || 0), 0)}
            color="#9333ea"
            sources={cloudSources}
          />
        </div>
      )}
    </div>
  )
}
