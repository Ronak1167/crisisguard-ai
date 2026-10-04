import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * 3D Tilt Card with dynamic holographic cursor reflection & perspective depth
 * Conforms to OpenMotion Standard
 */
export default function TiltCard({ children, className = '', style = {}, severity = 'normal' }) {
  const cardRef = useRef(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glowPos, setGlowPos] = useState({ x: -100, y: -100, opacity: 0 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Max tilt 8 degrees
    const rX = -((y - centerY) / centerY) * 7
    const rY = ((x - centerX) / centerX) * 7

    setRotateX(rX)
    setRotateY(rY)
    setGlowPos({ x, y, opacity: 0.18 })
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setGlowPos((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <motion.div
      ref={cardRef}
      className={`tilt-card-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      style={{
        transformStyle: 'preserve-3d',
        position: 'relative',
        ...style,
      }}
    >
      {/* Holographic light reflection following mouse cursor */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 'inherit',
          background: `radial-gradient(circle 220px at ${glowPos.x}px ${glowPos.y}px, rgba(0, 240, 255, ${glowPos.opacity}), transparent)`,
          pointerEvents: 'none',
          transition: 'background 0.1s ease',
          zIndex: 10,
        }}
      />
      {children}
    </motion.div>
  )
}
