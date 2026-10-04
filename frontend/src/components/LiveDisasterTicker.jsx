import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Radio, Activity, Flame, Wind, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * LiveDisasterTicker - Real-time NASA EONET & USGS Earthquakes marquee
 * Professional UI/UX Pro Max implementation:
 * - Lucide SVG vector icons (no emojis)
 * - Mouse wheel horizontal panning
 * - Click-and-drag smooth panning
 * - Compact 20px circular chevron controls
 * - Fira Code telemetry labels
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
        background: 'rgba(6, 9, 19, 0.95)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        padding: '7px 16px',
        fontSize: '11px',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-mono)',
      }}>
        <span className="spinner" style={{ width: '12px', height: '12px' }} />
        <span>SYNCING REAL-TIME GLOBAL INCIDENT FEEDS (NASA EONET & USGS)...</span>
      </div>
    )
  }

  if (events.length === 0) return null

  return (
    <div style={{
      background: 'rgba(6, 9, 19, 0.98)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
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
        gap: '8px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.06em',
        color: '#f8fafc',
        flex: '0 0 auto',
        textTransform: 'uppercase',
        paddingRight: '10px',
        borderRight: '1px solid rgba(148, 163, 184, 0.15)',
        userSelect: 'none',
      }}>
        <Radio size={13} color="#ef4444" className="live-indicator" style={{ animation: 'pulse-red 1.5s infinite' }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: '700' }}>
          LIVE GLOBAL DISASTER FEED:
        </span>
        <span style={{
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#fca5a5',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          fontWeight: '600',
        }}>
          {events.length} ACTIVE
        </span>
      </div>

      {/* Left Scroll Chevron */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.15, backgroundColor: 'rgba(6, 182, 212, 0.2)', borderColor: '#06b6d4' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => scrollByAmount(-320)}
        style={{
          flex: '0 0 auto',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          color: '#06b6d4',
          cursor: 'pointer',
          padding: 0,
          boxShadow: '0 0 6px rgba(6, 182, 212, 0.15)',
          transition: 'all 0.2s',
        }}
        title="Scroll Left"
      >
        <ChevronLeft size={12} strokeWidth={2.5} />
      </motion.button>

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
          gap: '8px',
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
            whileHover={{ scale: 1.02, borderColor: '#06b6d4' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (hasMovedRef.current) return
              onSelectEvent(ev)
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              flex: '0 0 auto',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {ev.category === 'Earthquake' ? (
                <Activity size={13} color="#f59e0b" />
              ) : ev.category === 'Wildfires' ? (
                <Flame size={13} color="#ef4444" />
              ) : (
                <Wind size={13} color="#06b6d4" />
              )}
            </span>
            <span style={{ color: '#f8fafc', fontWeight: '600' }}>{ev.title}</span>
            <span style={{
              background: ev.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: ev.severity === 'CRITICAL' ? '#fca5a5' : '#fcd34d',
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
            }}>
              {ev.source.split(' ')[0]}
            </span>
            <span style={{ fontSize: '10px', color: '#06b6d4', opacity: 0.9, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Zap size={10} /> LOAD INCIDENT
            </span>
          </motion.div>
        ))}
      </div>

      {/* Right Scroll Chevron */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.15, backgroundColor: 'rgba(6, 182, 212, 0.2)', borderColor: '#06b6d4' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => scrollByAmount(320)}
        style={{
          flex: '0 0 auto',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          color: '#06b6d4',
          cursor: 'pointer',
          padding: 0,
          boxShadow: '0 0 6px rgba(6, 182, 212, 0.15)',
          transition: 'all 0.2s',
        }}
        title="Scroll Right"
      >
        <ChevronRight size={12} strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}
