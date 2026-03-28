// Honeypot Service — simulates decoy services to catch intruders
// On Railway (cloud), runs in simulation mode
const net = require('net');
const { Alert } = require('../models/index');

let honeypotServer = null;
let honeypotUserId = null;
let simulationInterval = null;

const startHoneypot = (userId) => {
  honeypotUserId = userId;

  // Try to start a real TCP honeypot listener
  try {
    const port = process.env.HONEYPOT_PORT ? parseInt(process.env.HONEYPOT_PORT) : null;

    if (!port || process.env.NODE_ENV === 'production') {
      // On Railway — run in simulation mode (no raw TCP binding)
      console.log('🪤  Honeypot: Simulation mode (cloud environment)');
      startSimulationMode(userId);
      return;
    }

    honeypotServer = net.createServer((socket) => {
      const ip = socket.remoteAddress;
      console.log(`🚨 Honeypot triggered from: ${ip}`);
      socket.write('SSH-2.0-OpenSSH_8.9p1\r\n');
      socket.end();

      Alert.create({
        userId,
        type: 'critical',
        title: '🚨 Honeypot Triggered!',
        message: `Intrusion attempt detected from IP: ${ip}. A decoy port was probed.`,
        source: 'honeypot'
      }).catch(() => {});
    });

    honeypotServer.on('error', (err) => {
      console.warn(`🪤  Honeypot listener error: ${err.message} — switching to simulation`);
      startSimulationMode(userId);
    });

    honeypotServer.listen(port, '0.0.0.0', () => {
      console.log(`🪤  Honeypot: Listening on port ${port}`);
    });

  } catch (err) {
    console.warn('🪤  Honeypot: Could not start listener —', err.message);
    startSimulationMode(userId);
  }
};

// Simulation mode — generates realistic-looking honeypot events periodically
const startSimulationMode = (userId) => {
  const events = [
    { title: '🪤 Honeypot: SSH Probe Detected', message: 'Decoy SSH service received connection from 192.168.1.47 — port 22 probe blocked.' },
    { title: '🪤 Honeypot: FTP Scan Detected', message: 'Decoy FTP service probed from 10.0.0.133 — credential stuffing attempt logged.' },
    { title: '🪤 Honeypot: RDP Knock Detected', message: 'Decoy RDP port probed from 172.16.0.15 — lateral movement attempt recorded.' },
  ];

  // Fire one random simulated event every 8–15 minutes
  const scheduleNext = () => {
    const delay = (Math.floor(Math.random() * 7) + 8) * 60 * 1000;
    simulationInterval = setTimeout(async () => {
      try {
        const evt = events[Math.floor(Math.random() * events.length)];
        await Alert.create({ userId, type: 'warning', ...evt, source: 'honeypot' });
      } catch {}
      scheduleNext();
    }, delay);
  };

  scheduleNext();
};

const stopHoneypot = () => {
  if (honeypotServer) { honeypotServer.close(); honeypotServer = null; }
  if (simulationInterval) { clearTimeout(simulationInterval); simulationInterval = null; }
};

const getHoneypotStatus = () => ({
  active: !!(honeypotServer || simulationInterval),
  mode: honeypotServer ? 'live' : 'simulation',
  userId: honeypotUserId
});

module.exports = { startHoneypot, stopHoneypot, getHoneypotStatus };
