import { useEffect, useRef, useState, useMemo } from 'react'
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
 */
function EarthCameraController({ coordinates, hospitals = [], shelters = [], onViewportChange }) {
  const map = useMap()
  const prevCoordRef = useRef(null)
  const prevFacilitiesLen = useRef(0)

  // Listen to zoom and move events to update Google Earth HUD telemetry
  useMapEvents({
    zoomend: () => {
      if (onViewportChange) {
        onViewportChange(map.getZoom(), map.getCenter())
      }
    },
    moveend: () => {
      if (onViewportChange) {
        onViewportChange(map.getZoom(), map.getCenter())
      }
    },
  })

  useEffect(() => {
    if (!coordinates?.lat || !coordinates?.lng) return
    const lat = coordinates.lat
    const lng = coordinates.lng

    const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
    const isNewLocation = prevCoordRef.current !== coordKey
    const facilitiesLen = hospitals.length + shelters.length
    const hasNewFacilities = facilitiesLen > 0 && facilitiesLen !== prevFacilitiesLen.current

    if (isNewLocation) {
      prevCoordRef.current = coordKey
      // Movie-style zoom in directly to the incident epicenter
      map.flyTo([lat, lng], 13, { duration: 2.2, easeLinearity: 0.25 })
    } else if (hasNewFacilities) {
      prevFacilitiesLen.current = facilitiesLen
      // Multiple facilities discovered: Movie-style zoom out to encompass all assets
      const allPoints = [[lat, lng]]
      hospitals.forEach((h) => { if (h.lat && h.lng) allPoints.push([h.lat, h.lng]) })
      shelters.forEach((s) => { if (s.lat && s.lng) allPoints.push([s.lat, s.lng]) })

      const bounds = L.latLngBounds(allPoints)
      map.flyToBounds(bounds, { padding: [60, 60], duration: 2.6, maxZoom: 13 })
    }
  }, [coordinates?.lat, coordinates?.lng, hospitals.length, shelters.length, map])

  return null
}

export default function GoogleEarthMap({
  coordinates,
  location = '',
  description = '',
  severity = 'HIGH',
  hospitals = [],
  shelters = [],
  disasterType = 'cyclone',
  liveEvents = [],
  results = null,
  liveTelemetry = null,
  isRunning = false,
  onSelectEpicenter,
  onSelectHazard,
  onTriggerAnalysis,
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
          onViewportChange={(z, c) => {
            setCurrentZoom(z)
            setCurrentCenter(c)
          }}
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
                    <CheckCircle2 size={12} /> AI DISPATCH PIPELINE ACTIVE ({results.response_plan?.overall_response_score || 78}% EFFECTIVENESS)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#94a3b8' }}>Population at Risk:</span>
                    <span style={{ fontWeight: '700', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                      {(results.intelligence?.impact_assessment?.estimated_population_at_risk || 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: '#94a3b8' }}>Surge Beds Mapped:</span>
                    <span style={{ fontWeight: '700', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {hospitals.reduce((s, h) => s + (h.beds_available || 0), 0)} beds ({hospitals.length} facilities)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#94a3b8' }}>Estimated Protected:</span>
                    <span style={{ fontWeight: '700', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
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
                    <ShieldCheck size={12} /> SCROLL TO INCIDENT COMMAND PLAYBOOK
                  </button>
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
                    <Zap size={13} /> ACTIVATE CRISISGUARD AI FOR THIS EPICENTER
                  </button>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                    Details auto-loaded into command console. Click to execute.
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
                <div style={{ color: '#0f172a', padding: '4px' }}>
                  <div style={{ fontWeight: '800', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} /> {h.name}
                  </div>
                  <div style={{ marginTop: '4px' }}><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: '700' }}>{h.status}</span></div>
                  <div><strong>Surge Beds Available:</strong> <span style={{ color: '#0284c7', fontWeight: '800', fontSize: '13px' }}>{h.beds_available}</span> / {h.total_beds || 'N/A'}</div>
                  <div><strong>Trauma Certified:</strong> {h.trauma_center ? 'Yes (Apex Trauma Center)' : 'Standard'}</div>
                  <div><strong>Distance from Epicenter:</strong> {h.distance_km} km</div>
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
              icon={createPulseIcon('shelter', '#3b82f6', s.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '4px' }}>
                  <div style={{ fontWeight: '800', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={14} /> {s.name}
                  </div>
                  <div style={{ marginTop: '4px' }}><strong>Safe Capacity:</strong> <strong>{s.capacity.toLocaleString()}</strong> persons</div>
                  <div><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>{s.status}</span></div>
                  <div><strong>Facilities:</strong> {(s.facilities || []).join(', ')}</div>
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
                    onSelectHazard(ev, false)
                  }
                },
                popupopen: () => {
                  if (onSelectHazard) {
                    onSelectHazard(ev, false)
                  }
                },
              }}
            >
              <Popup className="earth-tactical-popup" minWidth={310}>
                <div className="popup-container">
                  <div className="popup-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} color={color} />
                      <span className="popup-title">LIVE GLOBAL HAZARD</span>
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
                      <Zap size={13} /> ACTIVATE CRISISGUARD AI FOR THIS HAZARD
                    </button>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                      Details loaded into Command Console. Click to execute.
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
          <Layers size={12} /> TACTICAL DARK
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
          {hospitals.length > 0 ? `TACTICAL RADAR: ${hospitals.length} HOSPITALS & ${shelters.length} SHELTERS LINKED` : 'SATELLITE ACTIVE'}
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
          <Building2 size={11} /> STREET LEVEL
        </button>
        <button
          onClick={flyToAllAssets}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Compass size={11} /> FIT ALL ASSETS ({hospitals.length + shelters.length})
        </button>
        <button
          onClick={flyToGlobalOrbit}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Globe size={11} /> GLOBAL ORBIT
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
        <span>EYE ALT: <strong style={{ color: '#00f0ff' }}>{eyeAltitudeKm} km</strong></span>
        <span>ZOOM: <strong style={{ color: '#00f0ff' }}>{typeof currentZoom === 'number' ? (Number.isInteger(currentZoom) ? currentZoom : currentZoom.toFixed(1)) : currentZoom} / 19</strong></span>
        <span>GPS: <strong style={{ color: '#f1f5f9' }}>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong></span>
      </div>
    </div>
  )
}
