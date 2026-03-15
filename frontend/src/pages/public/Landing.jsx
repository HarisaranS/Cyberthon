import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Zap, Eye, Lock, FileCheck, ArrowRight, Check, ChevronDown, Star } from 'lucide-react'
import api from '../../lib/axios'

const PII_TYPES = {
  AADHAAR: 'tag-aadhaar', PAN: 'tag-pan', MOBILE: 'tag-mobile',
  EMAIL: 'tag-email', HEALTH: 'tag-health', FINANCIAL: 'tag-financial',
  NAME: 'tag-name', PASSPORT: 'tag-passport', VOTER_ID: 'tag-voter_id'
}

const PRICING = [
  { name: 'Starter', price: '$499', period: '/month', desc: 'For small businesses', features: ['Up to 5 data sources', '10,000 files/month', 'Basic Compliance checklist', 'Email alerts', 'Standard support'] },
  { name: 'Professional', price: '$1,499', period: '/month', desc: 'For growing teams', popular: true, features: ['Up to 25 data sources', '100k files/month', 'Full Global Compliance', 'Global Intelligence Nexus', 'Rights management portal', 'Breach tracking', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', period: '', desc: 'For global MNCs', features: ['Unlimited data sources', 'Unlimited scanning', 'Custom AI models', 'On-premise deployment', 'SLA guarantee', 'Dedicated success manager', 'Custom integrations'] }
]

const FAQS = [
  { q: 'What is DataSentinel?', a: 'DataSentinel is a comprehensive global data protection platform. We support multiple frameworks including GDPR, CCPA, and DPDPA, ensuring world-class compliance for international organisations.' },
  { q: 'What types of data can DataSentinel discover?', a: 'We natively detect SSN, IBAN, Passports, Aadhaar, PAN, and 30+ other global PII types across multi-cloud and on-premise infrastructure.' },
  { q: 'How long does a scan take?', a: 'Scan speed depends on data volume. Small databases scan in minutes; large enterprise environments with millions of files typically complete within a few hours.' },
  { q: 'Is my data safe?', a: 'DataSentinel never stores actual PII. All sensitive values are SHA-256 hashed and file paths are AES-256 encrypted. We detect and report, never copy.' },
  { q: 'Can it work on-premise?', a: 'Yes. Enterprise plan includes fully on-premise deployment with no data leaving your network.' },
]

export default function Landing() {
  const [demoText, setDemoText] = useState('John Doe, SSN: 666-00-1234, IBAN: DE12 3456 7890 1234 5678, Aadhaar: 2345 6789 0123, PAN: ABCDE1234F')
  const [detections, setDetections] = useState([])
  const [detecting, setDetecting] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const runDetect = async () => {
    setDetecting(true)
    try {
      const { data } = await api.post('/public/detect', { text: demoText })
      setDetections(data.data?.detections || [])
    } catch {
      setDetections([])
    }
    setDetecting(false)
  }

  useEffect(() => { runDetect() }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🛡</span>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--c1)' }}>DataSentinel</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Features', 'DPDPA', 'Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}>{l}</a>
          ))}
          <Link to="/login" style={{ color: 'var(--c1)', fontSize: 14, textDecoration: 'none' }}>Login</Link>
          <Link to="/register" className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient" style={{ padding: '80px 48px 60px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="badge badge-info" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>
            <Zap size={10} /> GLOBAL COMPLIANCE NATIVE PLATFORM
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 1.1, marginBottom: 20, fontFamily: 'Syne', fontWeight: 800 }}>
            Know Your Data.<br /><span className="gradient-text">Own Your Compliance.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.7 }}>
            The world's first natively multi-framework aligned personal data intelligence platform. Discover, classify, and protect PII across all your data sources — with enterprise-grade precision.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
              Start Free Trial <ArrowRight size={16} />
            </Link>
            <a href="#demo" className="btn-secondary" style={{ fontSize: 15, padding: '12px 28px' }}>
              See Live Demo
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 800, margin: '48px auto 0', textAlign: 'left' }}>
          {[
            { val: '$10M+', label: 'Max Global Penalties', color: 'var(--c3)' },
            { val: '30+', label: 'Global PII Patterns', color: 'var(--c1)' },
            { val: '100%', label: 'Discovery Accuracy', color: 'var(--c4)' },
            { val: '72hr', label: 'Breach Notify SLA', color: 'var(--c5)' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'JetBrains Mono' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '60px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 40, marginBottom: 12 }}>Built for Global Enterprise</h2>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>Everything you need for multi-framework compliance in one world-class platform</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
          {[
            { icon: '🔍', title: 'Intelligent PII Discovery', desc: 'Scans databases, files, cloud storage, email, and SaaS apps. Detects global identifiers including SSN, IBAN, Aadhaar, and passports.', color: 'var(--c1)' },
            { icon: '🤖', title: 'AI-Powered Classification', desc: 'Tri-layer detection: regex patterns + Presidio NLP + spaCy NER. Scores every asset with risk-based sensitivity tiers.', color: 'var(--c2)' },
            { icon: '⚖️', title: 'Multi-Framework Compliance', desc: 'Natively maps finding to GDPR, CCPA, and DPDPA frameworks. Generates compliance checklists, gap reports, and automated risk scoring.', color: 'var(--c4)' },
            { icon: '🚨', title: 'Breach Management', desc: '72-hour countdown timer for mandatory DPB notification. Timeline tracking, escalation workflows, and notification drafts.', color: 'var(--c3)' },
            { icon: '👤', title: 'Data Principal Rights', desc: 'Full rights management: access, correction, erasure, portability. Kanban board for your DPO team with SLA tracking.', color: 'var(--c5)' },
            { icon: '🚀', title: 'Global Intelligence Nexus', desc: 'High-speed AI responses for international compliance (GDPR/CCPA/DPDPA). Draft policies and interpret global rules instantly.', color: 'var(--c7)' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              className="card" style={{ padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, marginBottom: 8, color: f.color }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Demo */}
      <section id="demo" style={{ padding: '60px 48px', background: 'var(--s1)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>Try It Live</h2>
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 32 }}>Paste any text — our AI detects Indian PII in real time</p>

          <textarea
            value={demoText}
            onChange={e => setDemoText(e.target.value)}
            rows={4}
            className="input"
            style={{ fontFamily: 'JetBrains Mono', fontSize: 13, resize: 'vertical', marginBottom: 12 }}
            placeholder="Paste text with SSN, IBAN, Passports, Aadhaar, PAN, emails..."
          />
          <button onClick={runDetect} disabled={detecting} className="btn-primary" style={{ marginBottom: 20 }}>
            {detecting ? '⚡ Detecting...' : '⚡ Detect PII'}
          </button>

          {detections.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                FOUND {detections.length} PII INSTANCES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {detections.map((d, i) => (
                  <div key={i} className={`badge ${PII_TYPES[d.pii_type] ? '' : 'badge-info'}`}
                    style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ opacity: 0.6 }}>{d.pii_type}</span>
                    <span style={{ marginLeft: 8, fontFamily: 'JetBrains Mono' }}>{d.masked_value}</span>
                    <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 10 }}>{Math.round(d.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* DPDPA Coverage */}
      <section id="dpdpa" style={{ padding: '60px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>Universal Compliance Coverage</h2>
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 40 }}>End-to-end mapping to GDPR, CCPA, and DPDPA frameworks</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { sec: '§4-5', name: 'Grounds for Processing', status: 'covered' },
              { sec: '§6', name: 'Consent Management', status: 'covered' },
              { sec: '§7', name: 'Legitimate Uses', status: 'covered' },
              { sec: '§8', name: 'Data Fiduciary Duties', status: 'covered' },
              { sec: '§9', name: "Children's Data", status: 'covered' },
              { sec: '§10', name: 'Significant Data Fiduciary', status: 'covered' },
              { sec: '§11', name: 'Right to Access', status: 'covered' },
              { sec: '§12', name: 'Right to Correction', status: 'covered' },
              { sec: '§13', name: 'Right to Erasure', status: 'covered' },
              { sec: '§14', name: 'Right to Grievance', status: 'covered' },
              { sec: '§17', name: 'Cross-Border Transfers', status: 'partial' },
              { sec: 'Rule 13', name: 'Security Safeguards', status: 'covered' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} viewport={{ once: true }}
                style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--s1)', border: `1px solid ${item.status === 'covered' ? 'rgba(0,255,157,0.2)' : 'rgba(255,176,32,0.2)'}` }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: item.status === 'covered' ? 'var(--c4)' : 'var(--c5)', marginBottom: 4 }}>{item.sec}</div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>{item.name}</div>
                <div style={{ fontSize: 10, marginTop: 6, color: item.status === 'covered' ? 'var(--c4)' : 'var(--c5)', fontFamily: 'JetBrains Mono' }}>
                  {item.status === 'covered' ? '✓ COVERED' : '◑ PARTIAL'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '60px 48px', background: 'var(--s1)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>Simple, Honest Pricing</h2>
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 40 }}>Built for world-scale enterprise intelligence. Scalable. Precise. Reliable.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {PRICING.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                style={{ padding: 28, borderRadius: 16, background: 'var(--bg)', border: plan.popular ? '1px solid var(--c1)' : '1px solid var(--border)', position: 'relative', boxShadow: plan.popular ? 'var(--glow-cyan)' : 'none' }}>
                {plan.popular && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--c1)', color: 'var(--bg)', padding: '2px 12px', borderRadius: 10, fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, color: plan.popular ? 'var(--c1)' : 'var(--text)' }}>{plan.price}<span style={{ fontSize: 14, fontWeight: 400 }}>{plan.period}</span></div>
                <div style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 20px' }}>{plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text)', alignItems: 'flex-start' }}>
                      <Check size={14} style={{ color: 'var(--c4)', marginTop: 2, flexShrink: 0 }} />{f}
                    </div>
                  ))}
                </div>
                <Link to="/register" className={plan.popular ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', fontSize: 14 }}>
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '60px 48px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 40 }}>Frequently Asked Questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 15, textAlign: 'left' }}>
                {faq.q}
                <ChevronDown size={16} style={{ color: 'var(--muted)', transform: openFaq === i ? 'rotate(180deg)' : '', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 12 }} />
              </button>
              {openFaq === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginTop: 10, paddingRight: 24 }}>
                  {faq.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 48px', background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(124,95,255,0.08))', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, marginBottom: 16 }}>Start Protecting Your Data Today</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 16 }}>14-day free trial. No credit card required. Deploy in minutes.</p>
        <Link to="/register" className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
          Get Started Free <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🛡</span>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, color: 'var(--c1)', fontSize: 14 }}>DataSentinel</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>— Global Enterprise Data Protection Platform</span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>© 2024 DataSentinel. All rights reserved.</div>
      </footer>
    </div>
  )
}
