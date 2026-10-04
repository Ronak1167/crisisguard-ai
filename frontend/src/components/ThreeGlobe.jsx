import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * ThreeGlobe - Cinematic Movie-Style 3D Earth Command System
 * - Real photorealistic Earth satellite texture + night lights + rotating cloud layers.
 * - Hollywood movie-style camera swooping:
 *   - Auto-rotates & zooms in (close-up recon) when an incident is detected.
 *   - Smoothly zooms out to tactical overview when multiple facilities (hospitals, shelters) are detected.
 *   - Animated 3D targeting reticles & laser triage arcs.
 *   - Interactive drag-to-rotate & clickable facility pins.
 */
export default function ThreeGlobe({ centerCoords, liveEvents = [], detectedFacilities = null }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const globeGroupRef = useRef(null)
  const cloudsRef = useRef(null)
  const arcsGroupRef = useRef(null)
  const markersGroupRef = useRef(null)

  // Target coordinates
  const targetLat = centerCoords?.lat ?? 20.2724
  const targetLng = centerCoords?.lng ?? 85.8338

  // Facilities
  const hospitals = detectedFacilities?.hospitals || []
  const shelters = detectedFacilities?.shelters || []
  const hasMultipleLocations = hospitals.length > 0 || shelters.length > 0

  // Camera animation state
  const cameraTargetZ = useRef(240)
  const cameraCurrentZ = useRef(240)
  const globeTargetRotY = useRef(0)
  const globeTargetRotX = useRef(0)
  const isAutoTouring = useRef(false)
  const [hudStatus, setHudStatus] = useState('ACQUIRING ORBITAL TELEMETRY...')
  const [isCinematicTour, setIsCinematicTour] = useState(false)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 450
    const height = container.clientHeight || 360

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 240)
    cameraRef.current = camera

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 3. Globe Parent Group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)
    globeGroupRef.current = globeGroup

    const RADIUS = 75

    // Texture Loader
    const textureLoader = new THREE.TextureLoader()

    // 4. Real Photorealistic Earth Sphere with Satellite Map & Night Lights
    const earthDayTex = textureLoader.load('/earth_atmos_2048.jpg')
    const earthLightsTex = textureLoader.load('/earth_lights_2048.png')

    const earthGeo = new THREE.SphereGeometry(RADIUS, 64, 64)
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthDayTex,
      emissiveMap: earthLightsTex,
      emissive: new THREE.Color(0x223344),
      emissiveIntensity: 0.8,
      roughness: 0.6,
      metalness: 0.1,
    })
    const earthSphere = new THREE.Mesh(earthGeo, earthMat)
    globeGroup.add(earthSphere)

    // 5. Cloud Layer Sphere
    const cloudTex = textureLoader.load('/earth_clouds_1024.png')
    const cloudGeo = new THREE.SphereGeometry(RADIUS + 1.2, 48, 48)
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    })
    const cloudSphere = new THREE.Mesh(cloudGeo, cloudMat)
    globeGroup.add(cloudSphere)
    cloudsRef.current = cloudSphere

    // 6. Glowing Blue Atmospheric Halo
    const haloGeo = new THREE.SphereGeometry(RADIUS + 7.5, 32, 32)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00b4d8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    globeGroup.add(halo)

    // 7. Tactical Coordinate Grid Rings
    const gridGeo = new THREE.SphereGeometry(RADIUS + 0.3, 30, 30)
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const gridMesh = new THREE.Mesh(gridGeo, gridMat)
    globeGroup.add(gridMesh)

    // 8. Dynamic Markers & Arcs Group
    const markersGroup = new THREE.Group()
    globeGroup.add(markersGroup)
    markersGroupRef.current = markersGroup

    const arcsGroup = new THREE.Group()
    globeGroup.add(arcsGroup)
    arcsGroupRef.current = arcsGroup

    // 9. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8)
    sunLight.position.set(200, 100, 150)
    scene.add(sunLight)

    const blueRimLight = new THREE.DirectionalLight(0x00f0ff, 1.4)
    blueRimLight.position.set(-200, -80, -100)
    scene.add(blueRimLight)

    // Helper: Lat/Lng to 3D Cartesian coordinates
    function latLngToVec3(lat, lng, radius) {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      )
    }

    // Helper: 3D quadratic bezier curve arc between two lat/lng points
    function create3DArc(startVec, endVec, color = 0x00f0ff) {
      const mid = startVec.clone().lerp(endVec, 0.5)
      const dist = startVec.distanceTo(endVec)
      mid.normalize().multiplyScalar(RADIUS + Math.max(12, dist * 0.45))

      const curve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec)
      const points = curve.getPoints(36)
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points)
      const arcMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        linewidth: 2,
      })
      return new THREE.Line(arcGeo, arcMat)
    }

    // 10. Populate Primary Epicenter Pin & Shockwaves
    const epicenterVec = latLngToVec3(targetLat, targetLng, RADIUS)

    // Red Epicenter Pin
    const pinGeo = new THREE.CylinderGeometry(0.4, 2.2, 18, 16)
    pinGeo.rotateX(Math.PI / 2)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xff1744 })
    const pin = new THREE.Mesh(pinGeo, pinMat)
    pin.position.copy(epicenterVec)
    pin.lookAt(new THREE.Vector3(0, 0, 0))
    pin.position.add(epicenterVec.clone().normalize().multiplyScalar(9))
    markersGroup.add(pin)

    // Epicenter Pulsing Beacon Core
    const beaconGeo = new THREE.SphereGeometry(3.6, 16, 16)
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 })
    const beacon = new THREE.Mesh(beaconGeo, beaconMat)
    beacon.position.copy(pin.position)
    markersGroup.add(beacon)

    // Shockwave Rings
    const rings = []
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.RingGeometry(2 + r * 3, 3 + r * 3, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3b5c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75 - r * 0.2,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(epicenterVec.clone().multiplyScalar(1.02))
      ring.lookAt(new THREE.Vector3(0, 0, 0))
      markersGroup.add(ring)
      rings.push(ring)
    }

    // 11. Add Verified Hospitals & Shelters with Arcs (if detected)
    hospitals.forEach((h) => {
      if (h.lat && h.lng) {
        const hVec = latLngToVec3(h.lat, h.lng, RADIUS + 1.5)
        const hDot = new THREE.Mesh(
          new THREE.SphereGeometry(1.8, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x10b981 })
        )
        hDot.position.copy(hVec)
        markersGroup.add(hDot)

        // Laser triage arc from epicenter to hospital
        const arc = create3DArc(epicenterVec, hVec, 0x10b981)
        arcsGroup.add(arc)
      }
    })

    shelters.forEach((s) => {
      if (s.lat && s.lng) {
        const sVec = latLngToVec3(s.lat, s.lng, RADIUS + 1.5)
        const sDot = new THREE.Mesh(
          new THREE.SphereGeometry(1.6, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
        )
        sDot.position.copy(sVec)
        markersGroup.add(sDot)

        // Arc to shelter
        const arc = create3DArc(epicenterVec, sVec, 0x3b82f6)
        arcsGroup.add(arc)
      }
    })

    // 12. Add NASA/USGS Global Live Disasters
    liveEvents.slice(0, 10).forEach((ev) => {
      if (ev.lat && ev.lng) {
        const evVec = latLngToVec3(ev.lat, ev.lng, RADIUS + 1.2)
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 8, 8),
          new THREE.MeshBasicMaterial({
            color: ev.category === 'Earthquake' ? 0xf59e0b : 0x06b6d4,
          })
        )
        dot.position.copy(evVec)
        markersGroup.add(dot)
      }
    })

    // 13. CINEMATIC MOVIE CAMERA LOGIC
    // Set Target Rotation to center the active disaster right in front of camera
    globeTargetRotY.current = -targetLng * (Math.PI / 180) - Math.PI / 2
    globeTargetRotX.current = targetLat * (Math.PI / 180) * 0.7

    // Dynamic Zoom Level:
    // If multiple places (hospitals/shelters) detected: Zoom out to tactical overview (z = 175)
    // If single incident detected: Cinematic close-up zoom (z = 118)
    if (hasMultipleLocations) {
      cameraTargetZ.current = 175
      setHudStatus(`TACTICAL OVERVIEW: ${hospitals.length} HOSPITALS & ${shelters.length} SHELTERS LINKED`)
    } else {
      cameraTargetZ.current = 118
      setHudStatus(`TARGET LOCKED ON EPICENTER (${targetLat.toFixed(2)}°N, ${targetLng.toFixed(2)}°E)`)
    }

    // 14. Drag Controls
    let isDragging = false
    let prevX = 0
    let prevY = 0

    const onMouseDown = (e) => {
      isDragging = true
      prevX = e.clientX
      prevY = e.clientY
    }
    const onMouseMove = (e) => {
      if (!isDragging) return
      const dx = e.clientX - prevX
      const dy = e.clientY - prevY
      globeGroup.rotation.y += dx * 0.005
      globeGroup.rotation.x += dy * 0.005
      globeTargetRotY.current = globeGroup.rotation.y
      globeTargetRotX.current = globeGroup.rotation.x
      prevX = e.clientX
      prevY = e.clientY
    }
    const onMouseUp = () => { isDragging = false }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // Touch controls
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        prevX = e.touches[0].clientX
        prevY = e.touches[0].clientY
      }
    }
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - prevX
      const dy = e.touches[0].clientY - prevY
      globeGroup.rotation.y += dx * 0.005
      globeGroup.rotation.x += dy * 0.005
      globeTargetRotY.current = globeGroup.rotation.y
      globeTargetRotX.current = globeGroup.rotation.x
      prevX = e.touches[0].clientX
      prevY = e.touches[0].clientY
    }
    const onTouchEnd = () => { isDragging = false }

    container.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)

    // 15. Animation Loop with Smooth Movie-Style Lerping
    let animId
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Smooth camera zoom lerping (swoop in / swoop out like in sci-fi films)
      cameraCurrentZ.current += (cameraTargetZ.current - cameraCurrentZ.current) * 0.045
      camera.position.z = cameraCurrentZ.current

      // Smooth rotation alignment towards target when not manually dragging
      if (!isDragging) {
        if (isAutoTouring.current) {
          // Drone tour: gentle orbital sweep
          globeGroup.rotation.y += 0.004
        } else {
          // Smooth spring-like lerp to face target coordinates
          globeGroup.rotation.y += (globeTargetRotY.current - globeGroup.rotation.y) * 0.05
          globeGroup.rotation.x += (globeTargetRotX.current - globeGroup.rotation.x) * 0.05
        }
      }

      // Independent cloud layer rotation for realism
      if (cloudSphere) {
        cloudSphere.rotation.y += 0.0008
      }

      // Shockwave pulsation
      rings.forEach((ring, idx) => {
        const scale = 1 + ((elapsed * 1.8 + idx * 0.35) % 2.5) * 0.55
        ring.scale.set(scale, scale, 1)
        ring.material.opacity = Math.max(0, 0.8 - scale * 0.32)
      })

      // Beacon heart-beat pulse
      const beaconScale = 1 + Math.sin(elapsed * 4.5) * 0.22
      beacon.scale.set(beaconScale, beaconScale, beaconScale)

      renderer.render(scene, camera)
    }

    animate()

    // Resize Handler
    const onResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [targetLat, targetLng, hasMultipleLocations, liveEvents, hospitals.length, shelters.length])

  // Cinematic Camera Actions
  const handleZoomInEpicenter = () => {
    cameraTargetZ.current = 110
    isAutoTouring.current = false
    setIsCinematicTour(false)
    globeTargetRotY.current = -targetLng * (Math.PI / 180) - Math.PI / 2
    globeTargetRotX.current = targetLat * (Math.PI / 180) * 0.7
    setHudStatus(`CLOSE-UP RECON: LOCKED ON ${targetLat.toFixed(2)}°N, ${targetLng.toFixed(2)}°E`)
  }

  const handleZoomOutTactical = () => {
    cameraTargetZ.current = 185
    isAutoTouring.current = false
    setIsCinematicTour(false)
    setHudStatus(`TACTICAL WIDE-ANGLE: MONITORING ALL PERIMETER FORCES`)
  }

  const toggleDroneTour = () => {
    isAutoTouring.current = !isAutoTouring.current
    setIsCinematicTour(!isCinematicTour)
    cameraTargetZ.current = isAutoTouring.current ? 145 : 120
    setHudStatus(isAutoTouring.current ? 'CINEMATIC DRONE TOUR: ORBITAL SWEEP ACTIVE' : 'MANUAL COMMAND MODE')
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', borderRadius: '12px', background: '#020617' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Hollywood Sci-Fi Targeting HUD */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        padding: '6px 14px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#00f0ff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 0 12px rgba(0, 240, 255, 0.15)',
        pointerEvents: 'none',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ff0055',
          boxShadow: '0 0 10px #ff0055',
          animation: 'pulse 1.2s infinite',
        }} />
        <span style={{ fontWeight: '700', letterSpacing: '0.05em' }}>{hudStatus}</span>
      </div>

      {/* Cinematic Camera Control Bar */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        display: 'flex',
        gap: '6px',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '4px',
        borderRadius: '8px',
      }}>
        <button
          onClick={handleZoomInEpicenter}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '700', color: '#00f0ff', borderColor: 'rgba(0,240,255,0.4)' }}
        >
          🎯 ZOOM IN (EPICENTER)
        </button>
        <button
          onClick={handleZoomOutTactical}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '700', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)' }}
        >
          🌐 ZOOM OUT (TACTICAL)
        </button>
        <button
          onClick={toggleDroneTour}
          className="severity-btn"
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: '700',
            color: isCinematicTour ? '#22c55e' : '#f59e0b',
            borderColor: isCinematicTour ? '#22c55e' : 'rgba(245,158,11,0.4)',
            background: isCinematicTour ? 'rgba(34,197,94,0.15)' : 'transparent',
          }}
        >
          {isCinematicTour ? '🎬 TOUR ACTIVE' : '🎬 DRONE SWOOP'}
        </button>
      </div>

      {/* Live Coordinate Tag */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '5px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#94a3b8',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}>
        🛰️ NASA BLUE MARBLE TEXTURE · {targetLat.toFixed(2)}°N, {targetLng.toFixed(2)}°E
      </div>
    </div>
  )
}
