// Resource Guard — monitors system resources
// Gracefully degrades when running on Railway (no direct system access)
let si;
try { si = require('systeminformation'); } catch(e) { si = null; }

const { Alert } = require('../models/index');
const User = require('../models/User');

let guardInterval = null;

const startResourceGuard = () => {
  if (!si) {
    console.log('⚠️  Resource Guard: systeminformation not available (cloud environment)');
    return;
  }

  console.log('🛡️  Resource Guard: Started');

  guardInterval = setInterval(async () => {
    try {
      const [cpu, mem] = await Promise.all([
        si.currentLoad().catch(() => null),
        si.mem().catch(() => null)
      ]);

      if (!cpu || !mem) return;

      const cpuLoad = Math.round(cpu.currentLoad || 0);
      const memUsed = Math.round(((mem.total - mem.free) / mem.total) * 100);

      const criticalUsers = await User.find({}).limit(10).select('_id');

      for (const user of criticalUsers) {
        if (cpuLoad > 90) {
          await Alert.create({
            userId: user._id,
            type: 'warning',
            title: '⚡ High CPU Usage',
            message: `CPU usage at ${cpuLoad}% — possible runaway process`,
            source: 'resource-guard'
          }).catch(() => {});
        }
        if (memUsed > 90) {
          await Alert.create({
            userId: user._id,
            type: 'warning',
            title: '🧠 High Memory Usage',
            message: `Memory usage at ${memUsed}% — consider restarting services`,
            source: 'resource-guard'
          }).catch(() => {});
        }
      }
    } catch (err) {
      // Silently ignore in cloud environments
    }
  }, 60000); // check every 60s
};

const stopResourceGuard = () => {
  if (guardInterval) { clearInterval(guardInterval); guardInterval = null; }
};

module.exports = { startResourceGuard, stopResourceGuard };
