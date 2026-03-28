/**
 * Risk Analysis Engine
 * Assigns risk levels and updates user security score
 */
const User = require('../models/User');
const { Alert, ActivityLog } = require('../models/index');

/**
 * Determine risk level from score
 */
const getRiskLevel = (score) => {
  if (score >= 70) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
};

/**
 * Get alert type from risk level
 */
const getAlertType = (riskLevel) => {
  const map = { low: 'info', medium: 'warning', high: 'critical' };
  return map[riskLevel] || 'info';
};

/**
 * Analyze phishing URL risk
 */
const analyzePhishingRisk = (url) => {
  let score = 0;
  const flags = [];

  const suspiciousKeywords = ['login', 'verify', 'account', 'secure', 'update', 'confirm', 'banking', 'paypal', 'amazon'];
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
  const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();

    if (ipPattern.test(hostname)) { score += 40; flags.push('IP address used instead of domain'); }
    if (hostname.split('.').length > 4) { score += 20; flags.push('Too many subdomains'); }
    suspiciousTLDs.forEach(tld => {
      if (hostname.endsWith(tld)) { score += 30; flags.push(`Suspicious TLD: ${tld}`); }
    });
    suspiciousKeywords.forEach(kw => {
      if (hostname.includes(kw)) { score += 15; flags.push(`Suspicious keyword in domain: ${kw}`); }
    });
    if (!url.startsWith('https')) { score += 20; flags.push('No HTTPS encryption'); }
    if (url.length > 100) { score += 10; flags.push('Unusually long URL'); }
  } catch {
    score += 50;
    flags.push('Invalid or malformed URL');
  }

  score = Math.min(score, 100);
  return {
    score,
    riskLevel: getRiskLevel(score),
    flags,
    verdict: score >= 70 ? 'Dangerous' : score >= 35 ? 'Suspicious' : 'Safe'
  };
};

/**
 * Analyze password strength
 */
const analyzePasswordStrength = (password) => {
  let score = 0;
  const suggestions = [];

  if (password.length >= 8) score += 20; else suggestions.push('Use at least 8 characters');
  if (password.length >= 12) score += 10; else suggestions.push('12+ characters is much stronger');
  if (password.length >= 16) score += 10;
  if (/[A-Z]/.test(password)) score += 15; else suggestions.push('Add uppercase letters');
  if (/[a-z]/.test(password)) score += 15; else suggestions.push('Add lowercase letters');
  if (/[0-9]/.test(password)) score += 15; else suggestions.push('Add numbers');
  if (/[^A-Za-z0-9]/.test(password)) score += 15; else suggestions.push('Add special characters (!@#$%)');

  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password1', '111111'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = Math.min(score, 10);
    suggestions.unshift('This is a very common password — change it immediately!');
  }

  const strength = score >= 80 ? 'Strong' : score >= 50 ? 'Moderate' : score >= 25 ? 'Weak' : 'Very Weak';
  const riskLevel = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';

  return { score, strength, suggestions, riskLevel };
};

/**
 * Analyze domain reputation
 */
const analyzeDomainReputation = (domain) => {
  let trustScore = 70;
  const flags = [];
  const suspicious = ['free', 'win', 'prize', 'click', 'earn', 'cheap', 'best'];
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.top', '.xyz'];

  const d = domain.toLowerCase();
  suspicious.forEach(kw => {
    if (d.includes(kw)) { trustScore -= 15; flags.push(`Suspicious keyword: ${kw}`); }
  });
  suspiciousTLDs.forEach(tld => {
    if (d.endsWith(tld)) { trustScore -= 25; flags.push(`Low-trust TLD: ${tld}`); }
  });
  if (d.split('.').length > 3) { trustScore -= 10; flags.push('Multiple subdomains'); }
  if (/\d{4,}/.test(d)) { trustScore -= 10; flags.push('Many consecutive digits'); }

  trustScore = Math.max(0, Math.min(100, trustScore));
  const riskLevel = trustScore < 40 ? 'high' : trustScore < 65 ? 'medium' : 'low';

  return { trustScore, riskLevel, flags, verdict: trustScore >= 65 ? 'Trustworthy' : trustScore >= 40 ? 'Questionable' : 'Risky' };
};

/**
 * Update user security score based on tool results
 */
const updateSecurityScore = async (userId, riskLevel, toolType) => {
  const user = await User.findById(userId);
  if (!user) return;

  let delta = 0;
  if (riskLevel === 'high') delta = -10;
  else if (riskLevel === 'medium') delta = -5;
  else delta = 2; // safe results slightly improve score

  user.securityScore = Math.max(0, Math.min(100, user.securityScore + delta));
  await user.save();
  return user.securityScore;
};

/**
 * Create alert from tool result
 */
const createAlertFromTool = async (userId, toolType, riskLevel, message) => {
  if (riskLevel === 'low') return; // Don't create alerts for low risk

  const titles = {
    phishing: 'Phishing URL Detected',
    password: 'Weak Password Found',
    breach: 'Data Breach Detected',
    domain: 'Suspicious Domain',
    port: 'Open Ports Detected',
    ip: 'Risky IP Address'
  };

  await Alert.create({
    userId,
    type: getAlertType(riskLevel),
    title: titles[toolType] || 'Security Alert',
    message,
    source: toolType
  });
};

module.exports = {
  getRiskLevel,
  analyzePhishingRisk,
  analyzePasswordStrength,
  analyzeDomainReputation,
  updateSecurityScore,
  createAlertFromTool
};
