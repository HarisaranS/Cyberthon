import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertTriangle, Shield, Database, Search, TrendingUp, ArrowRight, Clock, Activity, Server, Cloud } from 'lucide-react'
import api from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { format } from 'date-fns'

const SEV_COLOR = { critical: 'var(--c3)', high: 'var(--c5)', medium: 'var(--c6)', low: 'var(--c4)', info: 'var(--c1)' }

export default function Dashboard() {
  const { user, org } = useAuthStore()
  const { infrastructureFilter } = useUIStore()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', infrastructureFilter],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
    refetchInterval: 30000
  })

  const scanTrend = stats?.scanTrend || []
  const riskBreakdown = stats?.riskBreakdown || []

  const PIE_COLORS = { sensitive_personal: 'var(--c3)', personal: 'var(--c5)', internal: 'var(--c1)', public: 'var(--c4)' }

  const scoreColor = (s) => s >= 80 ? 'var(--c4)' : s >= 60 ? 'var(--c5)' : s >= 40 ? 'var(--c6)' : 'var(--c3)'

  const filterLabel = infrastructureFilter === 'on-premises' ? 'On-Premises' : infrastructureFilter === 'cloud' ? 'Cloud' : 'All Infrastructure'
  const filterIcon = infrastructureFilter === 'on-premises' ? Server : infrastructureFilter === 'cloud' ? Cloud : null

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: 8 }}>
            {format(new Date(), 'EEEE, dd MMM yyyy')} — DPDPA COMPLIANCE DASHBOARD
            {infrastructureFilter && (
              <>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#E3F2FD', padding: '2px 8px', borderRadius: 4, color: 'var(--c1)' }}>
                  {filterIcon && <filterIcon size={12} />}
                  {filterLabel}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(147,51,234,0.1))', 
            padding: '4px 12px', 
            borderRadius: '100px', 
            border: '1px solid rgba(37,99,235,0.2)',
            fontSize: '10px',
            fontWeight: '800',
            color: 'var(--c1)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Activity size={12} /> Global Intelligence Nexus Active
          </div>
          <Link to="/app/scans" className="btn-primary" style={{ fontSize: 13 }}>
            <Search size={14} /> New Scan
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total PII Assets', val: isLoading ? '—' : (stats?.totalAssets || 0).toLocaleString(), icon: Database, color: 'var(--c1)', sub: 'files with personal data' },
          { label: 'Critical Risks', val: isLoading ? '—' : (stats?.criticalCount || 0), icon: AlertTriangle, color: 'var(--c3)', sub: 'require immediate action' },
          { label: 'Compliance Score', val: isLoading ? '—' : `${stats?.complianceScore || 0}%`, icon: Shield, color: scoreColor(stats?.complianceScore || 0), sub: 'DPDPA readiness' },
          { label: 'Active Scans', val: isLoading ? '—' : (stats?.activeScans || 0), icon: Activity, color: 'var(--c2)', sub: 'currently running' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="stat-card"
            style={{ 
              background: 'rgba(255,255,255,0.7)', 
              backdropFilter: 'blur(20px)', 
              border: `1px solid rgba(255,255,255,0.5)`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
            }}
            whileHover={{ y: -4, boxShadow: '0 12px 48px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, color: kpi.color }}>{kpi.val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{kpi.sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(${kpi.color === 'var(--c3)' ? '220,53,69' : kpi.color === 'var(--c1)' ? '0,102,204' : kpi.color === 'var(--c2)' ? '91,95,255' : '40,137,50'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Scan trend */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15 }}>Scan Activity (30 days)</h3>
            <span className="badge badge-info">LIVE</span>
          </div>
          {scanTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={scanTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066CC" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                <Area type="monotone" dataKey="piiFound" stroke="#0066CC" fill="url(#g1)" strokeWidth={2} name="PII Found" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
              <div style={{ textAlign: 'center' }}>
                <Search size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>Run your first scan to see activity</div>
                <Link to="/app/scans" className="btn-primary" style={{ marginTop: 12, fontSize: 12, padding: '8px 16px', display: 'inline-flex' }}>Start Scanning</Link>
              </div>
            </div>
          )}
        </div>

        {/* Risk breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Risk Breakdown</h3>
          {riskBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={riskBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {riskBreakdown.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[entry._id] || 'var(--muted)'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {riskBreakdown.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[r._id] || 'var(--muted)' }} />
                      {r._id?.replace('_', ' ')}
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: PIE_COLORS[r._id] }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
              No data yet.<br />Connect a data source.
            </div>
          )}
        </div>
      </div>

      {/* Compliance + Recent alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Compliance score */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15 }}>DPDPA Compliance</h3>
            <Link to="/app/compliance" style={{ color: 'var(--c1)', fontSize: 12, textDecoration: 'none', display: 'flex', gap: 4, alignItems: 'center' }}>View All <ArrowRight size={12} /></Link>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div 
              className={(stats?.complianceScore || 0) >= 60 && (stats?.complianceScore || 0) < 80 ? "animate-pulse" : ""}
              style={{ 
                fontFamily: 'Syne', 
                fontWeight: 800, 
                fontSize: 56, 
                ...((stats?.complianceScore || 0) >= 60 && (stats?.complianceScore || 0) < 80 
                  ? { background: 'linear-gradient(90deg, #f97316, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
                  : { color: scoreColor(stats?.complianceScore || 0) }
                )
              }}>
              {stats?.complianceScore || 0}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>DPDPA READINESS SCORE</div>
          </div>
          {(stats?.compliancePillars || [
            { label: 'Consent Management', score: 30 },
            { label: 'Principal Rights', score: 100 },
            { label: 'Security Safeguards', score: 50 },
            { label: 'Breach Notification', score: 50 },
          ]).map((item, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600, color: scoreColor(item.score) }}>{item.score}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6, background: 'var(--s1)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${item.score}%` }} 
                  transition={{ duration: 1, type: 'spring' }}
                  className="progress-fill" 
                  style={{ 
                    height: '100%', 
                    borderRadius: 3, 
                    background: `linear-gradient(90deg, ${scoreColor(item.score)}, color-mix(in srgb, ${scoreColor(item.score)} 50%, transparent))`, 
                    boxShadow: `0 0 10px color-mix(in srgb, ${scoreColor(item.score)} 30%, transparent)` 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recent alerts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15 }}>Recent Alerts</h3>
            <Link to="/app/alerts" style={{ color: 'var(--c1)', fontSize: 12, textDecoration: 'none', display: 'flex', gap: 4, alignItems: 'center' }}>View All <ArrowRight size={12} /></Link>
          </div>
          {(stats?.recentAlerts || []).length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
              <div><Shield size={28} style={{ marginBottom: 8, opacity: 0.4 }} /><div>No alerts yet. Good standing!</div></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(stats?.recentAlerts || []).slice(0, 6).map((alert, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: alert.isRead ? 'transparent' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: SEV_COLOR[alert.severity] || 'var(--muted)', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontFamily: 'JetBrains Mono' }}>{format(new Date(alert.createdAt), 'dd MMM, HH:mm')}</div>
                  </div>
                  <span className={`badge badge-${alert.severity || 'info'}`} style={{ fontSize: 9, flexShrink: 0 }}>{alert.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
