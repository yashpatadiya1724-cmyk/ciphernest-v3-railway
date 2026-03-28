require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

// Diagnostic error handlers
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🌊 UNHANDLED REJECTION:', reason.stack || reason);
});

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const toolRoutes = require('./routes/tools');
const wifiRoutes = require('./routes/wifi');
const chatRoutes = require('./routes/chat');
const alertRoutes = require('./routes/alerts');
const secretRoutes = require('./routes/secrets');
const reportRoutes = require('./routes/reports');
const networkRoutes = require('./routes/network');
const processRoutes = require('./routes/processes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware — allow any origin in production (Railway handles SSL)
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? true   // allow all origins — frontend is served from same Railway domain
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve built React frontend in production
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/wifi', wifiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/secrets', secretRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/processes', processRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'CipherNest v2 API is running', timestamp: new Date() });
});

// Serve React app for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  const indexFile = path.join(publicDir, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) res.status(200).send('CipherNest API is running. Build the frontend to serve the app.');
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const { checkAIHealth } = require('./services/aiService');
const { startResourceGuard } = require('./services/resourceGuard');
const { startHoneypot } = require('./services/honeypotService');
const { initSocket } = require('./services/socketService');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🛡️  CipherNest v2 backend running on port ${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Check AI connectivity
  const aiStatus = await checkAIHealth();
  if (aiStatus.online) {
    console.log(`🤖 AI Status: ✅ Online (${aiStatus.provider} — ${aiStatus.model})`);
  } else {
    console.warn(`⚠️  AI Status: ❌ Offline`);
    console.warn(`   Set GEMINI_API_KEY or GROQ_API_KEY in .env`);
    console.warn(`   Gemini (FREE): https://aistudio.google.com/app/apikey`);
    console.warn(`   Groq (FREE):   https://console.groq.com/keys`);
  }

  // Start Autonomous Resource Guard
  startResourceGuard();

  // Start Honeypot (linked to first user for alerts)
  User.findOne().then(user => {
    if (user) startHoneypot(user._id);
  }).catch(err => console.error('Honeypot startup error:', err));

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
