import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default leaflet marker icon issues in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom SVG Icons
const createCustomIcon = (emoji, color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 0 12px ${color};
      border: 2px solid white;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const epicenterIcon = createCustomIcon('⚠️', '#ef4444')
const hospitalIcon = createCustomIcon('🏥', '#10b981')
const shelterIcon = createCustomIcon('🏠', '#3b82f6')

export default function TacticalMap({ coordinates, hospitals = [], shelters = [], disasterType = 'cyclone' }) {
  const lat = coordinates?.lat ?? 20.2724
  const lng = coordinates?.lng ?? 85.8338

  return (
    <div style={{ height: '340px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.25)', position: 'relative' }}>
      <MapContainer
        key={`${lat}-${lng}`}
        center={[lat, lng]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#0b132b' }}
      >
        {/* Dark Mode CartoDB TileLayer for high-tech aesthetics */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Epicenter Marker */}
        <Marker position={[lat, lng]} icon={epicenterIcon}>
          <Popup>
            <div style={{ color: '#0f172a' }}>
              <strong>Disaster Epicenter</strong>
              <div>Type: {disasterType.toUpperCase()}</div>
              <div>Coords: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
            </div>
          </Popup>
        </Marker>

        {/* High Risk Impact Zone Radius */}
        <Circle
          center={[lat, lng]}
          radius={12000}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.18,
            dashArray: '6, 6',
          }}
        />

        {/* Outer Warning Buffer Radius */}
        <Circle
          center={[lat, lng]}
          radius={25000}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.08,
            dashArray: '4, 8',
          }}
        />

        {/* Verified Real Hospitals */}
        {hospitals.map((h, i) => (
          h.lat && h.lng && (
            <Marker key={i} position={[h.lat, h.lng]} icon={hospitalIcon}>
              <Popup>
                <div style={{ color: '#0f172a' }}>
                  <strong>{h.name}</strong>
                  <div>Status: {h.status}</div>
                  <div>Surge Beds Available: <strong>{h.beds_available}</strong></div>
                  <div>Trauma Center: {h.trauma_center ? '✅ Certified' : 'No'}</div>
                  <div>Distance: {h.distance_km} km</div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Verified Shelters */}
        {shelters.map((s, i) => (
          s.lat && s.lng && (
            <Marker key={i} position={[s.lat, s.lng]} icon={shelterIcon}>
              <Popup>
                <div style={{ color: '#0f172a' }}>
                  <strong>{s.name}</strong>
                  <div>Capacity: {s.capacity} persons</div>
                  <div>Status: {s.status}</div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Floating Tactical Overlay Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#00f0ff',
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span>🛰️ REAL-TIME GIS MAP LAYER</span>
      </div>
    </div>
  )
}
