import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { alertsAPI } from '../../services/api'
import CipherChat from '../chat/CipherChat'

const bottomNavItems = [
  { path: '/dashboard', icon: '⬡', label: 'Home' },
  { path: '/tools',     icon: '⚙',  label: 'Tools' },
  { path: '/vault',     icon: '🔐', label: 'Vault' },
  { path: '/cipher',   icon: '🤖', label: 'AI' },
  { path: '/wifi',     icon: '📡', label: 'WiFi' },
]

const navItems = [
  { path: '/dashboard', icon: '⬡',  label: 'Dashboard' },
  { path: '/tools',     icon: '⚙',  label: 'Security Tools' },
  { path: '/wifi',      icon: '📡', label: 'WiFi Guard' },
  { path: '/network',   icon: '🌐', label: 'Network Map' },
  { path: '/threats',   icon: '🗺️', label: 'Live Threat Map' },
  { path: '/processes', icon: '🕵️', label: 'Process Watcher' },
  { path: '/vault',     icon: '🔐', label: 'Secure Vault' },
  { path: '/cipher',   icon: '🤖', label: 'Ask Cipher' },
  { path: '/honeypot', icon: '🪤', label: 'Honeypot' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [alerts, setAlerts] = useState([])
  const [showAlertDrop, setShowAlertDrop] = useState(false)
  const [showUserDrop, setShowUserDrop]   = useState(false)
  const [chatOpen, setChatOpen]           = useState(false)
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  useEffect(() => {
    const fetchAlerts = async () => {
      try { const { data } = await alertsAPI.list(); setAlerts(data.filter(a => !a.dismissed)) } catch {}
    }
    fetchAlerts()
    const id = setInterval(fetchAlerts, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (a) => setAlerts(p => [a, ...p])
    socket.on('new_alert', handler)
    return () => socket.off('new_alert', handler)
  }, [socket])

  useEffect(() => {
    setSidebarOpen(false); setShowAlertDrop(false); setShowUserDrop(false)
  }, [location.pathname])

  const criticalCount = alerts.filter(a => a.type === 'critical').length
  const totalUnread   = alerts.length
  const handleDismiss    = async (id) => { await alertsAPI.dismiss(id);  setAlerts(p => p.filter(a => a._id !== id)) }
  const handleDismissAll = async ()   => { await alertsAPI.dismissAll(); setAlerts([]); setShowAlertDrop(false) }
  const alertIcon        = (t) => t === 'critical' ? '🔴' : t === 'warning' ? '🟡' : '🔵'
  const scoreColor = user?.securityScore >= 70 ? '#00FF88' : user?.securityScore >= 40 ? '#FFD700' : '#FF3366'

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-bg">

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside style={{transition:'transform .3s'}} className={`
        fixed lg:relative z-50 lg:z-auto top-0 left-0 h-full
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 lg:w-56 flex flex-col border-r border-cyber bg-cyber-panel lg:flex-shrink-0
      `}>
        <div className="h-14 flex items-center px-4 border-b border-cyber gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{background:'linear-gradient(135deg,#00D4FF22,#8B5CF622)',border:'1px solid #00D4FF44'}}>
            <span className="text-base">🛡️</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm text-gradient block">CipherNest</span>
            <span className="text-cyber-muted text-xs font-mono">Security Platform</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-cyber-muted hover:text-cyber-accent lg:hidden text-xl leading-none">✕</button>
        </div>

        <div className="mx-3 mt-3 p-3 rounded-xl border border-cyber/40 bg-cyber-bg/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{background:'linear-gradient(135deg,#00D4FF,#8B5CF6)',color:'#070B14'}}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-cyber-text truncate">{user?.username}</p>
              <p className="text-xs font-mono" style={{color:scoreColor}}>Score: {user?.securityScore ?? 50}/100</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
          <p className="text-cyber-muted text-xs font-mono uppercase tracking-wider px-3 mb-2">Navigation</p>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="text-lg w-6 text-center flex-shrink-0">{item.icon}</span>
              <span className="font-medium truncate">{item.label}</span>
            </NavLink>
          ))}
          <div className="pt-3 mt-3 border-t border-cyber/30">
            <button onClick={() => { setChatOpen(true); setSidebarOpen(false) }}
              className="sidebar-link w-full text-left" style={{color:'#8B5CF6'}}>
              <span className="text-lg w-6 text-center flex-shrink-0">💬</span>
              <span className="font-medium">Open Chat</span>
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-cyber">
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-cyber-red hover:bg-cyber-red/10 transition-all">
            <span>🚪</span><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOP BAR */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-cyber bg-cyber-panel/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-accent/10 transition-all active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="font-semibold text-sm text-cyber-text">
              {navItems.find(n => location.pathname.startsWith(n.path))?.label ?? 'CipherNest'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyber/50 bg-cyber-bg/50">
              <span className="text-xs text-cyber-muted font-mono">Score</span>
              <span className="text-xs font-bold font-mono" style={{color:scoreColor}}>{user?.securityScore ?? 50}</span>
            </div>

            {/* ALERTS */}
            <div className="relative">
              <button onClick={() => { setShowAlertDrop(!showAlertDrop); setShowUserDrop(false) }}
                className="relative p-2 rounded-lg border border-cyber/50 hover:border-cyber-accent/40 text-cyber-muted hover:text-cyber-accent transition-all active:scale-95">
                <span className="text-base">🔔</span>
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{background: criticalCount > 0 ? '#FF3366' : '#FFD700', color:'#070B14'}}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>
              {showAlertDrop && (
                <div className="absolute right-0 top-12 w-80 max-w-[90vw] glass-card p-3 z-50 shadow-2xl"
                  style={{boxShadow:'0 16px 48px rgba(0,0,0,0.7)'}}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Alerts ({totalUnread})</span>
                    {totalUnread > 0 && <button onClick={handleDismissAll} className="text-xs text-cyber-muted hover:text-cyber-accent">Dismiss all</button>}
                  </div>
                  {alerts.length === 0
                    ? <p className="text-cyber-muted text-xs text-center py-4">No active alerts 🎉</p>
                    : <div className="space-y-2 max-h-72 overflow-y-auto">
                        {alerts.slice(0, 8).map(a => (
                          <div key={a._id} className={`alert-${a.type} p-2.5 flex items-start gap-2`}>
                            <span className="text-sm flex-shrink-0 mt-0.5">{alertIcon(a.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{a.title}</p>
                              <p className="text-xs text-cyber-muted mt-0.5 line-clamp-2">{a.message}</p>
                            </div>
                            <button onClick={() => handleDismiss(a._id)} className="text-cyber-muted hover:text-cyber-accent text-xs flex-shrink-0 p-1">✕</button>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              )}
            </div>

            {/* USER AVATAR (mobile) */}
            <div className="relative">
              <button onClick={() => { setShowUserDrop(!showUserDrop); setShowAlertDrop(false) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold active:scale-95"
                style={{background:'linear-gradient(135deg,#00D4FF,#8B5CF6)',color:'#070B14'}}>
                {user?.username?.[0]?.toUpperCase()}
              </button>
              {showUserDrop && (
                <div className="absolute right-0 top-10 w-44 glass-card p-2 z-50 shadow-2xl">
                  <p className="text-xs text-cyber-muted px-2 py-1 truncate">{user?.email}</p>
                  <hr className="border-cyber my-1" />
                  <button onClick={() => { logout(); navigate('/login') }}
                    className="w-full text-left px-2 py-2 rounded text-sm text-cyber-red hover:bg-cyber-red/10 transition-colors">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT — extra bottom padding for mobile bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>

        {/* BOTTOM NAV BAR — mobile only */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-cyber"
          style={{background:'rgba(13,20,34,0.97)',backdropFilter:'blur(16px)'}}>
          <div className="flex items-stretch justify-around">
            {bottomNavItems.map(item => {
              const active = location.pathname.startsWith(item.path)
              return (
                <NavLink key={item.path} to={item.path}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-90 relative"
                  style={{color: active ? '#00D4FF' : '#64748B', minHeight: '56px'}}>
                  {active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{background:'#00D4FF'}} />}
                  <span className="text-[22px] leading-none">{item.icon}</span>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </NavLink>
              )
            })}
            <button onClick={() => setChatOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 active:scale-90 transition-all"
              style={{color:'#64748B', minHeight:'56px'}}>
              <span className="text-[22px] leading-none">💬</span>
              <span className="text-[10px] font-semibold">Chat</span>
            </button>
          </div>
        </nav>
      </div>

      {/* FLOATING CHAT BUTTON — desktop only */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)}
          className="hidden lg:flex fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
          style={{background:'linear-gradient(135deg,#00D4FF,#8B5CF6)',boxShadow:'0 4px 24px rgba(0,212,255,0.4)'}}>
          <span className="text-xl">🤖</span>
        </button>
      )}

      {chatOpen && <CipherChat onClose={() => setChatOpen(false)} />}

      {(showAlertDrop || showUserDrop) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowAlertDrop(false); setShowUserDrop(false) }} />
      )}
    </div>
  )
}
