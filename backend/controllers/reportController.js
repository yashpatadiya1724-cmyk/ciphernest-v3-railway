const User = require('../models/User');
const { Alert, ActivityLog, ToolResult } = require('../models/index');
const Secret = require('../models/Secret');

// @desc Generate comprehensive security report
const generateReport = async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, alerts, tools, activity, secretsCount] = await Promise.all([
      User.findById(userId),
      Alert.find({ userId }).sort({ timestamp: -1 }).limit(50),
      ToolResult.find({ userId }).sort({ timestamp: -1 }).limit(20),
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(20),
      Secret.countDocuments({ userId })
    ]);

    const report = {
      generatedAt: new Date(),
      user: {
        username: user.username,
        email: user.email,
        securityScore: user.securityScore,
        accountCreated: user.createdAt
      },
      summary: {
        activeAlerts: alerts.filter(a => !a.dismissed).length,
        totalResolved: alerts.filter(a => a.dismissed).length,
        toolsUsed: tools.length,
        secretsProtected: secretsCount
      },
      securityPosture: {
        rating: user.securityScore >= 70 ? 'Strong' : user.securityScore >= 40 ? 'Fair' : 'At Risk',
        criticalIssues: alerts.filter(a => a.type === 'critical' && !a.dismissed).length,
        recommendations: []
      },
      recentActivity: activity.map(a => `${new Date(a.timestamp).toLocaleString()}: ${a.action}`),
      recentAlerts: alerts.map(a => `[${a.type.toUpperCase()}] ${a.title}: ${a.message}`)
    };

    // Add dynamic recommendations
    if (user.securityScore < 70) report.securityPosture.recommendations.push('Run more security scans to identify potential risks.');
    if (report.summary.activeAlerts > 0) report.securityPosture.recommendations.push('Review and dismiss all active alerts in your dashboard.');
    if (report.summary.secretsProtected < 1) report.securityPosture.recommendations.push('Use the Secure Vault to protect sensitive credentials.');

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Report generation failed', error: error.message });
  }
};

module.exports = { generateReport };
