import React, { useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useAlertStore } from '../../store/alertStore'
import {
  LayoutDashboard, Database, Search, Package, AlertTriangle, FileText,
  Shield, Bell, ScrollText, Zap, Settings, LogOut, ChevronLeft,
  ChevronRight, Swords, Bot, Menu, Server, Cloud, Monitor, Network, User
} from 'lucide-react'

const NAV = [
  { label: 'OVERVIEW', items: [
    { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ]},
  { label: 'INFRASTRUCTURE', items: [
    { to: '/app/infrastructure', icon: Server, label: 'Overview' },
    { to: '/app/assets', icon: Network, label: 'IT Asset Inventory' },
    { to: '/app/cloud', icon: Cloud, label: 'Cloud Integrations' },
  ]},
  { label: 'DISCOVERY', items: [
    { to: '/app/sources', icon: Database, label: 'Data Sources' },
    { to: '/app/scans', icon: Search, label: 'Scans' },
    { to: '/app/inventory', icon: Package, label: 'Inventory' },
  ]},
  { label: 'DPDPA 2023 COMPLIANCE', items: [
    { to: '/app/compliance', icon: Shield, label: 'Compliance Master' },
    { to: '/app/consent', icon: Zap, label: 'Consent Management' },
    { to: '/app/nominate', icon: User, label: 'Nomination Registry' },
  ]},
  { label: 'DPO WORKSPACE', items: [
    { to: '/app/reports', icon: FileText, label: 'Reports' },
    { to: '/app/audit', icon: ScrollText, label: 'Audit Log' },
    { to: '/app/alerts', icon: Bell, label: 'Alerts', badge: true },
  ]},
  { label: 'AI ENGINE', items: [
    { to: '/app/copilot', icon: Bot, label: 'Global Intelligence Nexus' },
  ]},
  { label: 'SETTINGS', items: [
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ]},
]

export default function AppLayout() {
  const { user, org, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { unreadCount, fetchUnread } = useAlertStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { fetchUnread() }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{
          background: 'var(--s1)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 10
        }}
      >
        {/* Logo */}
        <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 60 }}>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🛡</span>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'var(--c1)' }}>DataSentinel</span>
            </motion.div>
          )}
          {sidebarCollapsed && <span style={{ fontSize: 20, margin: 'auto' }}>🛡</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px' }}>
          {NAV.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && <div className="nav-label">{section.label}</div>}
              {sidebarCollapsed && <div style={{ height: 12 }} />}
              {section.items.map((item) => (
                <NavLink
                  key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', marginBottom: 2 }}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <item.icon size={16} style={{ flexShrink: 0 }} />
                  {!sidebarCollapsed && (
                    <span style={{ flex: 1 }}>{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge && unreadCount > 0 && (
                    <span style={{ background: 'var(--c3)', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontFamily: 'JetBrains Mono' }}>
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 8px' }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--c1), var(--c2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <LogOut size={15} style={{ color: 'var(--c3)' }} />
            {!sidebarCollapsed && <span style={{ color: 'var(--c3)', fontSize: 13 }}>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          style={{ position: 'absolute', top: 18, right: -10, width: 20, height: 20, borderRadius: '50%', background: 'var(--s2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20 }}
        >
          {sidebarCollapsed ? <ChevronRight size={11} style={{ color: 'var(--c1)' }} /> : <ChevronLeft size={11} style={{ color: 'var(--c1)' }} />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: 60, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, background: 'var(--s1)', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            {org && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{org.name}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(0,102,204,0.1)', color: 'var(--c1)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                  {org.plan || 'trial'}
                </span>
              </div>
            )}
          </div>
          <NavLink to="/app/alerts" style={{ position: 'relative', color: 'var(--muted)', display: 'flex', textDecoration: 'none' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: 'var(--c3)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'JetBrains Mono' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', position: 'relative' }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
