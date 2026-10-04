import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * LiveDisasterTicker - Real-time NASA EONET & USGS Earthquakes marquee
 * Allows immediate loading of genuine real-world active disasters.
 * Supports:
 * - Direct mouse wheel horizontal scrolling
 * - Click-and-drag panning
 * - Left/Right chevron navigation buttons
 * - Sleek cyberpunk glowing scrollbar indicator
 */
export default function LiveDisasterTicker({ onSelectEvent }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)

  // Drag-to-scroll state
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasMovedRef = useRef(false)
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false)

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

  // Map vertical mouse wheel movement to horizontal scrolling
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 1.4
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [events.length])

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    isDraggingRef.current = true
    hasMovedRef.current = false
    setIsCursorGrabbing(true)
    startXRef.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk
  }

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false
    setIsCursorGrabbing(false)
  }

  // Chevron arrow navigation
  const scrollByAmount = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  if (loading && events.length === 0) {
    return (
      <div style={{
        background: 'rgba(5, 12, 24, 0.95)',
        borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
        padding: '8px 16px',
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
      padding: '6px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 100,
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Fixed Header Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: '800',
        letterSpacing: '0.06em',
        color: '#ff2a55',
        flex: '0 0 auto',
        textTransform: 'uppercase',
        paddingRight: '8px',
        borderRight: '1px solid rgba(255, 255, 255, 0.15)',
        userSelect: 'none',
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
        <span>REAL-TIME GLOBAL HAZARDS:</span>
        <span style={{
          background: 'rgba(239, 68, 68, 0.25)',
          color: '#fca5a5',
          fontSize: '9px',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
        }}>
          {events.length} ACTIVE
        </span>
      </div>

      {/* Left Scroll Chevron */}
      <button
        type="button"
        onClick={() => scrollByAmount(-350)}
        style={{
          flex: '0 0 auto',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          color: '#00f0ff',
          cursor: 'pointer',
          fontSize: '11px',
          transition: 'all 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00f0ff'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.35)'}
        title="Scroll Left (or use mouse wheel / drag)"
      >
        ◀
      </button>

      {/* Horizontal Scrollable Track */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="hazard-ticker-scroll"
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          flex: '1 1 auto',
          minWidth: 0,
          padding: '4px 2px',
          cursor: isCursorGrabbing ? 'grabbing' : 'grab',
          scrollBehavior: 'smooth',
          userSelect: 'none',
        }}
      >
        {events.map((ev, i) => (
          <motion.div
            key={ev.id || i}
            whileHover={{ scale: 1.03, borderColor: '#00f0ff' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (hasMovedRef.current) return
              onSelectEvent(ev)
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flex: '0 0 auto',
              transition: 'border-color 0.2s, background 0.2s',
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
            <span style={{ fontSize: '10px', color: '#00f0ff', opacity: 0.85, fontWeight: '700' }}>
              ⚡ ACTIVATE
            </span>
          </motion.div>
        ))}
      </div>

      {/* Right Scroll Chevron */}
      <button
        type="button"
        onClick={() => scrollByAmount(350)}
        style={{
          flex: '0 0 auto',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          color: '#00f0ff',
          cursor: 'pointer',
          fontSize: '11px',
          transition: 'all 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00f0ff'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.35)'}
        title="Scroll Right (or use mouse wheel / drag)"
      >
        ▶
      </button>
    </div>
  )
}
