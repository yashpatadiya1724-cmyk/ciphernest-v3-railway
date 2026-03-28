// systeminformation works locally; on Railway (cloud) we return mock stats gracefully
let si;
try { si = require('systeminformation'); } catch(e) { si = null; }

const { Alert, ActivityLog, ToolResult } = require('../models/index');
const User = require('../models/User');

// Get system stats — returns real data locally, simulated on Railway
const getSystemStats = async (req, res) => {
  try {
    if (!si) {
      // Running in cloud — return simulated/neutral stats
      return res.json({
        cpu:  { usage: Math.floor(Math.random() * 30) + 10, status: 'Normal' },
        ram:  { usage: Math.floor(Math.random() * 40) + 20, total: 4, used: 1, status: 'Normal' },
        disk: { usage: Math.floor(Math.random() * 20) + 30, total: 50, status: 'Normal' },
        network: { rxKBs: Math.floor(Math.random() * 100), txKBs: Math.floor(Math.random() * 50) },
        cloudMode: true,
        timestamp: new Date()
      });
    }

    const [cpu, mem, disk, defaultIface] = await Promise.all([
      si.currentLoad().catch(() => ({ currentLoad: 0 })),
      si.mem().catch(() => ({ used: 0, total: 1, free: 1 })),
      si.fsSize().catch(() => []),
      si.networkInterfaceDefault().catch(() => '')
    ]);

    const networkStats = defaultIface
      ? await si.networkStats(defaultIface).catch(() => [])
      : [];
    const activeStats = networkStats[0] || null;

    const cpuUsage  = Math.round(cpu.currentLoad || 0);
    const ramUsage  = Math.round((mem.used / mem.total) * 100);
    const diskUsage = disk.length > 0 ? Math.round((disk[0].used / disk[0].size) * 100) : 0;
    const netRx = activeStats ? Math.round(activeStats.rx_sec / 1024) : 0;
    const netTx = activeStats ? Math.round(activeStats.tx_sec / 1024) : 0;
    const getStatus = (p) => p >= 80 ? 'High' : p >= 50 ? 'Moderate' : 'Normal';

    res.json({
      cpu:  { usage: cpuUsage,  status: getStatus(cpuUsage) },
      ram:  { usage: ramUsage,  total: Math.round(mem.total / (1024 ** 3)), used: Math.round(mem.used / (1024 ** 3)), status: getStatus(ramUsage) },
      disk: { usage: diskUsage, total: disk[0] ? Math.round(disk[0].size / (1024 ** 3)) : 0, status: getStatus(diskUsage) },
      network: { rxKBs: netRx, txKBs: netTx },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch system stats', error: error.message });
  }
};

// Dashboard overview — works in all environments
const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const [user, alerts, recentTools, recentActivity] = await Promise.all([
      User.findById(userId),
      Alert.find({ userId, dismissed: false }).sort({ timestamp: -1 }).limit(5),
      ToolResult.find({ userId }).sort({ timestamp: -1 }).limit(5),
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(10)
    ]);

    const criticalCount = alerts.filter(a => a.type === 'critical').length;
    const warningCount  = alerts.filter(a => a.type === 'warning').length;
    let statusMessage = 'You are secure';
    if (criticalCount > 0)          statusMessage = `${criticalCount} critical issue(s) need attention!`;
    else if (warningCount > 0)       statusMessage = `${warningCount} warning(s) to review`;
    else if (user.securityScore < 50) statusMessage = 'Your security could be improved';
    else if (user.securityScore >= 80) statusMessage = 'Great job — you are well protected!';
    else                              statusMessage = 'You are mostly safe';

    res.json({
      securityScore: user.securityScore,
      statusMessage,
      alertSummary: { critical: criticalCount, warning: warningCount, total: alerts.length },
      recentAlerts: alerts,
      recentTools,
      activityTimeline: recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Dashboard data fetch failed', error: error.message });
  }
};

module.exports = { getSystemStats, getDashboardOverview };
