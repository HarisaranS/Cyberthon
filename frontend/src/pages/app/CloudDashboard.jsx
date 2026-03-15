import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Plus, Play, Database, Search } from 'lucide-react';
import api from '../../lib/axios';

export default function CloudDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sources, setSources] = useState([]);
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({ sources: 0, pii: 0, risk: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sourcesRes, scansRes] = await Promise.all([
          api.get('/sources?infrastructure=cloud'),
          api.get('/scans')
        ]);
        const srcData = sourcesRes.data.data || [];
        setSources(srcData);
        const cloudScans = (scansRes.data.data || []).filter(s => {
          const src = srcData.find(x => x._id === s.connectorId);
          return src && src.infrastructure === 'cloud';
        });
        setScans(cloudScans);
        setStats({
          sources: srcData.length,
          pii: srcData.reduce((sum, s) => sum + (s.totalPIIFound || 0), 0),
          risk: srcData.length > 0 ? Math.round(srcData.reduce((sum, s) => sum + (s.riskScore || 0), 0) / srcData.length) : 0
        });
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleScan = async (sourceId) => {
    try {
      await api.post('/scans', { connectorId: sourceId, name: 'Quick scan' });
      window.location.reload();
    } catch (err) {
      console.error('Scan failed:', err);
    }
  };

  return (
    <div style={{ padding: '32px', background: 'linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Cloud style={{ width: '40px', height: '40px', color: '#9333ea' }} />
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: '0' }}>Cloud Infrastructure</h1>
            <p style={{ color: '#4b5563', margin: '4px 0 0 0', fontSize: '14px' }}>Manage and monitor your cloud storage and SaaS applications</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>Total Sources</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9333ea' }}>{stats.sources}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>Active Scans</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{scans.filter(s => s.status === 'running').length}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>PII Found</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{stats.pii}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>Avg Risk Score</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ea580c' }}>{stats.risk}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 20px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'overview' ? '#9333ea' : '#6b7280',
            borderBottom: activeTab === 'overview' ? '3px solid #9333ea' : 'none',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          style={{
            padding: '12px 20px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'sources' ? '#9333ea' : '#6b7280',
            borderBottom: activeTab === 'sources' ? '3px solid #9333ea' : 'none',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Data Sources
        </button>
        <button
          onClick={() => setActiveTab('scans')}
          style={{
            padding: '12px 20px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'scans' ? '#9333ea' : '#6b7280',
            borderBottom: activeTab === 'scans' ? '3px solid #9333ea' : 'none',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Scans
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: '0 0 16px 0' }}>Recent Sources</h3>
            <p style={{ color: '#6b7280', margin: '0' }}>No sources configured yet. Click "Add Data Source" to get started.</p>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: '0 0 16px 0' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => navigate('/app/sources?infrastructure=cloud')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#9333ea',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#7e22ce'}
                onMouseOut={(e) => e.target.style.background = '#9333ea'}
              >
                <Plus style={{ width: '18px', height: '18px' }} />
                Add Data Source
              </button>
              <button
                onClick={() => setActiveTab('scans')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#16a34a',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#15803d'}
                onMouseOut={(e) => e.target.style.background = '#16a34a'}
              >
                <Play style={{ width: '18px', height: '18px' }} />
                View Scans
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0' }}>Data Sources</h3>
            <button
              onClick={() => navigate('/app/sources?infrastructure=cloud')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#9333ea',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              <Plus style={{ width: '18px', height: '18px' }} />
              Add Source
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>Loading...</div>
          ) : sources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
              <Database style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: '0.5' }} />
              <p style={{ fontSize: '16px', margin: '0' }}>No cloud sources configured</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '8px 0 0 0' }}>Add an S3, Azure Blob, or Google Drive source to get started</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {sources.map(src => (
                <div key={src._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{src.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{src.type.toUpperCase()} • {src.totalPIIFound} PII found</div>
                  </div>
                  <button
                    onClick={() => handleScan(src._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#16a34a',
                      color: 'white',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    <Play style={{ width: '14px', height: '14px' }} />
                    Scan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'scans' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: '0 0 24px 0' }}>Recent Scans</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>Loading...</div>
          ) : scans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
              <Search style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: '0.5' }} />
              <p style={{ fontSize: '16px', margin: '0' }}>No scans yet</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '8px 0 0 0' }}>Add a data source and run a scan to see results here</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {scans.slice(0, 5).map(scan => (
                <div key={scan._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{scan.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Status: {scan.status} • {scan.totalPIIFound} PII found</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{scan.progress}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
