import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Building2, Bell, Shield } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, org } = useAuthStore()
  const [tab, setTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'org', label: 'Organisation', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Settings</h1>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Manage your account, organisation, and preferences</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        {/* Tab nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`nav-item${tab === t.id ? ' active' : ''}`}
              style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'left', cursor: 'pointer' }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card" style={{ padding: 28 }}>
          {tab === 'profile' && (
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 20 }}>Profile Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>FULL NAME</label>
                  <input className="input" defaultValue={user?.name} readOnly style={{ opacity: 0.8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>EMAIL</label>
                  <input className="input" defaultValue={user?.email} readOnly style={{ opacity: 0.8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>ROLE</label>
                  <div style={{ padding: '10px 14px', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 13, textTransform: 'uppercase', color: 'var(--c1)' }}>{user?.role}</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'org' && (
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 20 }}>Organisation Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>ORGANISATION NAME</label>
                  <input className="input" defaultValue={org?.name} readOnly style={{ opacity: 0.8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>SUBSCRIPTION PLAN</label>
                  <div style={{ padding: '10px 14px', background: 'var(--s2)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 13, textTransform: 'uppercase', color: 'var(--c1)' }}>{org?.plan || 'trial'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>COMPLIANCE SCORE</label>
                  <div style={{ padding: '10px 14px', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--c4)' }}>{org?.complianceScore || 0}%</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 20 }}>Notification Preferences</h3>
              {[
                { label: 'Critical PII found in scan', desc: 'Alert when critical sensitive data is discovered' },
                { label: 'Breach 72-hour deadline warning', desc: 'Alert when approaching DPB notification deadline' },
                { label: 'Compliance score dropped', desc: 'Alert when compliance score falls below threshold' },
                { label: 'Weekly compliance digest', desc: 'Weekly summary of your data protection posture' },
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{n.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{n.desc}</div>
                  </div>
                  <div style={{ width: 40, height: 22, borderRadius: 11, background: i < 3 ? 'var(--c1)' : 'var(--s3)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg)', position: 'absolute', top: 2, left: i < 3 ? 20 : 2, transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 20 }}>Security Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440 }}>
                <div style={{ padding: '16px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Multi-Factor Authentication</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Add an extra layer of security with TOTP authenticator app</div>
                  <button onClick={() => toast('MFA setup coming soon!')} className="btn-secondary" style={{ fontSize: 13 }}>Setup MFA</button>
                </div>
                <div style={{ padding: '16px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>API Keys</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Manage API keys for programmatic access</div>
                  <button onClick={() => toast('API key management coming soon!')} className="btn-secondary" style={{ fontSize: 13 }}>Manage Keys</button>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,77,109,0.05)', borderRadius: 10, border: '1px solid rgba(255,77,109,0.15)' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: 'var(--c3)' }}>Delete Account</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Permanently delete your account and all data. This cannot be undone.</div>
                  <button onClick={() => toast.error('Please contact support to delete your account')} className="btn-danger" style={{ fontSize: 13 }}>Delete Account</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
