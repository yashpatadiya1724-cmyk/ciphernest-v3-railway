import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)
export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!user) { if (socket) { socket.disconnect(); setSocket(null) } return }

    // In production (Railway), connect to same origin. In dev, connect to localhost:5000
    const socketUrl = import.meta.env.PROD
      ? window.location.origin
      : 'http://localhost:5000'

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    s.on('connect', () => console.log('🔌 Socket connected'))
    s.on('disconnect', () => console.log('🔌 Socket disconnected'))

    setSocket(s)
    return () => { s.disconnect() }
  }, [user])

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>
}
