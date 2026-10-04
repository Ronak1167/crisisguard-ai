import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  Wind,
  Waves,
  Activity,
  Mountain,
  Sun,
  Flame,
  Sliders,
  MapPin,
  FileText,
  Satellite,
  Compass,
  Radio,
  ShieldCheck,
  UserCheck,
  Zap,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Smartphone,
  Building2,
  Home,
  Check,
  ChevronRight,
  Terminal,
  Loader2,
  Send,
  Siren,
  Globe,
  LifeBuoy,
  Landmark,
  FileSearch,
  Copy,
  Download,
  Navigation,
  Volume2,
  Share2,
  CheckCheck,
} from 'lucide-react'
import './index.css'

import GoogleEarthMap from './components/GoogleEarthMap'
import TiltCard from './components/TiltCard'
import LiveDisasterTicker from './components/LiveDisasterTicker'
import AgencyDispatchModal from './components/AgencyDispatchModal'

const API_BASE = 'http://localhost:8000'

const DISASTER_TYPES = [
  { id: 'cyclone', label: 'Cyclone', icon: Wind },
  { id: 'flood', label: 'Flood', icon: Waves },
  { id: 'earthquake', label: 'Earthquake', icon: Activity },
  { id: 'landslide', label: 'Landslide', icon: Mountain },
  { id: 'drought', label: 'Drought', icon: Sun },
  { id: 'heatwave', label: 'Heat Wave', icon: Flame },
]

const SAMPLE_SCENARIOS = [
  // AMERICAS
  {
    icon: Wind,
    title: 'Category 5 Hurricane Milton — Miami & South Florida',
    type: 'cyclone',
    location: 'Miami, Florida, USA',
    severity: 'CRITICAL',
    desc: 'Catastrophic hurricane landfall with 165 mph winds, 15 ft storm surge inundating South Florida, critical power grid failure, mass coastal evacuations.',
    region: 'AMERICAS',
    coords: { lat: 25.7617, lng: -80.1918 },
  },
  {
    icon: Flame,
    title: 'Extreme Wildfire WUI — Los Angeles Foothills',
    type: 'heatwave',
    location: 'Los Angeles, California, USA',
    severity: 'HIGH',
    desc: 'Santa Ana wind-driven wildfire consuming 45,000 acres, threatening 12,000 suburban structures and critical infrastructure.',
    region: 'AMERICAS',
    coords: { lat: 34.0522, lng: -118.2437 },
  },
  // ASIA-PACIFIC
  {
    icon: Activity,
    title: 'Nankai Trough Megaquake & Tsunami — Tokyo Bay',
    type: 'earthquake',
    location: 'Tokyo, Japan',
    severity: 'CRITICAL',
    desc: 'Magnitude 8.4 subduction megathrust earthquake followed by a 10m tsunami alert across Greater Tokyo, Kanagawa, and Chiba coastal industrial corridors.',
    region: 'ASIA-PACIFIC',
    coords: { lat: 35.6762, lng: 139.6503 },
  },
  {
    icon: Mountain,
    title: 'Subduction Rupture & Landslides — Hualien',
    type: 'earthquake',
    location: 'Hualien City, Taiwan',
    severity: 'CRITICAL',
    desc: 'M7.4 earthquake striking eastern Taiwan. Taroko Gorge highway collapse, building tilts, multi-structure entrapment, extensive rockfalls.',
    region: 'ASIA-PACIFIC',
    coords: { lat: 23.9871, lng: 121.6015 },
  },
  // EUROPE
  {
    icon: Waves,
    title: 'Catastrophic Flash Flood DANA — Valencia',
    type: 'flood',
    location: 'Valencia, Spain',
    severity: 'CRITICAL',
    desc: 'Historic isolated high-altitude depression (DANA) dumping 490mm rain in 8 hours. Massive flash flooding, urban inundation, bridge collapses.',
    region: 'EUROPE',
    coords: { lat: 39.4699, lng: -0.3763 },
  },
  // INDIA
  {
    icon: Wind,
    title: 'Super Cyclone Scenario — Coastal Odisha',
    type: 'cyclone',
    location: 'Bhubaneswar, Odisha',
    severity: 'CRITICAL',
    desc: 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge and coastal inundation expected.',
    region: 'INDIA',
    coords: { lat: 20.2961, lng: 85.8245 },
  },
  {
    icon: Waves,
    title: 'Monsoon Flood & Landslide — Wayanad',
    type: 'flood',
    location: 'Wayanad, Kerala',
    severity: 'HIGH',
    desc: 'Heavy monsoon cloudburst causing massive flash flooding and catastrophic landslides in Meppadi and Chooralmala.',
    region: 'INDIA',
    coords: { lat: 11.6854, lng: 76.1320 },
  },
  {
    icon: Activity,
    title: 'Earthquake & Urban Collapse — Delhi NCR',
    type: 'earthquake',
    location: 'New Delhi, Delhi',
    severity: 'HIGH',
    desc: 'Magnitude 6.2 earthquake strikes Delhi NCR. Dense high-rise settlement structural collapse risks and multiple aftershocks reported.',
    region: 'INDIA',
    coords: { lat: 28.6139, lng: 77.2090 },
  },
]

// Optional subtle audio ping using Web Audio API for agent events
function playTelemetryBeep(freq = 880) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.12)
  } catch {}
}

function AgentTracePanel({ events }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [events])

  const getAgentIcon = (agentName) => {
    if (!agentName) return <Terminal size={13} color="#38bdf8" />
    if (agentName.includes('Intelligence')) return <Compass size={13} color="#38bdf8" />
    if (agentName.includes('Resource')) return <Building2 size={13} color="#10b981" />
    if (agentName.includes('Communication')) return <Radio size={13} color="#f59e0b" />
    if (agentName.includes('Response')) return <ShieldCheck size={13} color="#a855f7" />
    return <Cpu size={13} color="#94a3b8" />
  }

  return (
    <div className="agent-trace-panel" ref={scrollRef}>
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Terminal size={14} className="icon" />
        INCIDENT COMMAND MULTI-AGENT EXECUTION LOG
        {events.length > 0 && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>{events.length} AGENT ACTIONS</span>}
      </div>
      {events.length === 0 ? (
        <div className="trace-empty">
          <Cpu size={32} style={{ color: '#38bdf8', opacity: 0.6 }} />
          <span>Incident Command System Standing By...</span>
          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Select a disaster incident or global hazard to view autonomous multi-agent coordination</span>
        </div>
      ) : (
        events.map((event, i) => (
          <motion.div
            key={i}
            className={`trace-event event-${event.event_type}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="trace-agent-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getAgentIcon(event.agent)}
            </span>
            <span className="trace-agent-name">{event.agent}</span>
            <span className="trace-message">{event.message}</span>
            <span className="trace-time">{new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </motion.div>
        ))
      )}
    </div>
  )
}

function IntelligenceCard({ data }) {
  const cls = data?.disaster_classification || {}
  const impact = data?.impact_assessment || {}
  const coords = data?.coordinates || {}
  const wx = data?.real_time_telemetry || {}
  const severityClass = { CRITICAL: 'critical', HIGH: 'high', MODERATE: 'moderate', LOW: 'good' }[cls.severity_label] || 'good'

  return (
    <TiltCard>
      <div className={`result-card ${severityClass}`} style={{ height: '100%' }}>
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={18} color="#ef4444" />
          </div>
          <div>
            <div className="result-card-title">Intelligence Assessment</div>
            <div className="result-card-subtitle">Real GIS & Threat Telemetry</div>
          </div>
          <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{cls.severity_label}</span>
        </div>

        {coords.lat && (
          <div style={{ background: 'rgba(0, 240, 255, 0.06)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#00f0ff', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={12} /> Epicenter GPS:</span>
            <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E</span>
          </div>
        )}

        <div className="metric-row">
          <span className="metric-label">Severity Score</span>
          <span className="metric-value critical">{cls.severity_score}/10</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Classification</span>
          <span className="metric-value">{cls.category}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Population at Risk</span>
          <span className="metric-value critical">{(impact.estimated_population_at_risk || 0).toLocaleString()}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Live Wind Velocity</span>
          <span className="metric-value" style={{ color: '#38bdf8' }}>{wx.wind_speed_kmh || 48} km/h</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Surface Temperature</span>
          <span className="metric-value">{wx.temperature_c ? `${wx.temperature_c}°C` : '29°C'}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Affected Area</span>
          <span className="metric-value">{(impact.estimated_affected_area_km2 || 0).toLocaleString()} km²</span>
        </div>

        <div style={{ marginTop: '12px', background: 'rgba(3,7,18,0.6)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {data.intelligence_summary}
        </div>
        <div style={{ marginTop: '10px' }}>
          {(data.key_risks || []).slice(0, 3).map((r, i) => (
            <span key={i} className="badge badge-red" style={{ margin: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={11} /> {r}
            </span>
          ))}
        </div>
      </div>
    </TiltCard>
  )
}

function ResourceCard({ data, onOpenDispatch, onLocate }) {
  const [activeTab, setActiveTab] = useState('hospitals')
  const [dispatchedMap, setDispatchedMap] = useState({})

  // Reset dispatched units when emergency dataset changes
  useEffect(() => {
    setDispatchedMap({})
  }, [data])

  const hospitals = data?.hospitals || []
  const fireStations = data?.fire_stations || []
  const policeStations = data?.police_stations || []
  const rescueBases = data?.rescue_bases || []
  const investigationUnits = data?.investigation_units || []
  const shelters = data?.shelters || []

  const totalBeds = hospitals.reduce((s, h) => s + (h.beds_available || 0), 0)
  const totalTenders = fireStations.reduce((s, f) => s + (f.tenders || 0), 0)
  const totalPumps = fireStations.reduce((s, f) => s + (f.dewatering_pumps || 0), 0)
  const totalOfficers = policeStations.reduce((s, p) => s + (p.officers || 0), 0)
  const totalRescuePersonnel = rescueBases.reduce((s, r) => s + (r.personnel || 0), 0)
  const totalShelterCap = shelters.reduce((s, sh) => s + (sh.capacity || 0), 0)

  const handleFacilityDispatch = (facilityName, agencyKey) => {
    setDispatchedMap(prev => ({ ...prev, [facilityName]: true }))
    playTelemetryBeep(1318)
    onOpenDispatch?.(agencyKey)
  }

  const renderFacilityActions = (facility, agencyKey, color = 'green') => {
    const isDispatched = !!dispatchedMap[facility.name]
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => {
            if (facility.lat && facility.lng) {
              onLocate?.({ lat: facility.lat, lng: facility.lng, name: facility.name })
            }
          }}
          className="badge"
          style={{
            border: '1px solid rgba(0, 240, 255, 0.4)',
            background: 'rgba(0, 240, 255, 0.08)',
            color: '#00f0ff',
            cursor: 'pointer',
            padding: '3px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '9.5px',
            fontWeight: '700',
            borderRadius: '4px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          title="Locate on Geospatial 3D Map"
        >
          <Navigation size={9} /> LOCATE
        </button>

        <button
          type="button"
          onClick={() => handleFacilityDispatch(facility.name, agencyKey)}
          className={`badge badge-${isDispatched ? 'green' : color}`}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '3px 7px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '9.5px',
            fontWeight: '700',
            borderRadius: '4px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          title={isDispatched ? `${facility.name} dispatched. Click to open dispatch console and re-transmit orders.` : `Open multi-agency dispatch console for ${facility.name}`}
        >
          {isDispatched ? (
            <>
              <Check size={9} /> DISPATCHED ↻
            </>
          ) : (
            <>
              <Send size={9} /> DISPATCH
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <TiltCard>
      <div className="result-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Card Header */}
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color="#3b82f6" />
          </div>
          <div>
            <div className="result-card-title">Inter-Agency Emergency Infrastructure</div>
            <div className="result-card-subtitle">Verified Multi-Cadre Public Safety & Healthcare Mesh</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: data?.resource_adequacy_score >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
              {data?.resource_adequacy_score || 82}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Adequacy</div>
          </div>
        </div>

        {/* Global Summary Metric Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', padding: '6px 8px' }}>
            <div style={{ fontSize: '9px', color: '#10b981', fontWeight: '700', letterSpacing: '0.04em' }}>SURGE BEDS</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{totalBeds.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '6px', padding: '6px 8px' }}>
            <div style={{ fontSize: '9px', color: '#f97316', fontWeight: '700', letterSpacing: '0.04em' }}>FIRE TENDERS / PUMPS</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fb923c', fontFamily: 'var(--font-mono)' }}>{totalTenders} / {totalPumps}</div>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '6px', padding: '6px 8px' }}>
            <div style={{ fontSize: '9px', color: '#3b82f6', fontWeight: '700', letterSpacing: '0.04em' }}>POLICE CORDON SQUAD</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{totalOfficers} officers</div>
          </div>
        </div>

        {/* Department Tab Selector */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '10px' }}>
          {[
            { id: 'hospitals', label: `Hospitals (${hospitals.length})`, icon: Building2, color: '#10b981' },
            { id: 'fire', label: `Fire & HazMat (${fireStations.length})`, icon: Flame, color: '#f97316' },
            { id: 'police', label: `Police & Cordon (${policeStations.length})`, icon: ShieldCheck, color: '#3b82f6' },
            { id: 'rescue', label: `USAR Rescue (${rescueBases.length})`, icon: LifeBuoy, color: '#eab308' },
            { id: 'inquest', label: `Civil Defense & EOC (${investigationUnits.length})`, icon: Landmark, color: '#a855f7' },
            { id: 'shelters', label: `Shelters (${shelters.length})`, icon: Home, color: '#06b6d4' },
          ].map(tab => {
            const IconComp = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? `1px solid ${tab.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? `${tab.color}22` : 'rgba(15, 23, 42, 0.6)',
                  color: isActive ? tab.color : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                <IconComp size={12} color={isActive ? tab.color : '#94a3b8'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab 1: Hospitals */}
        {activeTab === 'hospitals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {hospitals.map((h, i) => (
              <div key={i} className="task-item" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="badge badge-blue" style={{ flexShrink: 0, fontSize: '9px', padding: '2px 5px' }}>{h.trauma_center ? 'Apex Trauma' : 'General'}</span>
                <div className="task-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div className="task-name" style={{ fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.name}>{h.name}</div>
                  <div className="task-meta" style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.beds_available} surge beds ({h.icu_beds_available || 15} ICU) · {h.distance_km} km away
                  </div>
                </div>
                {renderFacilityActions(h, 'medical_health', 'green')}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Fire Stations */}
        {activeTab === 'fire' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {fireStations.map((f, i) => (
              <div key={i} className="task-item" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="badge badge-orange" style={{ flexShrink: 0, fontSize: '9px', padding: '2px 5px' }}>{f.tenders} Tenders</span>
                <div className="task-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div className="task-name" style={{ fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.name}>{f.name}</div>
                  <div className="task-meta" style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.dewatering_pumps} dewatering pumps · {f.personnel} firefighters · {f.distance_km} km away
                  </div>
                </div>
                {renderFacilityActions(f, 'fire_service', 'orange')}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Police Stations */}
        {activeTab === 'police' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {policeStations.map((p, i) => (
              <div key={i} className="task-item" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="badge badge-blue" style={{ flexShrink: 0, fontSize: '9px', padding: '2px 5px' }}>{p.green_corridor_squads} Corridors</span>
                <div className="task-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div className="task-name" style={{ fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.name}>{p.name}</div>
                  <div className="task-meta" style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.officers} mobilized officers · {p.patrol_vehicles} vehicles · {p.distance_km} km away
                  </div>
                </div>
                {renderFacilityActions(p, 'police_department', 'blue')}
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: USAR & Specialized Rescue */}
        {activeTab === 'rescue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {rescueBases.map((r, i) => (
              <div key={i} className="task-item" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="badge badge-yellow" style={{ flexShrink: 0, fontSize: '9px', padding: '2px 5px' }}>USAR Unit</span>
                <div className="task-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div className="task-name" style={{ fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.name}>{r.name}</div>
                  <div className="task-meta" style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.personnel} operators · {(r.equipment || []).slice(0, 2).join(', ')} · {r.distance_km} km away
                  </div>
                </div>
                {renderFacilityActions(r, 'rescue_ndrf', 'yellow')}
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Civil Defense & EOC */}
        {activeTab === 'inquest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {investigationUnits.map((u, i) => (
              <div key={i} className="task-item" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="badge badge-purple" style={{ flexShrink: 0, fontSize: '9px', padding: '2px 5px' }}>Ops Command</span>
                <div className="task-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div className="task-name" style={{ fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.name}>{u.name}</div>
                  <div className="task-meta" style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.role} · {u.officers} coordinators · {u.distance_km} km away
                  </div>
                </div>
                {renderFacilityActions(u, 'investigation_forensic', 'purple')}
              </div>
            ))}
          </div>
        )}

        {/* Tab 6: Shelters */}
        {activeTab === 'shelters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {shelters.map((s, i) => (
              <div key={i} className="task-item" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span className="badge badge-blue" style={{ flexShrink: 0, fontSize: '9px', padding: '2px 5px' }}>Cap: {s.capacity.toLocaleString()}</span>
                <div className="task-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div className="task-name" style={{ fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.name}>{s.name}</div>
                  <div className="task-meta" style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(s.facilities || []).slice(0, 2).join(', ')} · {s.distance_km || 3.5} km away
                  </div>
                </div>
                {renderFacilityActions(s, 'district_administration', 'blue')}
              </div>
            ))}
          </div>
        )}

        {/* Critical Gaps Alert */}
        {(data?.critical_gaps || []).length > 0 && (
          <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={12} /> CRITICAL DEFICITS IDENTIFIED
            </div>
            {data.critical_gaps.map((g, i) => <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {g}</div>)}
          </div>
        )}

        {/* Master Dispatch Directive Trigger Button */}
        {onOpenDispatch && (
          <button
            onClick={() => onOpenDispatch()}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '9px 12px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(249,115,22,0.25) 100%)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              letterSpacing: '0.04em',
            }}
          >
            <Send size={13} />
            SEND ROLE-TAILORED RESCUE DIRECTIVE TO ALL CADRES
          </button>
        )}
      </div>
    </TiltCard>
  )
}

function AlertCard({ data }) {
  const [lang, setLang] = useState('english')
  const [copiedBroadcast, setCopiedBroadcast] = useState(false)
  const [copiedSms, setCopiedSms] = useState(false)
  const [cellBroadcastSent, setCellBroadcastSent] = useState(false)
  const [helplineToast, setHelplineToast] = useState(null)

  const publicAlert = data?.public_alert || {}
  const langKeyMap = {
    english: 'primary',
    hindi: 'secondary',
    regional: 'tertiary',
  }
  const langLabels = data?.language_meta?.lang_labels || {}
  const getTabLabel = (l) => {
    const metaKey = langKeyMap[l]
    if (langLabels[metaKey]) return langLabels[metaKey]
    if (langLabels[l]) return langLabels[l]
    return l === 'english' ? 'EN (PRIMARY)' : l === 'hindi' ? 'REGIONAL / SECONDARY' : 'EAS / CELL BROADCAST'
  }

  const handleCopyBroadcast = () => {
    const text = publicAlert[lang] || 'Emergency broadcast active.'
    navigator.clipboard?.writeText(text)
    setCopiedBroadcast(true)
    playTelemetryBeep(1200)
    setTimeout(() => setCopiedBroadcast(false), 2200)
  }

  const handleCopySms = () => {
    const text = data?.sms_alert?.english || 'ALERT: Evacuate immediately.'
    navigator.clipboard?.writeText(text)
    setCopiedSms(true)
    playTelemetryBeep(1200)
    setTimeout(() => setCopiedSms(false), 2200)
  }

  const handleCellBroadcast = () => {
    setCellBroadcastSent(true)
    playTelemetryBeep(1760) // High urgency alert tone
    setTimeout(() => playTelemetryBeep(880), 120)
    setTimeout(() => setCellBroadcastSent(false), 5000)
  }

  const handleHelplineClick = (k, v) => {
    navigator.clipboard?.writeText(v)
    setHelplineToast(`${k.toUpperCase()}: ${v} copied`)
    playTelemetryBeep(1046)
    setTimeout(() => setHelplineToast(null), 2500)
  }

  return (
    <TiltCard>
      <div className="result-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={18} color="#eab308" />
          </div>
          <div>
            <div className="result-card-title">Emergency Communications</div>
            <div className="result-card-subtitle">Multilingual Broadcast & CAP v1.2 Engine</div>
          </div>
          <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{data?.official_communication?.priority || 'URGENT'}</span>
        </div>

        {/* Dynamic Regional Language Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {['english', 'hindi', 'regional'].map(l => (
            <button
              key={l}
              onClick={() => { setLang(l); playTelemetryBeep(980); }}
              className="severity-btn"
              data-level={l === lang ? 'CRITICAL' : ''}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {getTabLabel(l)}
            </button>
          ))}
        </div>

        {/* Broadcast Text Box with Action Controls */}
        <div style={{ position: 'relative' }}>
          <div className={`alert-box ${lang}`} style={{ minHeight: '90px', paddingRight: '48px' }}>
            {publicAlert[lang] || 'Emergency broadcast active for this region.'}
          </div>
          <button
            onClick={handleCopyBroadcast}
            title="Copy Public Alert"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: copiedBroadcast ? '#10b981' : '#e2e8f0',
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontWeight: '600',
            }}
          >
            {copiedBroadcast ? <CheckCheck size={12} color="#10b981" /> : <Copy size={12} />}
            {copiedBroadcast ? 'COPIED' : 'COPY'}
          </button>
        </div>

        {/* SMS Broadcast Box with Action Controls */}
        <div style={{ marginTop: '10px' }}>
          <div className="alert-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={13} /> 160-Char Emergency SMS Broadcast
            </span>
            <button
              onClick={handleCopySms}
              style={{
                background: 'none',
                border: 'none',
                color: copiedSms ? '#10b981' : 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: 0,
              }}
            >
              {copiedSms ? <Check size={11} /> : <Copy size={11} />}
              {copiedSms ? 'COPIED' : 'COPY SMS'}
            </button>
          </div>
          <div className="alert-box" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.02em', background: 'rgba(0,0,0,0.5)', marginTop: '4px' }}>
            {data?.sms_alert?.english || 'ALERT: Evacuate immediately to designated civil shelter.'}
          </div>
        </div>

        {/* Cell Broadcast / EAS Emergency Alert Button */}
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            onClick={handleCellBroadcast}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: cellBroadcastSent
                ? 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(6,182,212,0.2) 100%)'
                : 'linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(249,115,22,0.2) 100%)',
              border: cellBroadcastSent ? '1px solid #10b981' : '1px solid rgba(234,179,8,0.4)',
              color: cellBroadcastSent ? '#34d399' : '#fde047',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              letterSpacing: '0.03em',
              transition: 'all 0.2s ease',
            }}
          >
            {cellBroadcastSent ? (
              <>
                <CheckCheck size={14} color="#34d399" />
                ✓ BROADCAST TRANSMITTED ACROSS CELL TOWERS (WEA / CAP v1.2)
              </>
            ) : (
              <>
                <Siren size={14} />
                TRANSMIT CELL BROADCAST TO ALL TOWER SECTORS (WEA / EAS)
              </>
            )}
          </button>
        </div>

        {/* Emergency Helplines (Click-to-call / Click-to-copy) */}
        <div style={{ marginTop: '10px' }}>
          <div className="alert-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} /> Emergency Helplines (Click to Call / Copy)
            </span>
            {helplineToast && (
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>{helplineToast}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            {Object.entries(data?.media_advisory?.key_numbers || {}).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => handleHelplineClick(k, v)}
                className="badge badge-blue"
                title={`Call or copy ${k}: ${v}`}
                style={{
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  background: 'rgba(56, 189, 248, 0.1)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '4px',
                }}
              >
                <Phone size={10} color="#38bdf8" />
                <span>{k.toUpperCase()}: <strong style={{ color: '#ffffff' }}>{v}</strong></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </TiltCard>
  )
}

function ResponsePlanCard({ data }) {
  const [taskStatus, setTaskStatus] = useState({})
  const [allDeployed, setAllDeployed] = useState(false)
  const [exported, setExported] = useState(false)

  const priorityTasks = data?.priority_tasks || []

  const toggleTask = (index) => {
    playTelemetryBeep(1100)
    setTaskStatus(prev => {
      const current = prev[index] || 'pending'
      const next = current === 'pending' ? 'in_progress' : current === 'in_progress' ? 'completed' : 'pending'
      return { ...prev, [index]: next }
    })
  }

  const handleDeployAll = () => {
    playTelemetryBeep(1400)
    const newStatus = {}
    priorityTasks.forEach((_, i) => {
      newStatus[i] = 'in_progress'
    })
    setTaskStatus(newStatus)
    setAllDeployed(true)
    setTimeout(() => setAllDeployed(false), 4000)
  }

  const handleExportPlan = () => {
    playTelemetryBeep(1200)
    const planText = `
CRISISGUARD AI — INCIDENT ACTION PLAN (ICS-201)
OPERATIONAL ALERT LEVEL: ${data?.operational_status?.alert_level || 'RED'}
ESTIMATED LIVES AT RISK: ${(data?.estimated_lives_at_risk || 0).toLocaleString()}
ESTIMATED LIVES PROTECTED: ${(data?.lives_potentially_saved_with_plan || 0).toLocaleString()}
INCIDENT COMMANDER DIRECTIVE:
${data?.commander_briefing || 'N/A'}

PRIORITY ACTION MATRIX:
${priorityTasks.map(t => `[P${t.priority}] ${t.task} — Assigned: ${t.responsible} | Deadline: ${t.deadline}`).join('\n')}
    `.trim()

    navigator.clipboard?.writeText(planText)
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  return (
    <TiltCard style={{ gridColumn: 'span 2' }}>
      <div className="result-card" style={{ height: '100%' }}>
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#a855f7" />
          </div>
          <div>
            <div className="result-card-title">Response Operations Playbook</div>
            <div className="result-card-subtitle">Prioritized Multi-Track Incident Command System (ICS-201)</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={`badge badge-${data?.operational_status?.alert_level === 'RED' ? 'red' : 'orange'}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="live-indicator" style={{ background: '#ef4444' }} /> {data?.operational_status?.alert_level || 'RED ALERT'}
            </span>
            <span className="badge badge-green">{data?.overall_response_score || 78}% Effectiveness</span>
          </div>
        </div>

        {/* Commander briefing */}
        <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', letterSpacing: '0.04em' }}>
            <ShieldAlert size={13} /> INCIDENT COMMANDER DIRECTIVE
          </span>
          {data?.commander_briefing}
        </div>

        {/* Lives impact */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>{(data?.estimated_lives_at_risk || 0).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lives at Risk</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{(data?.lives_potentially_saved_with_plan || 0).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Lives Protected</div>
          </div>
        </div>

        {/* Priority Action Matrix Header with Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} className="icon" /> PRIORITY ACTION MATRIX
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleDeployAll}
              className="badge"
              style={{
                border: '1px solid #10b981',
                background: allDeployed ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.12)',
                color: '#34d399',
                padding: '5px 9px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {allDeployed ? <CheckCheck size={12} /> : <Zap size={12} />}
              {allDeployed ? 'ALL TASKS DISPATCHED' : 'DEPLOY ALL ICS DIRECTIVES'}
            </button>

            <button
              type="button"
              onClick={handleExportPlan}
              className="badge"
              style={{
                border: '1px solid rgba(0,240,255,0.4)',
                background: exported ? 'rgba(0,240,255,0.25)' : 'rgba(0,240,255,0.08)',
                color: '#00f0ff',
                padding: '5px 9px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {exported ? <Check size={12} /> : <Download size={12} />}
              {exported ? 'COPIED TO CLIPBOARD' : 'EXPORT ICS-201 PLAN'}
            </button>
          </div>
        </div>

        {/* Priority Tasks with Clickable State Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {priorityTasks.map((task, i) => {
            const status = taskStatus[i] || 'pending'
            return (
              <div
                key={i}
                className="task-item"
                onClick={() => toggleTask(i)}
                style={{
                  cursor: 'pointer',
                  border: status === 'completed'
                    ? '1px solid rgba(16,185,129,0.4)'
                    : status === 'in_progress'
                    ? '1px solid rgba(234,179,8,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: status === 'completed'
                    ? 'rgba(16,185,129,0.06)'
                    : status === 'in_progress'
                    ? 'rgba(234,179,8,0.06)'
                    : 'rgba(15,23,42,0.5)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div className="task-priority" style={{ fontFamily: 'var(--font-mono)' }}>
                  {task.priority}
                </div>
                <div className="task-content">
                  <div className="task-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ textDecoration: status === 'completed' ? 'line-through' : 'none' }}>
                      {task.task}
                    </span>
                  </div>
                  <div className="task-meta">{task.responsible} · Deadline: {task.deadline}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`badge badge-${task.priority <= 2 ? 'red' : task.priority <= 3 ? 'orange' : 'blue'}`}>
                    {task.priority <= 2 ? 'P1 CRITICAL' : task.priority <= 3 ? 'P2 HIGH' : 'P3 MEDIUM'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTask(i)
                    }}
                    className={`badge badge-${status === 'completed' ? 'green' : status === 'in_progress' ? 'yellow' : 'blue'}`}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '4px',
                    }}
                  >
                    {status === 'completed' ? (
                      <>
                        <Check size={11} /> VERIFIED
                      </>
                    ) : status === 'in_progress' ? (
                      <>
                        <Zap size={11} /> IN PROGRESS
                      </>
                    ) : (
                      <>
                        <Send size={11} /> DISPATCH
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </TiltCard>
  )
}

function HumanEscalationCard({ data }) {
  const [approved, setApproved] = useState({})
  const triggers = data?.human_escalation_triggers || []

  return (
    <TiltCard>
      <div className="result-card" style={{ height: '100%' }}>
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={18} color="#ef4444" />
          </div>
          <div>
            <div className="result-card-title">Human-in-the-Loop Gates</div>
            <div className="result-card-subtitle">Safety & Override Verification</div>
          </div>
        </div>
        {triggers.map((t, i) => (
          <div key={i} className="escalation-card">
            <div className="escalation-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={12} /> {approved[i] ? 'DECISION RECORDED' : 'PENDING HUMAN AUTHORIZATION'}
            </div>
            <div className="escalation-body">{t.trigger}</div>
            <div className="escalation-to">Escalate to: <strong>{t.escalate_to}</strong></div>
            {!approved[i] && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <button className="approve-btn" onClick={() => setApproved(a => ({ ...a, [i]: 'approved' }))} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={13} /> AUTHORIZE DISPATCH
                </button>
                <button className="override-btn" onClick={() => setApproved(a => ({ ...a, [i]: 'override' }))} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <XCircle size={13} /> OVERRIDE
                </button>
              </div>
            )}
            {approved[i] && (
              <span className={`badge badge-${approved[i] === 'approved' ? 'green' : 'red'}`} style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {approved[i] === 'approved' ? (
                  <><CheckCircle2 size={12} /> AUTHORIZED BY COMMANDER</>
                ) : (
                  <><XCircle size={12} /> OVERRIDDEN BY OPERATOR</>
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

export default function App() {
  const [disasterType, setDisasterType] = useState('cyclone')
  const [location, setLocation] = useState('Bhubaneswar, Odisha')
  const [severity, setSeverity] = useState('CRITICAL')
  const [description, setDescription] = useState('Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge expected.')
  const [isRunning, setIsRunning] = useState(false)
  const [events, setEvents] = useState([])
  const [results, setResults] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [viewMode, setViewMode] = useState('3d') // '3d' | '2d'
  const [activeCoords, setActiveCoords] = useState({ lat: 20.2724, lng: 85.8338 })
  const [liveTelemetry, setLiveTelemetry] = useState(null)
  const [liveHazards, setLiveHazards] = useState([])
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [dispatchInitialAgency, setDispatchInitialAgency] = useState('rescue_ndrf')
  const [scenarioFilter, setScenarioFilter] = useState('ALL')
  const [locateTarget, setLocateTarget] = useState(null)
  const wsRef = useRef(null)

  const handleOpenDispatch = (agencyKey = null) => {
    if (agencyKey) setDispatchInitialAgency(agencyKey)
    setShowDispatchModal(true)
  }

  // Fetch live hazards from NASA/USGS on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/live-disasters`)
      .then(res => res.json())
      .then(data => {
        if (data.events) setLiveHazards(data.events)
      })
      .catch(() => {})
  }, [])

  const connectWS = useCallback((sid) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${sid}`)
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        setEvents(prev => [...prev, event])
        playTelemetryBeep(event.event_type === 'start' ? 1046 : event.event_type === 'result' ? 1318 : 880)
      } catch {}
    }
    wsRef.current = ws
  }, [])

  const loadScenario = (scenario, autoRun = true) => {
    setDisasterType(scenario.type)
    setLocation(scenario.location)
    setSeverity(scenario.severity)
    setDescription(scenario.desc)

    const targetCoords = scenario.coords || (
      scenario.location.includes('Bhubaneswar') ? { lat: 20.2961, lng: 85.8245 } :
      scenario.location.includes('Wayanad') ? { lat: 11.6854, lng: 76.1320 } :
      scenario.location.includes('Delhi') ? { lat: 28.6139, lng: 77.2090 } :
      { lat: 20.2724, lng: 85.8338 }
    )
    setActiveCoords(targetCoords)
    playTelemetryBeep(1046)

    if (autoRun) {
      executeAnalysis({
        disasterType: scenario.type,
        location: scenario.location,
        severity: scenario.severity,
        description: scenario.desc,
        coordinates: targetCoords,
      })
    }
  }

  const handleSelectEpicenter = () => {
    const epicLocation = location || 'Bhubaneswar, Odisha'
    const epicType = disasterType || 'cyclone'
    const epicSeverity = severity || 'CRITICAL'
    const epicDesc = description || 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge expected.'
    const epicCoords = activeCoords || { lat: 20.2724, lng: 85.8338 }

    setLocation(epicLocation)
    setDisasterType(epicType)
    setSeverity(epicSeverity)
    setDescription(epicDesc)
    setActiveCoords(epicCoords)
    playTelemetryBeep(1200)

    // Auto-trigger analysis if not already running
    if (!isRunning) {
      executeAnalysis({
        disasterType: epicType,
        location: epicLocation,
        severity: epicSeverity,
        description: epicDesc,
        coordinates: epicCoords,
      })
    }
  }

  const handleSelectHazard = (ev, autoRun = true) => {
    let dtype = 'earthquake'
    if (ev.category === 'Wildfires') dtype = 'heatwave'
    else if (ev.title.includes('Typhoon') || ev.title.includes('Cyclone') || ev.title.includes('Storm')) dtype = 'cyclone'
    else if (ev.category === 'Floods') dtype = 'flood'

    const targetLoc = ev.title
    const targetSev = ev.severity || 'CRITICAL'
    const targetDesc = `Real-time active hazard reported by ${ev.source}. Lat: ${ev.lat}, Lng: ${ev.lng}. Immediate situational assessment required.`
    const targetCoords = { lat: ev.lat, lng: ev.lng }

    setDisasterType(dtype)
    setLocation(targetLoc)
    setSeverity(targetSev)
    setDescription(targetDesc)
    setActiveCoords(targetCoords)
    playTelemetryBeep(1046)

    if (autoRun) {
      executeAnalysis({
        disasterType: dtype,
        location: targetLoc,
        severity: targetSev,
        description: targetDesc,
        coordinates: targetCoords,
      })
    }
  }

  const executeAnalysis = async (customParams = null) => {
    const targetType = customParams?.disasterType || disasterType || 'cyclone'
    const targetLocation = customParams?.location || location || 'Bhubaneswar, Odisha'
    const targetSeverity = customParams?.severity || severity || 'CRITICAL'
    const targetDescription = customParams?.description || description || 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge expected.'
    const targetCoords = customParams?.coordinates || activeCoords

    if (isRunning) return
    setIsRunning(true)
    setEvents([])
    setResults(null)

    // Ensure form state is completely synchronized to the UI
    setDisasterType(targetType)
    setLocation(targetLocation)
    setSeverity(targetSeverity)
    setDescription(targetDescription)
    if (targetCoords) setActiveCoords(targetCoords)

    const sid = crypto.randomUUID()
    setSessionId(sid)
    connectWS(sid)

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disaster_type: targetType,
          location: targetLocation,
          severity: targetSeverity,
          description: targetDescription,
          session_id: sid,
          coordinates: targetCoords || null,
        }),
      })
      const data = await res.json()
      setResults(data.result)

      if (data.result?.intelligence?.coordinates) {
        setActiveCoords(data.result.intelligence.coordinates)
      }
      if (data.result?.intelligence?.real_time_telemetry) {
        setLiveTelemetry(data.result.intelligence.real_time_telemetry)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsRunning(false)
      if (wsRef.current) wsRef.current.close()
    }
  }

  const stats = results ? {
    pop: results.intelligence?.impact_assessment?.estimated_population_at_risk || 0,
    resources: (results.resources?.hospitals?.length || 0) + (results.resources?.shelters?.length || 0),
    tasks: results.response_plan?.priority_tasks?.length || 0,
    score: results.response_plan?.overall_response_score || 0,
  } : null

  return (
    <div className="app-container">
      {/* 1. Real-time Live Global Hazard Marquee (NASA EONET & USGS) */}
      <LiveDisasterTicker onSelectEvent={(ev) => handleSelectHazard(ev, true)} />

      {/* Header */}
      <header className="app-header" style={{
        backgroundImage: 'linear-gradient(180deg, rgba(3,7,18,0.88) 0%, rgba(3,7,18,0.96) 100%), url(/command_center_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div className="logo-group">
          <motion.div
            className="logo-icon"
            animate={{ rotate: isRunning ? [0, 360] : 0 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ShieldAlert size={22} color="#ffffff" />
          </motion.div>
          <div>
            <div className="app-title">CRISISGUARD AI</div>
            <div className="app-subtitle">Autonomous Emergency Operations & Multi-Agent Incident Coordination Platform</div>
          </div>
        </div>

        <div className="header-badges">
          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator" /> REAL-TIME SATELLITE & WEATHER FEEDS
          </span>
          <span className="badge badge-blue">NASA EONET & USGS SEISMIC FEEDS</span>
          <span className="badge badge-purple">4 SPECIALIZED RESPONSE AGENTS ONLINE</span>
        </div>
      </header>

      {/* Stats bar when results exist */}
      {stats && (
        <motion.div className="stats-bar" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="stat-item"
            style={{ cursor: 'pointer' }}
            title="Jump to GIS Threat & Intelligence Assessment"
            onClick={() => document.getElementById('card-intelligence')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="stat-value critical">{stats.pop.toLocaleString()}</div>
            <div className="stat-label">Population at Risk ↗</div>
          </div>
          <div
            className="stat-item"
            style={{ cursor: 'pointer' }}
            title="Jump to Verified Inter-Agency Infrastructure"
            onClick={() => document.getElementById('card-resources')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.resources}</div>
            <div className="stat-label">Verified Facilities Mapped ↗</div>
          </div>
          <div
            className="stat-item"
            style={{ cursor: 'pointer' }}
            title="Jump to Active ICS Priority Tasks"
            onClick={() => document.getElementById('card-response-plan')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{stats.tasks}</div>
            <div className="stat-label">Active ICS Tasks ↗</div>
          </div>
          <div
            className="stat-item"
            style={{ cursor: 'pointer' }}
            title="Jump to Human Authorization & Verification"
            onClick={() => document.getElementById('card-escalation')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.score}%</div>
            <div className="stat-label">Response Effectiveness ↗</div>
          </div>
        </motion.div>
      )}

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Panel - Command Inputs */}
        <div className="left-panel">
          <div>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} className="icon" /> INCIDENT CLASSIFICATION
            </div>
            <div className="disaster-grid">
              {DISASTER_TYPES.map(d => {
                const IconComponent = d.icon
                return (
                  <button
                    key={d.id}
                    className={`disaster-btn ${disasterType === d.id ? 'active' : ''}`}
                    onClick={() => setDisasterType(d.id)}
                  >
                    <IconComponent size={18} className="disaster-btn-icon" />
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-card">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="var(--accent-blue)" /> Incident Location / Epicenter
              </label>
              <input
                className="form-input"
                placeholder="e.g. Bhubaneswar, Odisha or coordinates"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={13} color="var(--accent-orange)" /> Threat Severity Classification
              </label>
              <div className="severity-selector">
                {['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map(s => (
                  <button
                    key={s}
                    className={`severity-btn ${severity === s ? 'active' : ''}`}
                    data-level={s}
                    onClick={() => setSeverity(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} color="var(--accent-cyan)" /> Situational Field Briefing
              </label>
              <textarea
                className="form-textarea"
                placeholder="Enter field reports, emergency dispatch observations..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <button
              className="submit-btn"
              onClick={() => executeAnalysis()}
              disabled={isRunning || !location || !description}
            >
              {isRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> COORDINATING RESPONSE AGENTS...
                </>
              ) : (
                <>
                  <Zap size={14} /> ACTIVATE INCIDENT RESPONSE & COORDINATION
                </>
              )}
            </button>
          </div>

          {/* Preset Sample Scenarios with Region Filter */}
          <div>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} className="icon" /> GLOBAL INCIDENT SCENARIOS
              </span>
              <span className="badge badge-blue" style={{ fontSize: '9px', padding: '2px 6px' }}>1-CLICK EXECUTE</span>
            </div>

            {/* Continent / Region Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {['ALL', 'GLOBAL', 'AMERICAS', 'ASIA-PACIFIC', 'EUROPE', 'INDIA'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setScenarioFilter(tab)}
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    border: scenarioFilter === tab ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.08)',
                    background: scenarioFilter === tab ? 'rgba(0, 240, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    color: scenarioFilter === tab ? '#00f0ff' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filtered Scenario List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SAMPLE_SCENARIOS
                .filter(s => {
                  if (scenarioFilter === 'ALL') return true
                  if (scenarioFilter === 'GLOBAL') return s.region !== 'INDIA'
                  return s.region === scenarioFilter
                })
                .map((s, i) => {
                  const IconComp = s.icon
                  return (
                    <motion.div
                      key={s.title}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="scenario-card"
                      onClick={() => loadScenario(s, true)}
                    >
                      <div className="scenario-icon-box">
                        <IconComp size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="scenario-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{s.title}</span>
                        </div>
                        <div className="scenario-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span className={`badge badge-${s.severity === 'CRITICAL' ? 'red' : 'orange'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {s.severity}
                          </span>
                          <span style={{ color: '#00f0ff', fontSize: '10px' }}>{s.region}</span>
                          <span style={{ color: '#94a3b8', fontSize: '10px' }}>· Click to launch</span>
                        </div>
                      </div>
                      <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                    </motion.div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Right Panel - Visual Telemetry & Agent Outputs */}
        <div className="right-panel">
          {/* Spatial Awareness Header with Map Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Satellite size={14} className="icon" /> GEOSPATIAL INCIDENT MAP & REAL-TIME ASSET TRACKING
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>Scroll Wheel / Drag / Double-Click to Zoom</span>
              <span className="badge badge-green">ESRI HIGH-RESOLUTION SATELLITE</span>
            </div>
          </div>

          {/* Interactive Google Earth Style Map */}
          <GoogleEarthMap
            coordinates={activeCoords}
            location={location}
            description={description}
            severity={severity}
            locateTarget={locateTarget}
            hospitals={results?.resources?.hospitals || []}
            shelters={results?.resources?.shelters || []}
            fireStations={results?.resources?.fire_stations || []}
            policeStations={results?.resources?.police_stations || []}
            rescueBases={results?.resources?.rescue_bases || []}
            investigationUnits={results?.resources?.investigation_units || []}
            disasterType={disasterType}
            liveEvents={liveHazards}
            results={results}
            liveTelemetry={liveTelemetry}
            isRunning={isRunning}
            onSelectEpicenter={handleSelectEpicenter}
            onSelectHazard={handleSelectHazard}
            onTriggerAnalysis={executeAnalysis}
            onOpenDispatch={handleOpenDispatch}
          />

          {/* Live Telemetry Banner */}
          {liveTelemetry && (
            <motion.div className="live-telemetry-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="telemetry-tag">
                <span className="live-indicator" />
                <span>ATMOSPHERIC STATUS:</span>
                <span className="telemetry-val">LIVE OBSERVATION STREAM</span>
              </div>
              <div className="telemetry-tag">
                <span>SURFACE TEMP:</span>
                <span className="telemetry-val">{liveTelemetry.temperature_c}°C</span>
              </div>
              <div className="telemetry-tag">
                <span>WIND SPEED:</span>
                <span className="telemetry-val">{liveTelemetry.wind_speed_kmh} km/h</span>
              </div>
              <div className="telemetry-tag">
                <span>DATA SOURCE:</span>
                <span className="telemetry-val">Open-Meteo Global Forecasting</span>
              </div>
            </motion.div>
          )}

          {/* Real-time Agent Trace */}
          <AgentTracePanel events={events} />

          {/* Results Area */}
          {!results && !isRunning ? (
            <div className="welcome-screen">
              <div className="welcome-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={48} color="#00f0ff" />
              </div>
              <div className="welcome-title">CrisisGuard AI Incident Command Center</div>
              <div className="welcome-subtitle">
                Autonomous multi-agent intelligence system for rapid disaster response, regional facility triage, and emergency broadcast coordination.
                Select an active global hazard from the live feed above, click any marker on the map, or load an incident scenario to begin.
              </div>
              <div className="feature-grid">
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <Compass size={14} color="#38bdf8" />
                  </div>
                  <span className="feature-text">Intelligence Assessment Agent (GIS Geocoding & Threat Telemetry)</span>
                </div>
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <Building2 size={14} color="#10b981" />
                  </div>
                  <span className="feature-text">Resource Mapper Agent (Hospital Capacity & Shelter Registry)</span>
                </div>
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <Radio size={14} color="#eab308" />
                  </div>
                  <span className="feature-text">Emergency Communications Agent (Multilingual Public & SMS Alerts)</span>
                </div>
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <ShieldCheck size={14} color="#a855f7" />
                  </div>
                  <span className="feature-text">Response Coordinator Agent (ICS-201 Incident Action Plan)</span>
                </div>
              </div>
            </div>
          ) : isRunning && !results ? (
            <div className="welcome-screen">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Loader2 size={54} color="#00f0ff" className="animate-spin" />
              </div>
              <div className="welcome-title">Autonomous Response Agents Coordinating...</div>
              <div className="welcome-subtitle">Assessing threat perimeter, matching local medical facilities, drafting multilingual advisories, and generating the operational Incident Action Plan.</div>
            </div>
          ) : results && (
            <div className="results-panel">
              {results.intelligence && (
                <div id="card-intelligence">
                  <IntelligenceCard data={results.intelligence} />
                </div>
              )}
              {results.resources && (
                <div id="card-resources">
                  <ResourceCard
                    data={results.resources}
                    onOpenDispatch={handleOpenDispatch}
                    onLocate={(target) => {
                      setLocateTarget(target)
                      playTelemetryBeep(1200)
                    }}
                  />
                </div>
              )}
              {results.alerts && (
                <div id="card-alerts">
                  <AlertCard data={results.alerts} />
                </div>
              )}
              {results.response_plan && (
                <div id="card-escalation">
                  <HumanEscalationCard data={results.response_plan} />
                </div>
              )}
              {results.response_plan && (
                <div id="card-response-plan" style={{ gridColumn: '1 / -1' }}>
                  <ResponsePlanCard data={results.response_plan} />
                </div>
              )}

              {/* Multi-Agency Dispatch CTA */}
              {results.agency_dispatches && (
                <motion.div
                  className="dispatch-cta-banner"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ gridColumn: '1 / -1' }}
                >
                  <div className="dispatch-cta-left">
                    <div className="dispatch-cta-pulse">
                      <ShieldAlert size={22} color="#ef4444" />
                    </div>
                    <div>
                      <div className="dispatch-cta-title">MULTI-AGENCY RESCUE DISPATCH READY</div>
                      <div className="dispatch-cta-sub">
                        {Object.keys(results.agency_dispatches?.agencies || {}).length} agencies identified · Role-specific directives generated · CAP v1.2 broadcast ready
                      </div>
                    </div>
                  </div>
                  <button
                    className="dispatch-cta-btn"
                    onClick={() => handleOpenDispatch()}
                  >
                    <Send size={15} />
                    OPEN DISPATCH CONSOLE
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Agency Dispatch Modal */}
      <AgencyDispatchModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        dispatchPackage={results?.agency_dispatches}
        disasterType={disasterType}
        location={location}
        severity={severity}
        coordinates={activeCoords}
        initialAgencyKey={dispatchInitialAgency}
      />
    </div>
  )
}
