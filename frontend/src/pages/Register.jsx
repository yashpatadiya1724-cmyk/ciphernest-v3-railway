import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true); setError('')
    try {
      await authAPI.register({ username: form.username, email: form.email, password: form.password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg px-4 py-8"
      style={{background:'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06) 0%, #070B14 60%)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{background:'linear-gradient(135deg,#8B5CF622,#00D4FF22)',border:'1px solid #8B5CF644'}}>
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-gradient">Create Account</h1>
          <p className="text-cyber-muted text-sm mt-1">Join CipherNest Security Platform</p>
        </div>

        <div className="glass-card p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-cyber-red/30 bg-cyber-red/10 text-cyber-red text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-cyber-muted font-mono uppercase tracking-wider block mb-1.5">Username</label>
              <input className="cyber-input" placeholder="Choose a username" autoCapitalize="none"
                value={form.username} onChange={e => set('username', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-cyber-muted font-mono uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" className="cyber-input" placeholder="your@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-cyber-muted font-mono uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" className="cyber-input" placeholder="Min. 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-cyber-muted font-mono uppercase tracking-wider block mb-1.5">Confirm Password</label>
              <input type="password" className="cyber-input" placeholder="Repeat password"
                value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-98 mt-2"
              style={{background:'linear-gradient(135deg,#8B5CF6,#00D4FF)',color:'#fff',opacity:loading?0.7:1}}>
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-cyber-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyber-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
