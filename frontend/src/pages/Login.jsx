import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await authAPI.login(form)
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg px-4 py-8"
      style={{background:'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.06) 0%, #070B14 60%)'}}>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{background:'linear-gradient(135deg,#00D4FF22,#8B5CF622)',border:'1px solid #00D4FF44'}}>
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-gradient">CipherNest</h1>
          <p className="text-cyber-muted text-sm mt-1">Advanced Security Platform</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 md:p-8">
          <h2 className="text-lg font-semibold text-cyber-text mb-6">Welcome back</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-cyber-red/30 bg-cyber-red/10 text-cyber-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-cyber-muted font-mono uppercase tracking-wider block mb-1.5">Username</label>
              <input className="cyber-input" placeholder="Enter your username" autoCapitalize="none"
                value={form.username} onChange={e => set('username', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-cyber-muted font-mono uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" className="cyber-input" placeholder="Enter your password"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-98 mt-2"
              style={{background:'linear-gradient(135deg,#00D4FF,#8B5CF6)',color:'#070B14',
                opacity: loading ? 0.7 : 1}}>
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-cyber-muted mt-6">
            No account?{' '}
            <Link to="/register" className="text-cyber-accent hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
