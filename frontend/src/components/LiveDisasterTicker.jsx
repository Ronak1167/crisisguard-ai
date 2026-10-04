import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * LiveDisasterTicker - Real-time NASA EONET & USGS Earthquakes marquee
 * Allows immediate loading of genuine real-world active disasters
 */
export default function LiveDisasterTicker({ onSelectEvent }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/api/live-disasters')
      .then((res) => res.json())
      .then((data) => {
        if (data.events && data.events.length > 0) {
          setEvents(data.events)
        }
      })
      .catch((err) => console.log('Live ticker fetch notice:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading && events.length === 0) {
    return (
      <div style={{
        background: 'rgba(5, 12, 24, 0.85)',
        borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
        padding: '6px 16px',
        fontSize: '11px',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span className="spinner" style={{ width: '12px', height: '12px' }} />
        <span>Syncing live global satellite telemetry from NASA EONET & USGS...</span>
      </div>
    )
  }

  if (events.length === 0) return null

  return (
    <div style={{
      background: 'rgba(4, 9, 20, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
      padding: '7px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      zIndex: 100,
      scrollbarWidth: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        color: '#ff2a55',
        flexShrink: 0,
        textTransform: 'uppercase',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ff2a55',
          boxShadow: '0 0 8px #ff2a55',
          display: 'inline-block',
          animation: 'pulse 1.2s infinite'
        }} />
        REAL-TIME GLOBAL HAZARDS (NASA & USGS):
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {events.map((ev, i) => (
          <motion.div
            key={ev.id || i}
            whileHover={{ scale: 1.03, borderColor: '#00f0ff' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectEvent(ev)}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '13px' }}>
              {ev.category === 'Earthquake' ? '🏚️' : ev.category === 'Wildfires' ? '🔥' : '🌀'}
            </span>
            <span style={{ color: '#f1f5f9', fontWeight: '600' }}>{ev.title}</span>
            <span style={{
              background: ev.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              color: ev.severity === 'CRITICAL' ? '#fca5a5' : '#fcd34d',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: '700',
            }}>
              {ev.source.split(' ')[0]}
            </span>
            <span style={{ fontSize: '10px', color: '#00f0ff', opacity: 0.8 }}>⚡ ACTIVATE</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
