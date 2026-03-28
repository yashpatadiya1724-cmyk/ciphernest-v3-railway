import axios from 'axios'

// In dev: Vite proxy handles /api → localhost:5000
// In prod: served from same Railway domain, /api works directly
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Response interceptor - handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cn_token')
      localStorage.removeItem('cn_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  profile: () => api.get('/auth/profile'),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: () => api.post('/auth/2fa/disable')
}

// Dashboard
export const dashAPI = {
  overview: () => api.get('/dashboard/overview'),
  systemStats: () => api.get('/dashboard/system-stats')
}

// Tools
export const toolsAPI = {
  phishing: (url) => api.post('/tools/phishing', { url }),
  password: (password) => api.post('/tools/password', { password }),
  breach: (email) => api.post('/tools/breach', { email }),
  domain: (domain) => api.post('/tools/domain', { domain }),
  webScan: (url) => api.post('/tools/web-scan', { url }),
  portScan: (target) => api.post('/tools/port-scan', { target }),
  ip: (ip) => api.post('/tools/ip', { ip }),
  encrypt: (text, key, mode) => api.post('/tools/encrypt', { text, key, mode }),
  hash: (text, algorithm) => api.post('/tools/hash', { text, algorithm }),
  base64: (text, mode) => api.post('/tools/base64', { text, mode }),
  binary: (text, mode) => api.post('/tools/binary', { text, mode }),
  jwtDecode: (token) => api.post('/tools/jwt-decode', { token }),
  recon: (domain) => api.post('/tools/recon', { domain }),
  darkWebScan: (email) => api.post('/tools/dark-web', { email }),
  sandbox: (filename) => api.post('/tools/sandbox', { filename }),
  stripMetadata: (text) => api.post('/tools/metadata-strip', { text }),
  history: (params) => api.get('/tools/history', { params })
}

// Chat
export const chatAPI = {
  send: (message, toolContext) => api.post('/chat/message', { message, toolContext }),
  history: () => api.get('/chat/history'),
  clear: () => api.delete('/chat/history'),
  status: () => api.get('/chat/status')
}

// Alerts
export const alertsAPI = {
  list: () => api.get('/alerts'),
  dismiss: (id) => api.patch(`/alerts/${id}/dismiss`),
  dismissAll: () => api.patch('/alerts/dismiss-all')
}

// WiFi
export const wifiAPI = {
  scan: () => api.get('/wifi/scan'),
  analyze: (network) => api.post('/wifi/analyze', { network })
}

// Secrets (Vault)
export const secretAPI = {
  list: () => api.get('/secrets'),
  add: (data) => api.post('/secrets', data),
  reveal: (id) => api.get(`/secrets/${id}`),
  delete: (id) => api.delete(`/secrets/${id}`)
}

// Reports
export const reportAPI = {
  generate: () => api.get('/reports/generate')
}

// Network Discovery
export const networkAPI = {
  scan: () => api.get('/network/scan'),
  stats: () => api.get('/network/stats')
}

// System Processes
export const processAPI = {
  analyze: () => api.get('/processes/analyze')
}
