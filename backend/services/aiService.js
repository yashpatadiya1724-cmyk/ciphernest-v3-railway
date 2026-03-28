/**
 * Unified AI Service — CipherNest v2
 * Supports: Google Gemini (FREE) & Groq (FREE)
 * Auto-fallback between providers
 */

const https = require('https');
const { Transform, Readable } = require('stream');

const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// ─── System Prompt ────────────────────────────────────────
const SYSTEM_PROMPT = `You are Cipher, a friendly cybersecurity AI assistant for CipherNest.
Your job is to explain security threats in simple, non-technical language and provide clear actionable guidance.
Keep responses concise (2-4 paragraphs max). Use everyday analogies. Be encouraging, not alarming.
Never use excessive technical jargon. Format responses for readability.`;

// ─── Build Messages ───────────────────────────────────────
const buildMessages = ({ userMessage, toolResult, riskLevel, context, history = [] }) => {
  let systemContent = SYSTEM_PROMPT;

  if (toolResult) {
    systemContent += `\n\nTool Result Context:
- Tool used: ${context?.toolType || 'security scan'}
- Risk Level: ${riskLevel || 'unknown'}
- Result summary: ${context?.summary || JSON.stringify(toolResult)}

Based on this risk level:
${riskLevel === 'high' ? '- Give step-by-step guidance on immediate actions to take' : ''}
${riskLevel === 'medium' ? '- Ask if user wants help resolving this, then guide them' : ''}
${riskLevel === 'low' ? '- Briefly acknowledge the result and offer a quick tip' : ''}`;
  }

  const messages = [{ role: 'system', content: systemContent }];
  history.slice(-6).forEach(msg => {
    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
  });
  messages.push({ role: 'user', content: userMessage });
  return messages;
};

// ─── Fallback Responses ───────────────────────────────────
const getFallback = (riskLevel) => {
  const fallbacks = {
    high: '⚠️ High Risk Detected! I\'m temporarily offline, but this requires immediate attention. Please: 1) Do not interact with the flagged resource, 2) Change related passwords, 3) Enable two-factor authentication.',
    medium: '⚡ Moderate risk found. I\'m temporarily offline, but review this result carefully and take precautionary measures.',
    low: '✅ Low risk detected. Everything looks relatively safe. No urgent action required.',
    default: '🤖 I\'m having trouble connecting to my AI service right now. Please check your API keys in the .env file and try again.\n\nSetup options:\n1. **Gemini (Free)**: Get key at https://aistudio.google.com/app/apikey\n2. **Groq (Free)**: Get key at https://console.groq.com/keys'
  };
  return fallbacks[riskLevel] || fallbacks.default;
};

// ═══════════════════════════════════════════════════════════
// GOOGLE GEMINI PROVIDER
// ═══════════════════════════════════════════════════════════

const geminiRequest = (messages, stream = false) => {
  return new Promise((resolve, reject) => {
    // Convert OpenAI-style messages to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const endpoint = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    const body = JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:${endpoint}&key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (stream) {
        resolve(res);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || 'Gemini API error'));
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) {
          reject(new Error('Failed to parse Gemini response: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Gemini request timed out')); });
    req.write(body);
    req.end();
  });
};

/** Convert Gemini SSE stream to Ollama-like JSON line format */
const convertGeminiStreamToOllamaFormat = (geminiStream) => {
  let buffer = '';
  const transformer = new Transform({
    transform(chunk, _enc, callback) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === '[DONE]') {
          this.push(JSON.stringify({ response: '', done: true }) + '\n');
          continue;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const done = parsed.candidates?.[0]?.finishReason === 'STOP';
          if (content) {
            this.push(JSON.stringify({ response: content, done: false }) + '\n');
          }
          if (done) {
            this.push(JSON.stringify({ response: '', done: true }) + '\n');
          }
        } catch (_) { /* skip malformed lines */ }
      }
      callback();
    },
    flush(callback) {
      if (buffer.trim()) {
        this.push(JSON.stringify({ response: '', done: true }) + '\n');
      }
      callback();
    }
  });

  geminiStream.pipe(transformer);
  return transformer;
};

// ═══════════════════════════════════════════════════════════
// GROQ PROVIDER
// ═══════════════════════════════════════════════════════════

const groqRequest = (payload, stream = false) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (stream) {
        resolve(res);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || 'Groq API error'));
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse Groq response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Groq request timed out')); });
    req.write(body);
    req.end();
  });
};

/** Convert Groq SSE stream to Ollama-like JSON line format */
const convertGroqStreamToOllamaFormat = (groqStream) => {
  let buffer = '';
  const transformer = new Transform({
    transform(chunk, _enc, callback) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === '[DONE]') {
          this.push(JSON.stringify({ response: '', done: true }) + '\n');
          continue;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content || '';
          const done = parsed.choices?.[0]?.finish_reason === 'stop';
          this.push(JSON.stringify({ response: content, done }) + '\n');
        } catch (_) { /* skip malformed lines */ }
      }
      callback();
    },
    flush(callback) {
      if (buffer.trim()) {
        this.push(JSON.stringify({ response: '', done: true }) + '\n');
      }
      callback();
    }
  });

  groqStream.pipe(transformer);
  return transformer;
};

// ═══════════════════════════════════════════════════════════
// MAIN: Generate Cipher Response (unified interface)
// ═══════════════════════════════════════════════════════════

const generateCipherResponse = async ({ userMessage, toolResult, riskLevel, context, history = [], stream = false }) => {
  const messages = buildMessages({ userMessage, toolResult, riskLevel, context, history });

  // Determine which provider to try
  const providers = [];
  if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    providers.push('gemini');
  }
  if (GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')) {
    providers.push('groq');
  }
  // Add the other as fallback
  if (AI_PROVIDER === 'groq' && GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    providers.push('gemini');
  }
  if (AI_PROVIDER === 'gemini' && GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')) {
    if (!providers.includes('groq')) providers.push('groq');
  }

  if (providers.length === 0) {
    const fallbackText = getFallback(riskLevel);
    if (stream) {
      const s = new Readable({ read() {} });
      setTimeout(() => {
        s.push(JSON.stringify({ response: fallbackText, done: true }) + '\n');
        s.push(null);
      }, 100);
      return { data: s };
    }
    return { success: false, response: fallbackText, error: 'No AI API key configured' };
  }

  for (const provider of providers) {
    try {
      if (provider === 'gemini') {
        if (stream) {
          const rawStream = await geminiRequest(messages, true);
          return { data: convertGeminiStreamToOllamaFormat(rawStream) };
        }
        const content = await geminiRequest(messages, false);
        return { success: true, response: content.trim() || 'I could not generate a response. Please try again.' };
      }

      if (provider === 'groq') {
        const payload = {
          model: GROQ_MODEL,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_tokens: 1024,
          stream
        };

        if (stream) {
          const rawStream = await groqRequest(payload, true);
          return { data: convertGroqStreamToOllamaFormat(rawStream) };
        }

        const result = await groqRequest(payload, false);
        const content = result.choices?.[0]?.message?.content?.trim() || 'I could not generate a response.';
        return { success: true, response: content };
      }
    } catch (error) {
      console.error(`[AI] ${provider} failed:`, error.message);
      continue; // Try next provider
    }
  }

  // All providers failed
  const fallbackText = getFallback(riskLevel);
  if (stream) {
    const s = new Readable({ read() {} });
    setTimeout(() => {
      s.push(JSON.stringify({ response: fallbackText, done: true }) + '\n');
      s.push(null);
    }, 100);
    return { data: s };
  }
  return { success: false, response: fallbackText, error: 'All AI providers failed' };
};

// ─── Health Check ─────────────────────────────────────────
const checkAIHealth = async () => {
  const result = { online: false, provider: 'none', model: 'none' };

  if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    result.online = true;
    result.provider = 'Google Gemini';
    result.model = 'gemini-2.0-flash';
    return result;
  }

  if (GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_') && GROQ_API_KEY.length > 20) {
    result.online = true;
    result.provider = 'Groq';
    result.model = GROQ_MODEL;
    return result;
  }

  return result;
};

module.exports = { generateCipherResponse, checkAIHealth };
