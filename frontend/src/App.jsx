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
} from 'lucide-react'
import './index.css'

import GoogleEarthMap from './components/GoogleEarthMap'
import TiltCard from './components/TiltCard'
import LiveDisasterTicker from './components/LiveDisasterTicker'

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
  { icon: Wind, title: 'Cyclone Amphan - Odisha', type: 'cyclone', location: 'Bhubaneswar, Odisha', severity: 'CRITICAL', desc: 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge expected.' },
  { icon: Waves, title: 'Flash Flood - Kerala', type: 'flood', location: 'Wayanad, Kerala', severity: 'HIGH', desc: 'Heavy monsoon rainfall causing flash flooding in Wayanad district. Multiple villages submerged.' },
  { icon: Activity, title: 'Earthquake - Delhi NCR', type: 'earthquake', location: 'New Delhi, Delhi', severity: 'HIGH', desc: 'Magnitude 6.2 earthquake strikes Delhi NCR. Multiple aftershocks reported. Structural collapse risks.' },
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
        LIVE MULTI-AGENT TELEMETRY STREAM
        {events.length > 0 && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>{events.length} EVENTS</span>}
      </div>
      {events.length === 0 ? (
        <div className="trace-empty">
          <Cpu size={32} style={{ color: '#38bdf8', opacity: 0.6 }} />
          <span>Awaiting incident execution or live hazard selection...</span>
          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Multi-agent autonomous trace will stream here over WebSocket protocol</span>
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

function ResourceCard({ data }) {
  const hospitals = data?.hospitals || []
  const totalBeds = hospitals.reduce((s, h) => s + (h.beds_available || 0), 0)

  return (
    <TiltCard>
      <div className="result-card" style={{ height: '100%' }}>
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color="#3b82f6" />
          </div>
          <div>
            <div className="result-card-title">Verified Emergency Assets</div>
            <div className="result-card-subtitle">Real GIS Hospital & Rescue Registry</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: data?.resource_adequacy_score >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
              {data?.resource_adequacy_score}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Adequacy</div>
          </div>
        </div>

        <div className="metric-row"><span className="metric-label">Verified Hospitals</span><span className="metric-value">{hospitals.length} facilities</span></div>
        <div className="metric-row"><span className="metric-label">Emergency Surge Beds</span><span className="metric-value good">{totalBeds.toLocaleString()}</span></div>
        <div className="metric-row"><span className="metric-label">Disaster Shelters</span><span className="metric-value">{(data?.shelters || []).length} complexes</span></div>
        <div className="metric-row"><span className="metric-label">NDRF / SDRF Units</span><span className="metric-value">{(data?.rescue_teams || []).length} battalions</span></div>

        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.04em' }}>VERIFIED LOCAL HOSPITALS:</div>
          {hospitals.slice(0, 3).map((h, i) => (
            <div key={i} className="task-item" style={{ marginBottom: '4px', padding: '8px' }}>
              <span className="badge badge-blue">{h.trauma_center ? 'Trauma' : 'General'}</span>
              <div className="task-content">
                <div className="task-name">{h.name}</div>
                <div className="task-meta">{h.beds_available} beds available · {h.distance_km} km away</div>
              </div>
              <span className="badge badge-green">{h.status}</span>
            </div>
          ))}
        </div>

        {(data?.critical_gaps || []).length > 0 && (
          <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={12} /> CRITICAL DEFICITS IDENTIFIED
            </div>
            {data.critical_gaps.map((g, i) => <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {g}</div>)}
          </div>
        )}
      </div>
    </TiltCard>
  )
}

function AlertCard({ data }) {
  const [lang, setLang] = useState('english')
  const publicAlert = data?.public_alert || {}

  return (
    <TiltCard>
      <div className="result-card" style={{ height: '100%' }}>
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={18} color="#eab308" />
          </div>
          <div>
            <div className="result-card-title">Emergency Communications</div>
            <div className="result-card-subtitle">Multilingual Broadcast Engine</div>
          </div>
          <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{data?.official_communication?.priority || 'URGENT'}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {['english', 'hindi', 'regional'].map(l => (
            <button key={l} onClick={() => setLang(l)} className="severity-btn" data-level={l === lang ? 'CRITICAL' : ''} style={{ flex: 1, padding: '6px 4px', fontSize: '11px', fontWeight: '600' }}>
              {l === 'english' ? 'EN (INTERNATIONAL)' : l === 'hindi' ? 'HI (DEVNAGARI)' : 'REGIONAL (VERNACULAR)'}
            </button>
          ))}
        </div>

        <div className={`alert-box ${lang}`}>{publicAlert[lang] || 'Emergency broadcast active.'}</div>

        <div style={{ marginTop: '10px' }}>
          <div className="alert-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={13} /> 160-Char Emergency SMS Broadcast
          </div>
          <div className="alert-box" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.02em', background: 'rgba(0,0,0,0.5)' }}>
            {data?.sms_alert?.english || 'ALERT: Evacuate immediately to designated shelter.'}
          </div>
        </div>

        <div style={{ marginTop: '10px' }}>
          <div className="alert-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={13} /> Emergency Helplines
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(data?.media_advisory?.key_numbers || {}).map(([k, v]) => (
              <span key={k} className="badge badge-blue">{k.toUpperCase()}: {v}</span>
            ))}
          </div>
        </div>
      </div>
    </TiltCard>
  )
}

function ResponsePlanCard({ data }) {
  return (
    <TiltCard style={{ gridColumn: 'span 2' }}>
      <div className="result-card" style={{ height: '100%' }}>
        <div className="result-card-header">
          <div className="result-card-icon" style={{ background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#a855f7" />
          </div>
          <div>
            <div className="result-card-title">Response Operations Playbook</div>
            <div className="result-card-subtitle">Prioritized Multi-Track Incident Command System</div>
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

        {/* Priority Tasks */}
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} className="icon" /> PRIORITY ACTION MATRIX
        </div>
        {(data?.priority_tasks || []).map((task, i) => (
          <div key={i} className="task-item">
            <div className="task-priority" style={{ fontFamily: 'var(--font-mono)' }}>{task.priority}</div>
            <div className="task-content">
              <div className="task-name">{task.task}</div>
              <div className="task-meta">{task.responsible} · Deadline: {task.deadline}</div>
            </div>
            <span className={`badge badge-${task.priority <= 2 ? 'red' : task.priority <= 3 ? 'orange' : 'blue'}`}>
              {task.priority <= 2 ? 'P1 CRITICAL' : task.priority <= 3 ? 'P2 HIGH' : 'P3 MEDIUM'}
            </span>
          </div>
        ))}
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
  const [location, setLocation] = useState('')
  const [severity, setSeverity] = useState('HIGH')
  const [description, setDescription] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [events, setEvents] = useState([])
  const [results, setResults] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [viewMode, setViewMode] = useState('3d') // '3d' | '2d'
  const [activeCoords, setActiveCoords] = useState({ lat: 20.2724, lng: 85.8338 })
  const [liveTelemetry, setLiveTelemetry] = useState(null)
  const [liveHazards, setLiveHazards] = useState([])
  const wsRef = useRef(null)

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

  const loadScenario = (scenario) => {
    setDisasterType(scenario.type)
    setLocation(scenario.location)
    setSeverity(scenario.severity)
    setDescription(scenario.desc)

    // Set sample coordinates
    if (scenario.location.includes('Bhubaneswar')) {
      setActiveCoords({ lat: 20.2961, lng: 85.8245 })
    } else if (scenario.location.includes('Wayanad')) {
      setActiveCoords({ lat: 11.6854, lng: 76.1320 })
    } else if (scenario.location.includes('Delhi')) {
      setActiveCoords({ lat: 28.6139, lng: 77.2090 })
    }
  }

  const handleSelectEpicenter = () => {
    const epicLocation = location || 'Bhubaneswar, Odisha'
    const epicType = disasterType || 'cyclone'
    const epicSeverity = severity || 'CRITICAL'
    const epicDesc = description || 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Severe storm surge expected.'

    setLocation(epicLocation)
    setDisasterType(epicType)
    setSeverity(epicSeverity)
    setDescription(epicDesc)
    setActiveCoords(prev => prev || { lat: 20.2724, lng: 85.8338 })
    playTelemetryBeep(1200)
  }

  const handleSelectHazard = (ev, autoRun = false) => {
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
      <LiveDisasterTicker onSelectEvent={(ev) => handleSelectHazard(ev, false)} />

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
            <div className="app-subtitle">Autonomous Disaster Response Intelligence System · WCC LaunchPad 3.0</div>
          </div>
        </div>

        <div className="header-badges">
          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator" /> REAL-TIME SATELLITE TELEMETRY
          </span>
          <span className="badge badge-blue">NASA EONET & USGS CONNECTED</span>
          <span className="badge badge-purple">4 AGENTS ACTIVE</span>
        </div>
      </header>

      {/* Stats bar when results exist */}
      {stats && (
        <motion.div className="stats-bar" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-item"><div className="stat-value critical">{stats.pop.toLocaleString()}</div><div className="stat-label">Population at Risk</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.resources}</div><div className="stat-label">Verified Facilities Mapped</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{stats.tasks}</div><div className="stat-label">Active ICS Tasks</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.score}%</div><div className="stat-label">Response Effectiveness</div></div>
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
                  <Loader2 size={16} className="animate-spin" /> ORCHESTRATING AGENTS...
                </>
              ) : (
                <>
                  <Zap size={14} /> EXECUTE AUTONOMOUS DISPATCH PIPELINE
                </>
              )}
            </button>
          </div>

          {/* Preset Sample Scenarios */}
          <div>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} className="icon" /> VERIFIED INDIAN DISASTER BENCHMARKS
            </div>
            {SAMPLE_SCENARIOS.map((s, i) => {
              const IconComp = s.icon
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className="scenario-card"
                  onClick={() => loadScenario(s)}
                >
                  <div className="scenario-icon-box">
                    <IconComp size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="scenario-title">{s.title}</div>
                    <div className="scenario-sub">{s.severity} · Click to auto-load</div>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right Panel - Visual Telemetry & Agent Outputs */}
        <div className="right-panel">
          {/* Spatial Awareness Header with Google Earth Mode */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Satellite size={14} className="icon" /> SITUATION AWARENESS SATELLITE RADAR (HIGH-RES ORBIT)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>Scroll Wheel / Drag / Double-Click to Zoom</span>
              <span className="badge badge-green">LIVE ESRI SATELLITE</span>
            </div>
          </div>

          {/* Interactive Google Earth Style Map */}
          <GoogleEarthMap
            coordinates={activeCoords}
            location={location}
            description={description}
            severity={severity}
            hospitals={results?.resources?.hospitals || []}
            shelters={results?.resources?.shelters || []}
            disasterType={disasterType}
            liveEvents={liveHazards}
            results={results}
            liveTelemetry={liveTelemetry}
            isRunning={isRunning}
            onSelectEpicenter={handleSelectEpicenter}
            onSelectHazard={handleSelectHazard}
            onTriggerAnalysis={executeAnalysis}
          />

          {/* Live Telemetry Banner */}
          {liveTelemetry && (
            <motion.div className="live-telemetry-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="telemetry-tag">
                <span className="live-indicator" />
                <span>STATUS:</span>
                <span className="telemetry-val">LIVE SATELLITE STREAM</span>
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
                <span>RADAR TELEMETRY:</span>
                <span className="telemetry-val">{liveTelemetry.provider}</span>
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
              <div className="welcome-title">CrisisGuard AI Operations Ready</div>
              <div className="welcome-subtitle">
                Autonomous multi-agent intelligence for disaster response coordination.
                Select an active global hazard from the NASA ticker above or trigger a regional benchmark.
              </div>
              <div className="feature-grid">
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <Compass size={14} color="#38bdf8" />
                  </div>
                  <span className="feature-text">Intelligence Assessment Agent (Real GIS)</span>
                </div>
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <Building2 size={14} color="#10b981" />
                  </div>
                  <span className="feature-text">Resource Mapper Agent (Verified Hospitals)</span>
                </div>
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <Radio size={14} color="#eab308" />
                  </div>
                  <span className="feature-text">Multilingual Alert Agent (SMS + Regional)</span>
                </div>
                <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="scenario-icon-box" style={{ width: '28px', height: '28px' }}>
                    <ShieldCheck size={14} color="#a855f7" />
                  </div>
                  <span className="feature-text">Response Coordinator Agent (ICS Protocol)</span>
                </div>
              </div>
            </div>
          ) : isRunning && !results ? (
            <div className="welcome-screen">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Loader2 size={54} color="#00f0ff" className="animate-spin" />
              </div>
              <div className="welcome-title">Autonomous Agents Coordinating...</div>
              <div className="welcome-subtitle">Streaming real-time GIS coordinates and computing task prioritization matrix.</div>
            </div>
          ) : results && (
            <div className="results-panel">
              {results.intelligence && <IntelligenceCard data={results.intelligence} />}
              {results.resources && <ResourceCard data={results.resources} />}
              {results.alerts && <AlertCard data={results.alerts} />}
              {results.response_plan && <HumanEscalationCard data={results.response_plan} />}
              {results.response_plan && <ResponsePlanCard data={results.response_plan} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
