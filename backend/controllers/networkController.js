let si;
try { si = require('systeminformation'); } catch(e) { si = null; }
const { ActivityLog } = require('../models/index');

const scanNetwork = async (req, res) => {
  try {
    if (!si) {
      return res.json({
        cloudMode: true,
        message: 'Network scanning requires local installation.',
        interfaces: [],
        connections: [],
        stats: { totalConnections: 0, established: 0 }
      });
    }

    const [ifaces, connections] = await Promise.all([
      si.networkInterfaces().catch(() => []),
      si.networkConnections().catch(() => [])
    ]);

    const activeIfaces = (Array.isArray(ifaces) ? ifaces : [ifaces])
      .filter(i => i.ip4 && !i.internal)
      .map(i => ({ iface: i.iface, ip4: i.ip4, mac: i.mac, type: i.type }));

    const established = connections.filter(c => c.state === 'ESTABLISHED').length;

    await ActivityLog.create({
      userId: req.user._id, action: 'Network Scan', details: `Found ${activeIfaces.length} active interfaces`, icon: '🌐'
    }).catch(() => {});

    res.json({
      interfaces: activeIfaces,
      connections: connections.slice(0, 50),
      stats: { totalConnections: connections.length, established }
    });
  } catch (error) {
    res.status(500).json({ message: 'Network scan failed', error: error.message });
  }
};

const getNetworkStats = async (req, res) => {
  try {
    if (!si) return res.json({ cloudMode: true, stats: [] });
    const stats = await si.networkStats().catch(() => []);
    res.json({ stats: Array.isArray(stats) ? stats : [stats] });
  } catch (error) {
    res.status(500).json({ message: 'Network stats failed', error: error.message });
  }
};

module.exports = { scanNetwork, getNetworkStats };
