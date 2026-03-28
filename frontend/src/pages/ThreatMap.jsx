import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionHeader, AIExplanationBox } from '../components/common/index'
import { useSocket } from '../context/SocketContext'

const CAPITALS = [
  { name: 'Washington D.C.', x: 220, y: 140 },
  { name: 'London', x: 470, y: 95 },
  { name: 'Frankfurt', x: 495, y: 95 },
  { name: 'Moscow', x: 570, y: 85 },
  { name: 'Beijing', x: 780, y: 130 },
  { name: 'Tokyo', x: 850, y: 135 },
  { name: 'Sydney', x: 860, y: 310 },
  { name: 'Sao Paulo', x: 310, y: 280 },
  { name: 'New Delhi', x: 690, y: 170 },
  { name: 'Singapore', x: 780, y: 240 },
  { name: 'Dubai', x: 600, y: 175 },
  { name: 'Cape Town', x: 510, y: 320 }
];

export default function ThreatMap() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const { socket } = useSocket()
  const [threats, setThreats] = useState([])
  const [activeArcs, setActiveArcs] = useState([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw simplified world map background
      ctx.fillStyle = '#1A2744'
      ctx.globalAlpha = 0.3
      // Static dots for landmass (simplified)
      for (let i = 0; i < canvas.width; i+=15) {
        for (let j = 0; j < canvas.height; j+=15) {
          if (Math.random() > 0.7) ctx.fillRect(i, j, 2, 2)
        }
      }
      ctx.globalAlpha = 1.0

      // Draw Arcs
      setActiveArcs(prev => {
        const next = prev.map(arc => ({ ...arc, progress: arc.progress + 0.01 }))
          .filter(arc => arc.progress <= 1)
        
        next.forEach(arc => {
          const x = arc.start.x + (arc.end.x - arc.start.x) * arc.progress
          const y = arc.start.y + (arc.end.y - arc.start.y) * arc.progress - Math.sin(Math.PI * arc.progress) * 50
          
          ctx.beginPath()
          ctx.strokeStyle = arc.color
          ctx.lineWidth = 2
          ctx.shadowBlur = 10
          ctx.shadowColor = arc.color
          ctx.moveTo(arc.start.x, arc.start.y)
          ctx.quadraticCurveTo(
            (arc.start.x + arc.end.x) / 2, 
            (arc.start.y + arc.end.y) / 2 - 100, 
            x, y
          )
          ctx.stroke()
          
          // Draw impact dot
          ctx.beginPath()
          ctx.fillStyle = arc.color
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        })
        return next
      })

      // Draw Capitals
      CAPITALS.forEach(cap => {
        ctx.beginPath()
        ctx.fillStyle = '#64748B'
        ctx.arc(cap.x, cap.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  useEffect(() => {
    // Generate simulated threats periodically
    const interval = setInterval(() => {
      const from = CAPITALS[Math.floor(Math.random() * CAPITALS.length)]
      const to = CAPITALS[Math.floor(Math.random() * CAPITALS.length)]
      if (from === to) return

      const type = Math.random() > 0.7 ? 'CRITICAL' : 'WARNING'
      const color = type === 'CRITICAL' ? '#FF3366' : '#FFD700'
      const newThreat = { 
        id: Date.now(), 
        from: from.name, 
        to: to.name, 
        type, 
        time: new Date().toLocaleTimeString() 
      }
      
      setThreats(prev => [newThreat, ...prev].slice(0, 10))
      setActiveArcs(prev => [...prev, { start: from, end: to, progress: 0, color }])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/tools')}
          className="text-cyber-muted hover:text-cyber-accent transition-colors text-sm">← Back to Tools</button>
      </div>
      
      <SectionHeader 
        title="Live Global Threat Map" 
        subtitle="Real-time visualization of simulated external security events"
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF3366]" />
              <span className="text-[10px] text-cyber-muted font-mono uppercase">Infiltrate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              <span className="text-[10px] text-cyber-muted font-mono uppercase">Probe</span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-card bg-[#070B14] overflow-hidden relative" style={{ height: '500px' }}>
          <canvas 
            ref={canvasRef} 
            width={1000} 
            height={500} 
            className="w-full h-full cursor-crosshair"
          />
          <div className="absolute top-4 right-4 bg-cyber-bg/80 p-3 rounded-lg border border-cyber-border/40 backdrop-blur-md">
            <p className="text-[10px] text-cyber-muted font-mono uppercase mb-2">Active Sessions</p>
            <p className="text-xl font-bold text-cyber-text">{activeArcs.length + 124}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4 h-full flex flex-col">
            <h3 className="text-xs font-bold text-cyber-muted uppercase tracking-widest mb-4">Live Threat Feed</h3>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {threats.map(threat => (
                <div key={threat.id} className="text-[10px] p-2 rounded bg-cyber-bg border-l-2 border-cyber-border/30 hover:bg-white/5 transition-colors"
                  style={{ borderLeftColor: threat.type === 'CRITICAL' ? '#FF3366' : '#FFD700' }}>
                  <div className="flex justify-between mb-1">
                    <span className={threat.type === 'CRITICAL' ? 'text-cyber-red' : 'text-cyber-yellow'}>{threat.type}</span>
                    <span className="text-cyber-muted">{threat.time}</span>
                  </div>
                  <p className="text-cyber-text truncate">
                    <span className="text-cyber-accent">{threat.from}</span> → {threat.to}
                  </p>
                </div>
              ))}
              {threats.length === 0 && <p className="text-center py-12 text-cyber-muted italic text-[10px]">Awaiting telemetry...</p>}
            </div>
          </div>
        </div>
      </div>

      <AIExplanationBox text="Cipher Analysis: This map reflects global telemetry data. While many of these are automated bots probing common services, the concentration of events in core data centers often precedes larger coordinated campaigns." />
    </div>
  )
}
