import React, { useState, useEffect, useRef } from 'react'
import { chatAPI } from '../services/api'
import { Spinner } from '../components/common/index'

const SUGGESTIONS = [
  'What is phishing and how do I avoid it?',
  'How do I create a strong password?',
  'What does "data breach" mean?',
  'How can I stay safe on public WiFi?',
  'What is two-factor authentication?',
  'How do I know if my device is hacked?',
]

export default function AskCipher() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiOnline, setAiOnline] = useState(null)
  const [aiProvider, setAiProvider] = useState('')
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    checkStatus()
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkStatus = async () => {
    try {
      const { data } = await chatAPI.status()
      setAiOnline(data.online)
      setAiProvider(data.provider || '')
    } catch { setAiOnline(false) }
  }

  const loadHistory = async () => {
    try {
      const { data } = await chatAPI.history()
      setMessages(data)
    } catch {}
    setHistoryLoaded(true)
  }

  const send = async (msg) => {
    const text = (msg || input).trim()
    if (!text || loading) return
    
    setInput('')
    const userMsg = { role: 'user', content: text, _id: `u_${Date.now()}` }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Create a placeholder for the assistant message
    const assistantId = `ai_${Date.now()}`
    const assistantMsg = { role: 'assistant', content: '', _id: assistantId }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cn_token')}`
        },
        body: JSON.stringify({ message: text })
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              if (data.content) {
                accumulatedContent += data.content
                setMessages(prev => prev.map(m => 
                  m._id === assistantId ? { ...m, content: accumulatedContent } : m
                ))
              }
              if (data.done && data.id) {
                // Update with final ID from DB
                setMessages(prev => prev.map(m => 
                  m._id === assistantId ? { ...m, _id: data.id } : m
                ))
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e)
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err)
      setMessages(prev => prev.map(m => 
        m._id === assistantId 
          ? { ...m, content: 'Connection error. Please check if the backend is running.' } 
          : m
      ))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = async () => {
    if (!confirm('Clear all chat history?')) return
    await chatAPI.clear()
    setMessages([])
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #00D4FF22, #8B5CF622)', border: '1px solid #00D4FF33' }}>
            🤖
          </div>
          <div>
            <h1 className="text-xl font-bold text-cyber-text">Ask Cipher</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full"
                style={{ background: aiOnline ? '#00FF88' : aiOnline === false ? '#FF3366' : '#FFD700', boxShadow: `0 0 6px ${aiOnline ? '#00FF88' : '#FF3366'}` }} />
              <span className="text-xs text-cyber-muted">
                {aiOnline === null ? 'Checking AI status...' : aiOnline ? `${aiProvider} Connected` : 'AI Offline — set API key in .env'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!aiOnline && aiOnline !== null && (
            <span className="text-xs px-2 py-1 rounded border border-cyber-yellow/40 text-cyber-yellow">
              ⚡ Fallback mode
            </span>
          )}
          {messages.length > 0 && (
            <button onClick={clearChat} className="text-xs text-cyber-muted hover:text-cyber-red transition-colors border border-cyber px-3 py-1.5 rounded-lg hover:border-cyber-red/40">
              🗑 Clear
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && historyLoaded && (
            <div className="text-center py-8 animate-fadeIn">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-4"
                style={{ background: 'linear-gradient(135deg, #00D4FF11, #8B5CF611)', border: '1px solid rgba(0,212,255,0.15)' }}>
                🛡️
              </div>
              <h2 className="text-lg font-semibold text-cyber-text mb-2">Hello! I'm Cipher</h2>
              <p className="text-cyber-muted text-sm max-w-sm mx-auto leading-relaxed">
                Your personal cybersecurity assistant. I can explain threats in plain English, help you understand scan results, and guide you through security best practices.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-left px-3 py-2.5 rounded-lg text-xs text-cyber-muted hover:text-cyber-accent border border-cyber hover:border-cyber-accent/40 transition-all bg-cyber-bg/50">
                    💬 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg._id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)' }}>🤖</div>
              )}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm text-cyber-bg'
                    : 'rounded-bl-sm text-cyber-text border border-cyber-border/50'
                }`}
                  style={msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)' }
                    : { background: 'rgba(255,255,255,0.03)' }}>
                  {msg.role === 'assistant' && (
                    <span className="text-xs text-cyber-accent font-mono block mb-1.5">Cipher</span>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.timestamp && (
                  <span className="text-xs text-cyber-muted px-1">{formatTime(msg.timestamp)}</span>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #1A2744, #2A3F70)', border: '1px solid #2A3F70' }}>
                  U
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 justify-start animate-slideUp">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)' }}>🤖</div>
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 border border-cyber-border/50 flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xs text-cyber-accent font-mono">Cipher is thinking</span>
                <span className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-4 border-t border-cyber-border/50">
          {/* Quick prompts when no messages */}
          {messages.length > 0 && messages.length < 4 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {SUGGESTIONS.slice(0, 3).map(s => (
                <button key={s} onClick={() => send(s)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-cyber text-cyber-muted hover:text-cyber-accent hover:border-cyber-accent/40 transition-all whitespace-nowrap">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask Cipher about security..."
              rows={1}
              className="cyber-input flex-1 resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="px-4 py-2 rounded-lg transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)', color: '#070B14', minWidth: '48px' }}>
              {loading ? <Spinner size="sm" /> : <span className="text-sm font-bold">▶</span>}
            </button>
          </div>
          <p className="text-xs text-cyber-muted mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
            {!aiOnline && aiOnline !== null && ' · Set GEMINI_API_KEY or GROQ_API_KEY in .env'}
          </p>
        </div>
      </div>
    </div>
  )
}
