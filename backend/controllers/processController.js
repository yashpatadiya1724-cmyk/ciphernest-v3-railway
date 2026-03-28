let si;
try { si = require('systeminformation'); } catch(e) { si = null; }
const { generateCipherResponse } = require('../services/aiService');

const analyzeProcesses = async (req, res) => {
  try {
    if (!si) {
      // Cloud environment — return informative message
      return res.json({
        cloudMode: true,
        message: 'Process Watcher requires local installation. When running CipherNest locally, this tool monitors all running system processes.',
        processes: [],
        suspiciousCount: 0,
        aiAnalysis: 'Process monitoring is only available when CipherNest runs locally on your machine. Deploy locally to use this feature.',
        totalProcesses: 0
      });
    }

    const procs = await si.processes();
    const top20 = procs.list
      .filter(p => p.pid > 0)
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 20)
      .map(p => ({
        pid: p.pid, name: p.name, cpu: Math.round(p.cpu * 10) / 10,
        mem: Math.round(p.mem * 10) / 10, user: p.user,
        command: p.command?.slice(0, 80) || ''
      }));

    const suspicious = top20.filter(p =>
      p.cpu > 80 || p.mem > 50 ||
      /cryptominer|miner|xmrig|coinminer/i.test(p.name)
    );

    const aiResponse = await generateCipherResponse({
      userMessage: `Analyze these top processes for security threats: ${JSON.stringify(top20.slice(0, 5))}`,
      context: { toolType: 'processes' }
    }).catch(() => ({ response: `Analyzed ${top20.length} processes. ${suspicious.length} flagged as suspicious.` }));

    res.json({
      processes: top20,
      suspiciousCount: suspicious.length,
      suspicious,
      aiAnalysis: aiResponse.response,
      totalProcesses: procs.all
    });
  } catch (error) {
    res.status(500).json({ message: 'Process analysis failed', error: error.message });
  }
};

module.exports = { analyzeProcesses };
