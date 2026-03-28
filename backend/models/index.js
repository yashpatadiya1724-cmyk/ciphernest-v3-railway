const mongoose = require('mongoose');

// ToolResult model
const toolResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toolType: { type: String, required: true }, // phishing, password, breach, domain, port, ip
  input: { type: String },
  result: { type: mongoose.Schema.Types.Mixed },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  riskScore: { type: Number, default: 0 },
  summary: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Alert model
const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  source: { type: String }, // which tool triggered it
  dismissed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// ChatHistory model
const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  context: { type: mongoose.Schema.Types.Mixed }, // tool result context if any
  timestamp: { type: Date, default: Date.now }
});

// ThreatLog model
const threatLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  description: { type: String },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
  resolved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// ActivityLog model
const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String },
  icon: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const ToolResult = mongoose.model('ToolResult', toolResultSchema);
const Alert = mongoose.model('Alert', alertSchema);
const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
const ThreatLog = mongoose.model('ThreatLog', threatLogSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = { ToolResult, Alert, ChatHistory, ThreatLog, ActivityLog };
