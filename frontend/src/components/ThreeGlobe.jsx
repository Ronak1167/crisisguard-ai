import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * ThreeGlobe - Interactive 3D Holographic Globe
 * Renders real Earth disaster points, glowing atmospheric halo,
 * dynamic shockwave rings, and interactive mouse-drag 3D rotation.
 */
export default function ThreeGlobe({ centerCoords, liveEvents = [] }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const globeGroupRef = useRef(null)
  const shockwavesRef = useRef([])
  const [hoveredEvent, setHoveredEvent] = useState(null)

  const targetLat = centerCoords?.lat ?? 20.2961
  const targetLng = centerCoords?.lng ?? 85.8245

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 400
    const height = container.clientHeight || 360

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 240

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 3. Globe Parent Group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)
    globeGroupRef.current = globeGroup

    const RADIUS = 75

    // 4. Base Holographic Sphere
    const sphereGeo = new THREE.SphereGeometry(RADIUS, 48, 48)
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x051329,
      emissive: 0x021020,
      specular: 0x00d2ff,
      shininess: 40,
      transparent: true,
      opacity: 0.88,
      wireframe: false,
    })
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat)
    globeGroup.add(baseSphere)

    // 5. Wireframe Lat/Lng Grid
    const wireGeo = new THREE.SphereGeometry(RADIUS + 0.4, 28, 28)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    })
    const wireSphere = new THREE.Mesh(wireGeo, wireMat)
    globeGroup.add(wireSphere)

    // 6. Glowing Atmospheric Halo
    const haloGeo = new THREE.SphereGeometry(RADIUS + 6, 32, 32)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00a8ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    globeGroup.add(halo)

    // 7. Dynamic Point Particles (Dot Matrix Continents)
    const particleCount = 1800
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution on sphere surface
      const phi = Math.acos(-1 + (2 * i) / particleCount)
      const theta = Math.sqrt(particleCount * Math.PI) * phi

      const x = (RADIUS + 0.8) * Math.cos(theta) * Math.sin(phi)
      const y = (RADIUS + 0.8) * Math.sin(theta) * Math.sin(phi)
      const z = (RADIUS + 0.8) * Math.cos(phi)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Cyan to emerald telemetry colors
      colors[i * 3] = 0.0
      colors[i * 3 + 1] = 0.75 + Math.random() * 0.25
      colors[i * 3 + 2] = 0.95
    }

    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const pMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    })
    const particles = new THREE.Points(pGeo, pMat)
    globeGroup.add(particles)

    // 8. Lighting
    const ambientLight = new THREE.AmbientLight(0x0c2540, 2.5)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.0)
    dirLight1.position.set(120, 100, 150)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xff3366, 1.2)
    dirLight2.position.set(-120, -100, -150)
    scene.add(dirLight2)

    // Helper: Convert lat/lng to 3D Cartesian coords
    function latLngToVector3(lat, lng, radius) {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      )
    }

    // 9. Add Primary Disaster Epicenter Marker
    const epicenterPos = latLngToVector3(targetLat, targetLng, RADIUS)

    // Red Pulsing Pin
    const pinGeo = new THREE.CylinderGeometry(0.3, 1.8, 16, 16)
    pinGeo.rotateX(Math.PI / 2)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xff2244 })
    const pinMesh = new THREE.Mesh(pinGeo, pinMat)
    pinMesh.position.copy(epicenterPos)
    pinMesh.lookAt(new THREE.Vector3(0, 0, 0))
    pinMesh.position.add(epicenterPos.clone().normalize().multiplyScalar(8))
    globeGroup.add(pinMesh)

    // Epicenter Beacon Sphere
    const beaconGeo = new THREE.SphereGeometry(3.2, 16, 16)
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 })
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat)
    beaconMesh.position.copy(pinMesh.position)
    globeGroup.add(beaconMesh)

    // Shockwave Rings (Expanding Radar Waves)
    const shockwaves = []
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.RingGeometry(2 + r * 3, 3 + r * 3, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3b5c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7 - r * 0.2,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(epicenterPos.clone().multiplyScalar(1.02))
      ring.lookAt(new THREE.Vector3(0, 0, 0))
      globeGroup.add(ring)
      shockwaves.push(ring)
    }
    shockwavesRef.current = shockwaves

    // 10. Secondary Global Live Disasters (NASA & USGS)
    liveEvents.slice(0, 10).forEach(ev => {
      if (ev.lat && ev.lng) {
        const evPos = latLngToVector3(ev.lat, ev.lng, RADIUS + 1.2)
        const dotGeo = new THREE.SphereGeometry(1.6, 8, 8)
        const dotMat = new THREE.MeshBasicMaterial({
          color: ev.category === 'Earthquake' ? 0xffaa00 : 0x00e5ff,
        })
        const dot = new THREE.Mesh(dotGeo, dotMat)
        dot.position.copy(evPos)
        globeGroup.add(dot)
      }
    })

    // Orient Globe toward active disaster initially
    globeGroup.rotation.y = -targetLng * (Math.PI / 180) - Math.PI / 2
    globeGroup.rotation.x = targetLat * (Math.PI / 180) * 0.5

    // 11. Interactive Drag-to-Rotate Controls
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0

    const onMouseDown = (e) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      globeGroup.rotation.y += deltaX * 0.005
      globeGroup.rotation.x += deltaY * 0.005
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseUp = () => { isDragging = false }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // Touch controls for mobile
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        prevMouseX = e.touches[0].clientX
        prevMouseY = e.touches[0].clientY
      }
    }
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return
      const deltaX = e.touches[0].clientX - prevMouseX
      const deltaY = e.touches[0].clientY - prevMouseY
      globeGroup.rotation.y += deltaX * 0.005
      globeGroup.rotation.x += deltaY * 0.005
      prevMouseX = e.touches[0].clientX
      prevMouseY = e.touches[0].clientY
    }
    const onTouchEnd = () => { isDragging = false }

    container.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)

    // 12. Animation Loop
    let animId
    let clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Slow idle rotation when not dragging
      if (!isDragging) {
        globeGroup.rotation.y += 0.0018
      }

      // Shockwave pulsation
      shockwaves.forEach((ring, idx) => {
        const scale = 1 + ((elapsed * 1.5 + idx * 0.4) % 2.5) * 0.6
        ring.scale.set(scale, scale, 1)
        ring.material.opacity = Math.max(0, 0.8 - scale * 0.35)
      })

      // Beacon heart-beat pulse
      const beaconScale = 1 + Math.sin(elapsed * 4) * 0.25
      beaconMesh.scale.set(beaconScale, beaconScale, beaconScale)

      renderer.render(scene, camera)
    }

    animate()

    // 13. Handle Window Resize
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
  }, [targetLat, targetLng, liveEvents])

  return (
    <div style={{ position: 'relative', width: '100%', height: '340px', overflow: 'hidden', borderRadius: '12px' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#00f0ff',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff0055', boxShadow: '0 0 8px #ff0055', animation: 'pulse 1.5s infinite' }} />
        3D HOLOGRAPHIC RADAR · DRAG TO ROTATE
      </div>
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '10px',
        color: 'var(--text-secondary, #94a3b8)',
        pointerEvents: 'none',
      }}>
        Epicenter: {targetLat.toFixed(2)}°N, {targetLng.toFixed(2)}°E
      </div>
    </div>
  )
}
