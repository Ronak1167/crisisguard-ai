import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Satellite,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Crosshair,
  Building2,
  Compass,
  Globe,
  AlertTriangle,
  Home,
  Zap,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Send,
} from 'lucide-react'

// Fix default leaflet marker icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SVG_ICONS = {
  epicenter: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  hospital: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  fire: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  police: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  rescue: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>`,
  investigation: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  shelter: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  event: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
}

// Custom High-Tech Markers without emojis
const createPulseIcon = (iconType, color, label) => {
  const svg = SVG_ICONS[iconType] || SVG_ICONS.event
  return L.divIcon({
    className: 'custom-earth-marker',
    html: `<div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    ">
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px ${color}, 0 0 22px ${color}88;
        border: 2px solid #ffffff;
      ">${svg}</div>
      <div style="
        background: rgba(11, 17, 32, 0.94);
        color: #f8fafc;
        font-family: var(--font-mono, monospace);
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.04em;
        padding: 2px 6px;
        border-radius: 4px;
        margin-top: 3px;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 2px 6px rgba(0,0,0,0.6);
      ">${label}</div>
    </div>`,
    iconSize: [36, 52],
    iconAnchor: [18, 26],
  })
}

/**
 * Controller to handle movie-style flyTo and flyToBounds animations,
 * plus reporting altitude and zoom level to the HUD just like Google Earth.
 * FIX: `map` removed from useEffect deps — useMap() returns a stable instance per
 * the react-leaflet contract. Adding it caused an infinite re-render loop.
 * FIX: onViewportChange stored in a ref so it never needs to be a dep.
 */
function EarthCameraController({
  coordinates,
  hospitals = [],
  shelters = [],
  fireStations = [],
  policeStations = [],
  rescueBases = [],
  investigationUnits = [],
  locateTarget = null,
  onViewportChange
}) {
  const map = useMap()
  const prevCoordRef = useRef(null)
  const prevFacilitiesLen = useRef(0)
  // Stable ref for callback so we don't need it in deps
  const onViewportChangeRef = useRef(onViewportChange)
  useEffect(() => { onViewportChangeRef.current = onViewportChange })

  // When a user clicks 'LOCATE ON MAP' from any facility card, fly camera directly to it
  useEffect(() => {
    if (locateTarget && locateTarget.lat && locateTarget.lng) {
      map.flyTo([locateTarget.lat, locateTarget.lng], 16, { duration: 1.8 })
    }
  }, [locateTarget, map])

  // Listen to zoom and move events to update Google Earth HUD telemetry
  useMapEvents({
    zoomend: () => {
      if (onViewportChangeRef.current) {
        onViewportChangeRef.current(map.getZoom(), map.getCenter())
      }
    },
    moveend: () => {
      if (onViewportChangeRef.current) {
        onViewportChangeRef.current(map.getZoom(), map.getCenter())
      }
    },
  })

  useEffect(() => {
    if (!coordinates?.lat || !coordinates?.lng) return
    const lat = coordinates.lat
    const lng = coordinates.lng

    const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
    const isNewLocation = prevCoordRef.current !== coordKey
    const facilitiesLen =
      hospitals.length +
      shelters.length +
      fireStations.length +
      policeStations.length +
      rescueBases.length +
      investigationUnits.length
    const hasNewFacilities = facilitiesLen > 0 && facilitiesLen !== prevFacilitiesLen.current

    if (isNewLocation) {
      prevCoordRef.current = coordKey
      map.flyTo([lat, lng], 13, { duration: 2.2, easeLinearity: 0.25 })
    } else if (hasNewFacilities) {
      prevFacilitiesLen.current = facilitiesLen
      const allPoints = [[lat, lng]]
      hospitals.forEach((h) => { if (h.lat && h.lng) allPoints.push([h.lat, h.lng]) })
      shelters.forEach((s) => { if (s.lat && s.lng) allPoints.push([s.lat, s.lng]) })
      fireStations.forEach((f) => { if (f.lat && f.lng) allPoints.push([f.lat, f.lng]) })
      policeStations.forEach((p) => { if (p.lat && p.lng) allPoints.push([p.lat, p.lng]) })
      rescueBases.forEach((r) => { if (r.lat && r.lng) allPoints.push([r.lat, r.lng]) })
      investigationUnits.forEach((u) => { if (u.lat && u.lng) allPoints.push([u.lat, u.lng]) })
      const bounds = L.latLngBounds(allPoints)
      map.flyToBounds(bounds, { padding: [60, 60], duration: 2.6, maxZoom: 13 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    coordinates?.lat,
    coordinates?.lng,
    hospitals.length,
    shelters.length,
    fireStations.length,
    policeStations.length,
    rescueBases.length,
    investigationUnits.length,
    // map intentionally omitted — useMap() instance is stable per react-leaflet contract
  ])

  return null
}

export default function GoogleEarthMap({
  coordinates,
  location = '',
  description = '',
  severity = 'HIGH',
  hospitals = [],
  shelters = [],
  fireStations = [],
  policeStations = [],
  rescueBases = [],
  investigationUnits = [],
  locateTarget = null,
  disasterType = 'cyclone',
  liveEvents = [],
  results = null,
  liveTelemetry = null,
  isRunning = false,
  onSelectEpicenter,
  onSelectHazard,
  onTriggerAnalysis,
  onOpenDispatch,
}) {
  const mapRef = useRef(null)
  const [mapLayer, setMapLayer] = useState('hybrid') // 'satellite' | 'hybrid' | 'tactical'
  const [currentZoom, setCurrentZoom] = useState(12)
  const [currentCenter, setCurrentCenter] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const lat = coordinates?.lat ?? 20.2724
  const lng = coordinates?.lng ?? 85.8338

  // Calculate approximate eye altitude in km (similar to Google Earth)
  const eyeAltitudeKm = useMemo(() => {
    // Zoom 19 is ~0.15 km, Zoom 12 is ~15 km, Zoom 2 is ~10,000 km
    const z = Math.max(2, typeof currentZoom === 'number' ? currentZoom : 12)
    const base = 40000 / Math.pow(2, z - 1)
    return base >= 10 ? Math.round(base).toLocaleString() : base.toFixed(1)
  }, [currentZoom])

  // Map Presets for Movie-style Quick Navigation
  const flyToEpicenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 14, { duration: 2.0 })
    }
  }

  const flyToStreetLevel = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { duration: 2.4 })
    }
  }

  const flyToAllAssets = () => {
    if (mapRef.current) {
      const allPoints = [[lat, lng]]
      hospitals.forEach((h) => { if (h.lat && h.lng) allPoints.push([h.lat, h.lng]) })
      shelters.forEach((s) => { if (s.lat && s.lng) allPoints.push([s.lat, s.lng]) })
      const bounds = L.latLngBounds(allPoints)
      mapRef.current.flyToBounds(bounds, { padding: [60, 60], duration: 2.4 })
    }
  }

  const flyToGlobalOrbit = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 2.5, { duration: 2.2 })
    }
  }

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn(1)
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut(1)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const epicenterIcon = useMemo(() => createPulseIcon('epicenter', '#ef4444', 'EPICENTER'), [])

  // Stable viewport-change callback — avoids creating new function on every render
  // which was causing EarthCameraController to re-run its event registration
  const handleViewportChange = useCallback((z, c) => {
    setCurrentZoom(z)
    setCurrentCenter(c)
  }, [])


  // World bounds to strictly prevent panning into the infinite void
  const worldBounds = useMemo(() => [
    [-85, -180],
    [85, 180],
  ], [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '780px' : '440px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        transition: 'height 0.3s ease',
        background: '#020617',
      }}
    >
      <MapContainer
        ref={mapRef}
        center={[lat, lng]}
        zoom={12}
        minZoom={2}
        maxZoom={19}
        zoomSnap={0.5}
        zoomDelta={0.5}
        maxBounds={worldBounds}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
        inertia={true}
        inertiaDeceleration={3000}
        style={{ height: '100%', width: '100%', background: '#020617' }}
      >
        <EarthCameraController
          coordinates={coordinates}
          hospitals={hospitals}
          shelters={shelters}
          fireStations={fireStations}
          policeStations={policeStations}
          rescueBases={rescueBases}
          investigationUnits={investigationUnits}
          locateTarget={locateTarget}
          onViewportChange={handleViewportChange}
        />

        {/* 1. ESRI World Imagery (High-Res Photorealistic Satellite like Google Earth) */}
        {mapLayer === 'satellite' && (
          <TileLayer
            attribution='&copy; ESRI World Imagery, Maxar, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            minZoom={2}
            noWrap={true}
            bounds={worldBounds}
          />
        )}

        {/* 2. Hybrid Mode: ESRI Satellite + Borders & Place Names */}
        {mapLayer === 'hybrid' && (
          <>
            <TileLayer
              attribution='&copy; ESRI World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              minZoom={2}
              noWrap={true}
              bounds={worldBounds}
            />
            <TileLayer
              attribution='&copy; ESRI Reference'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              minZoom={2}
              noWrap={true}
              bounds={worldBounds}
            />
          </>
        )}

        {/* 3. Tactical Dark (ESRI World Dark Gray Base + Reference) - Watermark-Free & No API Key Required */}
        {mapLayer === 'tactical' && (
          <>
            <TileLayer
              attribution='&copy; ESRI Dark Gray Canvas'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              minZoom={2}
              noWrap={true}
              bounds={worldBounds}
            />
            <TileLayer
              attribution='&copy; ESRI Reference'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              minZoom={2}
              noWrap={true}
              bounds={worldBounds}
            />
          </>
        )}

        {/* Laser Triage Lines connecting Epicenter to each Hospital */}
        {hospitals.map((h, i) => (
          h.lat && h.lng && (
            <Polyline
              key={`h-line-${i}`}
              positions={[[lat, lng], [h.lat, h.lng]]}
              pathOptions={{
                color: '#10b981',
                weight: 2,
                dashArray: '5, 8',
                opacity: 0.85,
              }}
            />
          )
        ))}

        {/* Laser Triage Lines connecting Epicenter to each Shelter */}
        {shelters.map((s, i) => (
          s.lat && s.lng && (
            <Polyline
              key={`s-line-${i}`}
              positions={[[lat, lng], [s.lat, s.lng]]}
              pathOptions={{
                color: '#3b82f6',
                weight: 2,
                dashArray: '6, 6',
                opacity: 0.8,
              }}
            />
          )
        ))}

        {/* Epicenter Marker */}
        <Marker
          position={[lat, lng]}
          icon={epicenterIcon}
          eventHandlers={{
            click: () => {
              if (onSelectEpicenter) {
                onSelectEpicenter()
              }
            },
            popupopen: () => {
              if (onSelectEpicenter) {
                onSelectEpicenter()
              }
            },
          }}
        >
          <Popup className="earth-tactical-popup" minWidth={310}>
            <div className="popup-container">
              <div className="popup-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} color="#ef4444" />
                  <span className="popup-title">INCIDENT EPICENTER</span>
                </div>
                <span className="badge badge-red">{severity || 'CRITICAL'}</span>
              </div>

              <div className="popup-location-name">
                {location || 'Bhubaneswar, Odisha'}
              </div>

              <div className="popup-telemetry-grid">
                <div className="popup-telemetry-item">
                  <span className="popup-label">DISASTER TYPE</span>
                  <span className="popup-value" style={{ textTransform: 'uppercase', color: '#00f0ff' }}>
                    {disasterType || 'cyclone'}
                  </span>
                </div>
                <div className="popup-telemetry-item">
                  <span className="popup-label">GPS COORDINATES</span>
                  <span className="popup-value">
                    {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                  </span>
                </div>
                <div className="popup-telemetry-item">
                  <span className="popup-label">WIND VELOCITY</span>
                  <span className="popup-value" style={{ color: '#38bdf8' }}>
                    {liveTelemetry?.wind_speed_kmh ? `${liveTelemetry.wind_speed_kmh} km/h` : '185 km/h'}
                  </span>
                </div>
                <div className="popup-telemetry-item">
                  <span className="popup-label">SURFACE TEMP</span>
                  <span className="popup-value">
                    {liveTelemetry?.temperature_c ? `${liveTelemetry.temperature_c}°C` : '29.4°C'}
                  </span>
                </div>
              </div>

              {/* If analysis already completed */}
              {results ? (
                <div className="popup-results-box">
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', letterSpacing: '0.04em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={12} /> INCIDENT ACTION PLAN ACTIVE ({results.response_plan?.overall_response_score || 78}% RESPONSE ADEQUACY)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#94a3b8' }}>Population at Risk:</span>
                    <span style={{ fontWeight: '700', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                      {(results.intelligence?.impact_assessment?.estimated_population_at_risk || 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#94a3b8' }}>Surge Beds & Hospitals:</span>
                    <span style={{ fontWeight: '700', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {hospitals.reduce((s, h) => s + (h.beds_available || 0), 0)} beds ({hospitals.length} facilities)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#94a3b8' }}>Fire & HazMat Response:</span>
                    <span style={{ fontWeight: '700', color: '#fb923c', fontFamily: 'var(--font-mono)' }}>
                      {fireStations.length} stations ({fireStations.reduce((s, f) => s + (f.tenders || 0), 0)} tenders)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#94a3b8' }}>Police & Cordon Units:</span>
                    <span style={{ fontWeight: '700', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                      {policeStations.length} divisions ({policeStations.reduce((s, p) => s + (p.officers || 0), 0)} officers)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#94a3b8' }}>Specialized USAR & Inquest:</span>
                    <span style={{ fontWeight: '700', color: '#facc15', fontFamily: 'var(--font-mono)' }}>
                      {rescueBases.length} USAR bases · {investigationUnits.length} Forensic Units
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#94a3b8' }}>Estimated Protected:</span>
                    <span style={{ fontWeight: '700', color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>
                      {(results.response_plan?.lives_potentially_saved_with_plan || 0).toLocaleString()} lives
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const el = document.querySelector('.results-panel')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="popup-view-btn"
                  >
                    <ShieldCheck size={12} /> VIEW COMPLETE INCIDENT ACTION PLAN (IAP)
                  </button>

                  {results.agency_dispatches && onOpenDispatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDispatch()
                      }}
                      style={{
                        marginTop: '6px',
                        width: '100%',
                        padding: '7px 10px',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(249, 115, 22, 0.3) 100%)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        letterSpacing: '0.03em',
                      }}
                    >
                      <Send size={12} /> OPEN MULTI-AGENCY DISPATCH CONSOLE
                    </button>
                  )}
                </div>
              ) : isRunning ? (
                <div className="popup-running-box">
                  <Loader2 size={15} className="animate-spin" color="#00f0ff" />
                  <span>MULTI-AGENT REASONING PIPELINE IN PROGRESS...</span>
                </div>
              ) : (
                <div style={{ marginTop: '4px' }}>
                  <div className="popup-briefing-snippet">
                    {description || 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge expected.'}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onTriggerAnalysis) {
                        onTriggerAnalysis({
                          disasterType: disasterType || 'cyclone',
                          location: location || 'Bhubaneswar, Odisha',
                          severity: severity || 'CRITICAL',
                          description: description || 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge expected.',
                          coordinates: { lat, lng },
                        })
                      }
                    }}
                    className="popup-activate-btn"
                  >
                    <Zap size={13} /> ANALYZE THIS INCIDENT WITH CRISISGUARD AI
                  </button>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                    Incident parameters loaded into Command Console. Click to initiate.
                  </div>
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* 12km High-Risk Inundation Zone */}
        <Circle
          center={[lat, lng]}
          radius={12000}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.22,
            dashArray: '8, 8',
            weight: 2,
          }}
        />

        {/* 25km Evacuation Warning Perimeter */}
        <Circle
          center={[lat, lng]}
          radius={25000}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.08,
            dashArray: '5, 10',
            weight: 1.5,
          }}
        />

        {/* Verified Hospitals */}
        {hospitals.map((h, i) => (
          h.lat && h.lng && (
            <Marker
              key={`hosp-${i}`}
              position={[h.lat, h.lng]}
              icon={createPulseIcon('hospital', '#10b981', h.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '6px', minWidth: '220px' }}>
                  <div style={{ fontWeight: '800', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} /> {h.name}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: '700' }}>{h.status}</span></div>
                  <div style={{ fontSize: '12px' }}><strong>Surge Beds Available:</strong> <span style={{ color: '#0284c7', fontWeight: '800' }}>{h.beds_available}</span> / {h.total_beds || 'N/A'}</div>
                  <div style={{ fontSize: '12px' }}><strong>ICU Surge Beds:</strong> <span style={{ color: '#ef4444', fontWeight: '700' }}>{h.icu_beds_available || 15}</span></div>
                  <div style={{ fontSize: '12px' }}><strong>Trauma Certified:</strong> {h.trauma_center ? 'Yes (Apex Trauma Center)' : 'Standard'}</div>
                  <div style={{ fontSize: '12px' }}><strong>Distance from Epicenter:</strong> {h.distance_km} km</div>
                  {onOpenDispatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDispatch('medical_health')
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '5px 8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Send size={11} /> DISPATCH TRAUMA & EMS DIRECTIVE
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Verified Fire & Rescue Stations */}
        {fireStations.map((f, i) => (
          f.lat && f.lng && (
            <Marker
              key={`fire-${i}`}
              position={[f.lat, f.lng]}
              icon={createPulseIcon('fire', '#f97316', f.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '6px', minWidth: '220px' }}>
                  <div style={{ fontWeight: '800', color: '#ea580c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} /> {f.name}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}><strong>Cadre:</strong> {f.type}</div>
                  <div style={{ fontSize: '12px' }}><strong>Fire Tenders:</strong> <span style={{ color: '#ea580c', fontWeight: '800' }}>{f.tenders}</span> units</div>
                  <div style={{ fontSize: '12px' }}><strong>Dewatering Pumps:</strong> <span style={{ color: '#0284c7', fontWeight: '800' }}>{f.dewatering_pumps}</span> units</div>
                  <div style={{ fontSize: '12px' }}><strong>Personnel:</strong> {f.personnel} active firefighters</div>
                  <div style={{ fontSize: '12px' }}><strong>Chainsaw Units:</strong> {f.chainsaws || 8} crews</div>
                  <div style={{ fontSize: '12px' }}><strong>Distance:</strong> {f.distance_km} km away</div>
                  {onOpenDispatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDispatch('fire_service')
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '5px 8px',
                        background: 'linear-gradient(135deg, #f97316, #c2410c)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Send size={11} /> DISPATCH FIRE & RESCUE DIRECTIVE
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Verified Police Stations & Security Cordon */}
        {policeStations.map((p, i) => (
          p.lat && p.lng && (
            <Marker
              key={`police-${i}`}
              position={[p.lat, p.lng]}
              icon={createPulseIcon('police', '#3b82f6', p.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '6px', minWidth: '220px' }}>
                  <div style={{ fontWeight: '800', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} /> {p.name}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}><strong>Cadre:</strong> {p.type}</div>
                  <div style={{ fontSize: '12px' }}><strong>Officers Mobilized:</strong> <span style={{ color: '#2563eb', fontWeight: '800' }}>{p.officers}</span> personnel</div>
                  <div style={{ fontSize: '12px' }}><strong>Patrol Vehicles:</strong> {p.patrol_vehicles} interceptors</div>
                  <div style={{ fontSize: '12px' }}><strong>Green Corridor Squads:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>{p.green_corridor_squads} active squads</span></div>
                  <div style={{ fontSize: '12px' }}><strong>Tactical Radio Net:</strong> {p.wireless}</div>
                  <div style={{ fontSize: '12px' }}><strong>Distance:</strong> {p.distance_km} km away</div>
                  {onOpenDispatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDispatch('police_department')
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '5px 8px',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Send size={11} /> DISPATCH LAW ENFORCEMENT DIRECTIVE
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Specialized USAR & Defense Rescue Bases */}
        {rescueBases.map((r, i) => (
          r.lat && r.lng && (
            <Marker
              key={`rescue-${i}`}
              position={[r.lat, r.lng]}
              icon={createPulseIcon('rescue', '#eab308', r.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '6px', minWidth: '230px' }}>
                  <div style={{ fontWeight: '800', color: '#ca8a04', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Crosshair size={14} /> {r.name}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}><strong>Cadre:</strong> {r.type}</div>
                  <div style={{ fontSize: '12px' }}><strong>USAR Responders:</strong> <span style={{ color: '#ca8a04', fontWeight: '800' }}>{r.personnel}</span> specialists</div>
                  <div style={{ fontSize: '12px' }}><strong>Inflatable / Storm Craft:</strong> {r.inflatable_boats || 'Tactical Units'}</div>
                  <div style={{ fontSize: '12px' }}><strong>Specialized Gear:</strong> {(r.equipment || []).join(', ')}</div>
                  <div style={{ fontSize: '12px' }}><strong>Tactical Channel:</strong> {r.channel}</div>
                  <div style={{ fontSize: '12px' }}><strong>Distance:</strong> {r.distance_km} km away</div>
                  {onOpenDispatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDispatch('rescue_ndrf')
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '5px 8px',
                        background: 'linear-gradient(135deg, #eab308, #a16207)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Send size={11} /> DISPATCH USAR SPECIAL RESCUE DIRECTIVE
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Civil Defense & Emergency Operations Centers (EOC) */}
        {investigationUnits.map((u, i) => (
          u.lat && u.lng && (
            <Marker
              key={`inquest-${i}`}
              position={[u.lat, u.lng]}
              icon={createPulseIcon('investigation', '#a855f7', 'EOC')}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '6px', minWidth: '230px' }}>
                  <div style={{ fontWeight: '800', color: '#9333ea', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} /> {u.name}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}><strong>Cadre:</strong> {u.type}</div>
                  <div style={{ fontSize: '12px' }}><strong>Operational Role:</strong> {u.role}</div>
                  <div style={{ fontSize: '12px' }}><strong>Command Personnel:</strong> {u.officers} staff</div>
                  <div style={{ fontSize: '12px' }}><strong>Distance:</strong> {u.distance_km} km away</div>
                  {onOpenDispatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDispatch('investigation_forensic')
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '5px 8px',
                        background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Send size={11} /> DISPATCH CIVIL DEFENSE & EOC DIRECTIVE
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Verified Shelters */}
        {shelters.map((s, i) => (
          s.lat && s.lng && (
            <Marker
              key={`shelt-${i}`}
              position={[s.lat, s.lng]}
              icon={createPulseIcon('shelter', '#06b6d4', s.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '6px', minWidth: '220px' }}>
                  <div style={{ fontWeight: '800', color: '#0891b2', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={14} /> {s.name}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}><strong>Safe Capacity:</strong> <strong>{s.capacity.toLocaleString()}</strong> persons</div>
                  <div style={{ fontSize: '12px' }}><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>{s.status}</span></div>
                  <div style={{ fontSize: '12px' }}><strong>Facilities:</strong> {(s.facilities || []).join(', ')}</div>
                  <div style={{ fontSize: '12px' }}><strong>Distance:</strong> {s.distance_km || 4.2} km away</div>
                  {onOpenDispatch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDispatch('district_administration')
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '5px 8px',
                        background: 'linear-gradient(135deg, #06b6d4, #0e7490)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Send size={11} /> DISPATCH CIVIL EVACUATION DIRECTIVE
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Real-time Global Hazards from NASA EONET & USGS */}
        {liveEvents.map((ev, i) => {
          if (!ev.lat || !ev.lng) return null
          const isQuake = ev.category === 'Earthquake' || (ev.title && ev.title.includes('M'))
          const isWildfire = ev.category === 'Wildfires'
          const color = isQuake ? '#f59e0b' : isWildfire ? '#ef4444' : '#00f0ff'
          const label = isQuake
            ? `M${ev.magnitude || 5.0}`
            : (ev.category?.slice(0, 6).toUpperCase() || 'ALERT')

          return (
            <Marker
              key={`live-hz-${ev.id || i}`}
              position={[ev.lat, ev.lng]}
              icon={createPulseIcon('event', color, label)}
              eventHandlers={{
                click: () => {
                  if (onSelectHazard) {
                    onSelectHazard(ev, true)
                  }
                },
                popupopen: () => {
                  if (onSelectHazard) {
                    onSelectHazard(ev, true)
                  }
                },
              }}
            >
              <Popup className="earth-tactical-popup" minWidth={310}>
                <div className="popup-container">
                  <div className="popup-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} color={color} />
                      <span className="popup-title">LIVE GLOBAL DISASTER EVENT</span>
                    </div>
                    <span className="badge badge-yellow">{ev.severity || 'ACTIVE'}</span>
                  </div>

                  <div className="popup-location-name" style={{ fontSize: '12px' }}>
                    {ev.title}
                  </div>

                  <div className="popup-telemetry-grid">
                    <div className="popup-telemetry-item">
                      <span className="popup-label">CATEGORY</span>
                      <span className="popup-value" style={{ color: color }}>
                        {ev.category || 'Disaster Event'}
                      </span>
                    </div>
                    <div className="popup-telemetry-item">
                      <span className="popup-label">SOURCE</span>
                      <span className="popup-value" style={{ color: '#94a3b8' }}>
                        {ev.source || 'NASA / USGS'}
                      </span>
                    </div>
                    <div className="popup-telemetry-item">
                      <span className="popup-label">GPS LOCATION</span>
                      <span className="popup-value">
                        {Number(ev.lat).toFixed(3)}°N, {Number(ev.lng).toFixed(3)}°E
                      </span>
                    </div>
                    <div className="popup-telemetry-item">
                      <span className="popup-label">OBSERVED</span>
                      <span className="popup-value">
                        {ev.date ? new Date(ev.date).toLocaleDateString() : 'Real-Time'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onSelectHazard) {
                          onSelectHazard(ev, true)
                        }
                      }}
                      className="popup-activate-btn"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(239,68,68,0.25) 100%)',
                        borderColor: '#f59e0b',
                        color: '#fef08a',
                      }}
                    >
                      <Zap size={13} /> ACTIVATE CRISIS RESPONSE FOR THIS INCIDENT
                    </button>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                      Parameters loaded into Command Console. Click to coordinate response.
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Top Left: Layer Selector & Fullscreen Toggle */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 1000,
        display: 'flex',
        gap: '6px',
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      }}>
        <button
          onClick={() => setMapLayer('hybrid')}
          className="severity-btn"
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: '600',
            color: mapLayer === 'hybrid' ? '#00f0ff' : '#94a3b8',
            background: mapLayer === 'hybrid' ? 'rgba(0,240,255,0.15)' : 'transparent',
            borderColor: mapLayer === 'hybrid' ? '#00f0ff' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Satellite size={12} /> SATELLITE
        </button>
        <button
          onClick={() => setMapLayer('tactical')}
          className="severity-btn"
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: '600',
            color: mapLayer === 'tactical' ? '#00f0ff' : '#94a3b8',
            background: mapLayer === 'tactical' ? 'rgba(0,240,255,0.15)' : 'transparent',
            borderColor: mapLayer === 'tactical' ? '#00f0ff' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Layers size={12} /> DARK CANVAS
        </button>
        <button
          onClick={toggleFullscreen}
          className="severity-btn"
          style={{
            padding: '5px 8px',
            fontSize: '11px',
            color: '#f1f5f9',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Toggle Expanded View"
        >
          {isFullscreen ? <><Minimize2 size={12} /> COLLAPSE</> : <><Maximize2 size={12} /> EXPAND</>}
        </button>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '2px 2px' }} />
        <button
          onClick={handleZoomIn}
          className="severity-btn"
          style={{ padding: '5px 8px', fontSize: '11px', fontWeight: '800', color: '#00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Zoom In (Manual +)"
        >
          <Plus size={13} />
        </button>
        <button
          onClick={handleZoomOut}
          className="severity-btn"
          style={{ padding: '5px 8px', fontSize: '11px', fontWeight: '800', color: '#00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Zoom Out (Manual −)"
        >
          <Minus size={13} />
        </button>
      </div>

      {/* Top Right: Status HUD */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        background: 'rgba(3, 7, 18, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        padding: '6px 14px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#00f0ff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
        boxShadow: '0 0 12px rgba(0, 240, 255, 0.15)',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 10px #10b981',
          animation: 'pulse 1.4s infinite',
        }} />
        <span style={{ fontWeight: '800', letterSpacing: '0.05em' }}>
          {hospitals.length > 0 ? `EMERGENCY ASSETS: ${hospitals.length} HOSPITALS & ${shelters.length} SHELTERS MAPPED` : 'SATELLITE BASEMAP ACTIVE'}
        </span>
      </div>

      {/* Bottom Left: Movie-Style Camera Navigation Controls */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 1000,
        display: 'flex',
        gap: '6px',
        background: 'rgba(3, 7, 18, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      }}>
        <button
          onClick={flyToEpicenter}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Crosshair size={11} /> FOCUS EPICENTER
        </button>
        <button
          onClick={flyToStreetLevel}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: '#00f0ff', borderColor: 'rgba(0,240,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Building2 size={11} /> LOCAL AREA
        </button>
        <button
          onClick={flyToAllAssets}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Compass size={11} /> FIT ALL FACILITIES ({hospitals.length + shelters.length})
        </button>
        <button
          onClick={flyToGlobalOrbit}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Globe size={11} /> GLOBAL OVERVIEW
        </button>
      </div>

      {/* Bottom Right: Google Earth Style Telemetry HUD */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        zIndex: 1000,
        background: 'rgba(3, 7, 18, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '5px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#94a3b8',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <span>CAMERA ALT: <strong style={{ color: '#00f0ff' }}>{eyeAltitudeKm} km</strong></span>
        <span>ZOOM: <strong style={{ color: '#00f0ff' }}>{typeof currentZoom === 'number' ? (Number.isInteger(currentZoom) ? currentZoom : currentZoom.toFixed(1)) : currentZoom} / 19</strong></span>
        <span>GPS: <strong style={{ color: '#f1f5f9' }}>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong></span>
      </div>
    </div>
  )
}
