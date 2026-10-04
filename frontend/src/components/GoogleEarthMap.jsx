import { useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default leaflet marker icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom High-Tech Markers
const createPulseIcon = (emoji, color, label) => {
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
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 0 16px ${color}, 0 0 30px ${color}88;
        border: 2px solid #ffffff;
      ">${emoji}</div>
      <div style="
        background: rgba(3, 7, 18, 0.85);
        color: #f1f5f9;
        font-size: 9px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        margin-top: 3px;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      ">${label}</div>
    </div>`,
    iconSize: [40, 56],
    iconAnchor: [20, 28],
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
  hospitals = [],
  shelters = [],
  disasterType = 'cyclone',
  liveEvents = [],
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
    // Zoom 19 is ~0.2 km, Zoom 12 is ~15 km, Zoom 3 is ~4,000 km
    const base = 40000 / Math.pow(2, currentZoom - 1)
    return base >= 10 ? Math.round(base) : base.toFixed(1)
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
      mapRef.current.flyTo([lat, lng], 4, { duration: 2.8 })
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const epicenterIcon = useMemo(() => createPulseIcon('⚠️', '#ef4444', 'EPICENTER'), [])

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
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
        inertia={true}
        inertiaDeceleration={3000}
        style={{ height: '100%', width: '100%', background: '#030712' }}
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
          />
        )}

        {/* 2. Hybrid Mode: ESRI Satellite + Borders & Place Names */}
        {mapLayer === 'hybrid' && (
          <>
            <TileLayer
              attribution='&copy; ESRI World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              attribution='&copy; ESRI Reference'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </>
        )}

        {/* 3. Tactical Dark Matter */}
        {mapLayer === 'tactical' && (
          <TileLayer
            attribution='&copy; CARTO Dark Matter'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
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
        <Marker position={[lat, lng]} icon={epicenterIcon}>
          <Popup>
            <div style={{ color: '#0f172a', padding: '4px' }}>
              <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '13px' }}>🚨 DISASTER EPICENTER</div>
              <div style={{ marginTop: '4px' }}><strong>Type:</strong> {disasterType.toUpperCase()}</div>
              <div><strong>GPS:</strong> {lat.toFixed(4)}°N, {lng.toFixed(4)}°E</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Impact zone active. Coordinated emergency response deployed.</div>
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
              icon={createPulseIcon('🏥', '#10b981', h.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '4px' }}>
                  <div style={{ fontWeight: '800', color: '#10b981', fontSize: '13px' }}>🏥 {h.name}</div>
                  <div style={{ marginTop: '4px' }}><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: '700' }}>{h.status}</span></div>
                  <div><strong>Surge Beds Available:</strong> <span style={{ color: '#0284c7', fontWeight: '800', fontSize: '13px' }}>{h.beds_available}</span> / {h.total_beds || 'N/A'}</div>
                  <div><strong>Trauma Certified:</strong> {h.trauma_center ? '✅ Yes (Apex Center)' : 'Standard'}</div>
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
              icon={createPulseIcon('🏠', '#3b82f6', s.name.split(' ')[0])}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '4px' }}>
                  <div style={{ fontWeight: '800', color: '#2563eb', fontSize: '13px' }}>🏠 {s.name}</div>
                  <div style={{ marginTop: '4px' }}><strong>Safe Capacity:</strong> <strong>{s.capacity.toLocaleString()}</strong> persons</div>
                  <div><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>{s.status}</span></div>
                  <div><strong>Facilities:</strong> {(s.facilities || []).join(', ')}</div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
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
            fontWeight: '700',
            color: mapLayer === 'hybrid' ? '#00f0ff' : '#94a3b8',
            background: mapLayer === 'hybrid' ? 'rgba(0,240,255,0.2)' : 'transparent',
            borderColor: mapLayer === 'hybrid' ? '#00f0ff' : 'transparent',
          }}
        >
          🛰️ SATELLITE (EARTH)
        </button>
        <button
          onClick={() => setMapLayer('tactical')}
          className="severity-btn"
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: '700',
            color: mapLayer === 'tactical' ? '#00f0ff' : '#94a3b8',
            background: mapLayer === 'tactical' ? 'rgba(0,240,255,0.2)' : 'transparent',
            borderColor: mapLayer === 'tactical' ? '#00f0ff' : 'transparent',
          }}
        >
          🕶️ TACTICAL DARK
        </button>
        <button
          onClick={toggleFullscreen}
          className="severity-btn"
          style={{ padding: '5px 8px', fontSize: '11px', color: '#f1f5f9' }}
          title="Toggle Expanded View"
        >
          {isFullscreen ? '🗗 COLLAPSE' : '⛶ EXPAND'}
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
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '700', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
        >
          🎯 FOCUS EPICENTER
        </button>
        <button
          onClick={flyToStreetLevel}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '700', color: '#00f0ff', borderColor: 'rgba(0,240,255,0.4)' }}
        >
          🏙️ STREET LEVEL (ZOOM 16)
        </button>
        <button
          onClick={flyToAllAssets}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '700', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
        >
          🌐 FIT ALL ASSETS ({hospitals.length + shelters.length})
        </button>
        <button
          onClick={flyToGlobalOrbit}
          className="severity-btn"
          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '700', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)' }}
        >
          🌍 GLOBAL ORBIT
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
        <span>ZOOM: <strong style={{ color: '#00f0ff' }}>{currentZoom} / 19</strong></span>
        <span>GPS: <strong style={{ color: '#f1f5f9' }}>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong></span>
      </div>
    </div>
  )
}
