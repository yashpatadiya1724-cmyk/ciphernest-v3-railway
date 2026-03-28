import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { dashAPI, reportAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { RiskBadge, SectionHeader, EmptyState, Spinner } from '../components/common/index'
import SystemHealthWidget from '../components/dashboard/SystemHealthWidget'
import ActivityTimeline from '../components/dashboard/ActivityTimeline'
import DigitalClock from '../components/dashboard/DigitalClock'

const ScoreRing = ({ score }) => {
  const radius = 54, circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#00FF88' : score >= 40 ? '#FFD700' : '#FF3366'
  const label = score >= 70 ? 'Great' : score >= 40 ? 'Fair' : 'At Risk'

  return (
    <div className="relative inline-flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#1A2744" strokeWidth="8" />
        <circle cx="72" cy="72" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
        <span className="text-xs text-cyber-muted">{label}</span>
      </div>
    </div>
  )
}

const alertIcon = (type) => ({ critical: '🔴', warning: '🟡', info: '🔵' }[type] || '⚪')

export default function Dashboard() {
  const { user, refreshProfile } = useAuth()
  const { socket } = useSocket()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const overviewRes = await dashAPI.overview()
      setOverview(overviewRes.data)
      refreshProfile()
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [refreshProfile])

  const handleDownloadReport = async () => {
    try {
      const { data } = await reportAPI.generate()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `CipherNest_Report_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to generate report')
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => { setRefreshing(true); fetchData() }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><Spinner size="lg" /><p className="text-cyber-muted text-sm mt-3">Initializing secure session...</p></div>
    </div>
  )

  const score = overview?.securityScore ?? user?.securityScore ?? 50

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, <span className="text-gradient font-extrabold">{user?.username}</span>
          </h1>
          <p className="text-cyber-muted text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            System Status: <span className="text-cyber-green font-mono uppercase text-xs tracking-wider">Optimal</span>
          </p>
        </div>
        <div className="flex items-center gap-6">
          <DigitalClock />
          <div className="h-8 w-[1px] bg-cyber-border hidden md:block" />
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadReport} className="cyber-btn flex items-center gap-2 group">
              <span className="group-hover:animate-bounce">📥</span> Export
            </button>
            <button onClick={handleRefresh} disabled={refreshing}
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-cyber hover:bg-cyber-accent/5 text-cyber-muted hover:text-cyber-accent transition-all disabled:opacity-50">
              <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top row: Score + Resource Guard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Security Score */}
        <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-8 lg:col-span-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl text-cyber-accent">🛡️</span>
          </div>
          <ScoreRing score={score} />
          <div className="text-center md:text-left">
            <h3 className="text-xs font-bold font-mono text-cyber-muted uppercase tracking-widest mb-2">Security Posture</h3>
            <p className="text-lg font-bold text-cyber-text leading-tight mb-2">{overview?.statusMessage || 'System Integrity Normal'}</p>
            <p className="text-xs text-cyber-muted mb-4 max-w-[200px]">Proactive scanning is active. No immediate action required.</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="risk-badge-low flex items-center gap-1">✓ AI Guard</span>
              <span className="risk-badge-low flex items-center gap-1">✓ IDS Active</span>
            </div>
          </div>
        </div>

        {/* Resource Guard (Live Stats) */}
        <div className="lg:col-span-7">
          <SystemHealthWidget />
        </div>
      </div>

      {/* Tools Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold font-mono text-cyber-muted uppercase tracking-widest">Global Security Toolbox</h3>
          <Link to="/tools" className="text-[10px] font-mono text-cyber-accent hover:underline uppercase tracking-wider">All Tools Access →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { icon: '🗺️', label: 'Threat Map', path: '/threats' },
            { icon: '📡', label: 'WiFi Guard', path: '/wifi' },
            { icon: '🎯', label: 'Recon', path: '/tools/recon' },
            { icon: '🔍', label: 'Phishing', path: '/tools/phishing' },
            { icon: '📧', label: 'Breach', path: '/tools/breach' },
            { icon: '🕵️', label: 'Dark Web', path: '/tools/dark-web' },
            { icon: '🌐', label: 'Net Map', path: '/network' },
            { icon: '🕵️', label: 'Processes', path: '/processes' },
            { icon: '🪤', label: 'Honeypot', path: '/honeypot' },
            { icon: '🔐', label: 'Vault', path: '/vault' },
            { icon: '🤖', label: 'Cipher', path: '/cipher' },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className="tool-card flex flex-col items-center justify-center p-4 text-center group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
              <span className="text-[11px] font-bold text-cyber-muted group-hover:text-cyber-accent whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Alerts */}
        <div className="flex flex-col h-full">
          <SectionHeader title="Critical Alerts" />
          <div className="glass-card p-5 flex-1 space-y-3 min-h-[300px]">
            {!overview?.recentAlerts?.length ? (
              <EmptyState icon="🌈" title="Perimeter Secured" desc="No critical anomalies detected in the last 24h." />
            ) : (
              overview.recentAlerts.map(alert => (
                <div key={alert._id} className={`alert-${alert.type} p-4 flex items-start gap-3 transition-transform hover:scale-[1.01]`}>
                  <span className="text-lg flex-shrink-0">{alertIcon(alert.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-cyber-text uppercase tracking-tight">{alert.title}</p>
                    <p className="text-[11px] text-cyber-muted mt-1 leading-relaxed opacity-80">{alert.message}</p>
                  </div>
                  <RiskBadge level={alert.type === 'critical' ? 'high' : alert.type === 'warning' ? 'medium' : 'low'} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="flex flex-col h-full">
          <ActivityTimeline activities={overview?.activityTimeline || []} />
        </div>
      </div>
    </div>
  )
}
