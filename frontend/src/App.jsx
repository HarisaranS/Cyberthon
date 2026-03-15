import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/app/Dashboard'
import OnPremisesDashboard from './pages/app/OnPremisesDashboard'
import Infrastructure from './pages/app/Infrastructure'
import DataSources from './pages/app/DataSources'
import Scans from './pages/app/Scans'
import ScanDetail from './pages/app/ScanDetail'
import Inventory from './pages/app/Inventory'
import Reports from './pages/app/Reports'
import DPDPACompliance from './pages/app/DPDPACompliance'
import ConsentManagement from './pages/app/ConsentManagement'
import NominationRegistry from './pages/app/NominationRegistry'
import Alerts from './pages/app/Alerts'
import AuditLog from './pages/app/AuditLog'
import Copilot from './pages/app/Copilot'
import Settings from './pages/app/Settings'
import AssetInventory from './pages/app/AssetInventory'
import CloudIntegrations from './pages/app/CloudIntegrations'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:16 }}>🛡</div>
        <div style={{ fontFamily:'JetBrains Mono', color:'var(--c1)', fontSize:12 }}>INITIALIZING DATASENTINEL...</div>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { init } = useAuthStore()
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="on-premises" element={<OnPremisesDashboard />} />
          <Route path="infrastructure" element={<Infrastructure />} />
          <Route path="sources" element={<DataSources />} />
          <Route path="scans" element={<Scans />} />
          <Route path="scans/:id" element={<ScanDetail />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="consent" element={<ConsentManagement />} />
          <Route path="nominate" element={<NominationRegistry />} />
          <Route path="reports" element={<Reports />} />
          <Route path="compliance" element={<DPDPACompliance />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="copilot" element={<Copilot />} />
          <Route path="settings" element={<Settings />} />
          <Route path="assets" element={<AssetInventory />} />
          <Route path="cloud" element={<CloudIntegrations />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
