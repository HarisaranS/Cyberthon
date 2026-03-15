import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Zap } from 'lucide-react'
import api from '../../lib/axios'

const PROMPTS = [
  'What are my top 3 compliance risks right now?',
  'Draft a data breach notification for global regulators',
  'Summarize GDPR Article 32 security obligations',
  'What is the CCPA/CPRA right to limit sensitive data use?',
  'Explain DPDPA 2023 Section 8 security safeguards',
  'How do I handle a global right to erasure request?',
  'Create a multi-jurisdiction consent notice',
]

export default function Copilot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your Enterprise Global Data Protection Copilot. I can help you navigate global regulations like GDPR, CCPA, and DPDPA 2023. I can draft notices, assess risks, and guide your international compliance programme. What would you like to know?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const SYSTEM_CONTEXT = `You are DataSentinel's expert Global Data Protection Copilot. You are an expert on international privacy laws including GDPR (EU), CCPA/CPRA (USA), and DPDPA 2023 (India). Provide concise, actionable, law-specific compliance advice. Reference specific regulatory sections when relevant. Keep responses focused, professional, and world-class.`

  const send = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: userMsg }])
    setLoading(true)

    // Current message object to update as tokens come in
    const assistantMsg = { role: 'assistant', content: '' }
    setMessages(m => [...m, assistantMsg])

    try {
      const token = localStorage.getItem('ds_access_token');
      const es = new EventSource(`${api.defaults.baseURL}/ai/copilot/stream?q=${encodeURIComponent(userMsg)}&token=${token}`);
      
      es.onmessage = (e) => {
        if (e.data === '[DONE]') {
          es.close();
          setLoading(false);
          return;
        }
        try {
          const data = JSON.parse(e.data);
          if (data.token) {
            assistantMsg.content += data.token;
            setMessages(m => {
              const last = [...m];
              last[last.length - 1] = { ...assistantMsg };
              return last;
            });
          }
          if (data.error) {
            throw new Error(data.error);
          }
        } catch (err) {
          console.error('Parse error', err);
        }
      };

      es.onerror = (err) => {
        console.error('SSE error', err);
        es.close();
        setLoading(false);
        // If SSE fails immediately, use fallback
        if (assistantMsg.content === '') {
          assistantMsg.content = generateLocalResponse(userMsg);
          setMessages(m => {
            const last = [...m];
            last[last.length - 1] = { ...assistantMsg };
            return last;
          });
        }
      };
    } catch (err) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: "I'm having trouble connecting to the AI core. Please try again or check your network."
      }])
      setLoading(false)
    }
  }

  const generateLocalResponse = (q) => {
    const lower = q.toLowerCase()
    if (lower.includes('breach') && lower.includes('72')) return "Under DPDPA §8(6), you must notify the Data Protection Board within **72 hours** of becoming aware of a personal data breach."
    if (lower.includes('erasure') || lower.includes('delete')) return "Under DPDPA §13, data principals have the right to erasure of their personal data."
    return "I'm currently operating in offline mode. Please reconnect to the AI Engine for full compliance analysis."
  }

  return (
    <div style={{ height: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={24} style={{ color: 'var(--c2)' }} /> Global Intelligence Nexus
        </h1>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>DataSentinel Global Intelligence Nexus — High-speed AI compliance layer powered by Groq Llama-3.3</div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--c2), var(--c7))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} style={{ color: 'white' }} />
                </div>
              )}
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--c1), var(--c2))' : 'var(--s2)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                fontSize: 14, lineHeight: 1.6, color: msg.role === 'user' ? 'var(--bg)' : 'var(--text)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--c2), var(--c7))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} style={{ color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c2)', animation: `pulse-badge 1s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>SUGGESTED PROMPTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PROMPTS.map((p, i) => (
                <button key={i} onClick={() => send(p)} style={{ background: 'rgba(124,95,255,0.08)', border: '1px solid rgba(124,95,255,0.2)', borderRadius: 16, padding: '6px 12px', color: 'var(--c2)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.target.style.background = 'rgba(124,95,255,0.16)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(124,95,255,0.08)'}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            className="input" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about global compliance (GDPR, CCPA, DPDPA), rights, or risk remediation..."
            style={{ flex: 1 }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-primary" style={{ padding: '10px 16px' }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
