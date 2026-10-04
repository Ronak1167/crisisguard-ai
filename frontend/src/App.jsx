import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

const API_BASE = 'http://localhost:8000'

const DISASTER_TYPES = [
  { id: 'cyclone', label: 'Cyclone', icon: '🌀' },
  { id: 'flood', label: 'Flood', icon: '🌊' },
  { id: 'earthquake', label: 'Earthquake', icon: '🏚️' },
  { id: 'landslide', label: 'Landslide', icon: '⛰️' },
  { id: 'drought', label: 'Drought', icon: '☀️' },
  { id: 'heatwave', label: 'Heat Wave', icon: '🔥' },
]

const SAMPLE_SCENARIOS = [
  { emoji: '🌀', title: 'Cyclone Amphan - Odisha', type: 'cyclone', location: 'Bhubaneswar, Odisha', severity: 'CRITICAL', desc: 'Category 4 cyclone approaching coastal Odisha. Winds at 180 km/h. Storm surge expected.' },
  { emoji: '🌊', title: 'Flash Flood - Kerala', type: 'flood', location: 'Wayanad, Kerala', severity: 'HIGH', desc: 'Heavy rainfall causing severe flooding in Wayanad district. Multiple villages submerged.' },
  { emoji: '🏚️', title: 'Earthquake - Delhi NCR', type: 'earthquake', location: 'New Delhi, Delhi', severity: 'HIGH', desc: 'Magnitude 6.2 earthquake strikes Delhi NCR. Multiple aftershocks reported. Building collapses.' },
]

function AgentTracePanel({ events }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [events])

  return (
    <div className="agent-trace-panel" ref={scrollRef}>
      <div className="section-header">
        <span className="icon">⚡</span>
        LIVE AGENT TRACE
        {events.length > 0 && <span className="badge badge-green" style={{marginLeft:'auto'}}>{events.length} events</span>}
      </div>
      {events.length === 0 ? (
        <div className="trace-empty">
          <span style={{fontSize:'32px'}}>🤖</span>
          <span>Waiting for disaster event input...</span>
          <span style={{fontSize:'11px'}}>Agent trace will appear here in real-time</span>
        </div>
      ) : (
        events.map((event, i) => (
          <motion.div
            key={i}
            className={`trace-event event-${event.event_type}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="trace-agent-icon">{event.agent_icon || '🤖'}</span>
            <span className="trace-agent-name">{event.agent}</span>
            <span className="trace-message">{event.message}</span>
            <span className="trace-time">{new Date(event.timestamp).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
          </motion.div>
        ))
      )}
    </div>
  )
}

function IntelligenceCard({ data }) {
  const cls = data?.disaster_classification || {}
  const impact = data?.impact_assessment || {}
  const severityClass = { CRITICAL: 'critical', HIGH: 'high', MODERATE: 'moderate', LOW: 'good' }[cls.severity_label] || 'good'
  return (
    <motion.div className={`result-card ${severityClass}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>🔍</div>
        <div>
          <div className="result-card-title">Intelligence Assessment</div>
          <div className="result-card-subtitle">Threat Analysis & Classification</div>
        </div>
        <span className={`badge badge-red`} style={{ marginLeft: 'auto' }}>{cls.severity_label}</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Severity Score</span>
        <span className="metric-value critical">{cls.severity_score}/10</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Category</span>
        <span className="metric-value">{cls.category}</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Population at Risk</span>
        <span className="metric-value critical">{(impact.estimated_population_at_risk || 0).toLocaleString()}</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Affected Area</span>
        <span className="metric-value">{(impact.estimated_affected_area_km2 || 0).toLocaleString()} km²</span>
      </div>
      <div className="metric-row">
        <span className="metric-label">Confidence</span>
        <span className={`badge badge-${cls.confidence_level === 'HIGH' ? 'green' : 'yellow'}`}>{data.confidence_level}</span>
      </div>
      <div style={{ marginTop: '12px', background: 'rgba(3,7,18,0.6)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {data.intelligence_summary}
      </div>
      <div style={{ marginTop: '10px' }}>
        {(data.key_risks || []).slice(0, 3).map((r, i) => (
          <span key={i} className="badge badge-red" style={{ margin: '2px' }}>⚠️ {r}</span>
        ))}
      </div>
    </motion.div>
  )
}

function ResourceCard({ data }) {
  return (
    <motion.div className="result-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🗺️</div>
        <div>
          <div className="result-card-title">Resource Map</div>
          <div className="result-card-subtitle">Emergency Assets Available</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: data?.resource_adequacy_score >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{data?.resource_adequacy_score}%</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Adequacy</div>
        </div>
      </div>
      <div className="metric-row"><span className="metric-label">Hospitals</span><span className="metric-value">{(data?.hospitals || []).length} facilities</span></div>
      <div className="metric-row"><span className="metric-label">Available Beds</span><span className="metric-value good">{(data?.hospitals || []).reduce((s, h) => s + (h.beds_available || 0), 0)}</span></div>
      <div className="metric-row"><span className="metric-label">Shelters</span><span className="metric-value">{(data?.shelters || []).length} camps</span></div>
      <div className="metric-row"><span className="metric-label">Rescue Teams</span><span className="metric-value">{(data?.rescue_teams || []).length} teams</span></div>
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>RESCUE TEAMS</div>
        {(data?.rescue_teams || []).map((team, i) => (
          <div key={i} className="task-item" style={{ marginBottom: '4px' }}>
            <span className="badge badge-purple">{team.type}</span>
            <div className="task-content">
              <div className="task-name">{team.name}</div>
              <div className="task-meta">{team.personnel} personnel · {team.status}</div>
            </div>
            <span className={`badge badge-${team.status === 'DEPLOYED' ? 'green' : 'orange'}`}>{team.status === 'DEPLOYED' ? 'Live' : `ETA ${team.eta_hours}h`}</span>
          </div>
        ))}
      </div>
      {(data?.critical_gaps || []).length > 0 && (
        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '4px' }}>⚠️ CRITICAL GAPS</div>
          {data.critical_gaps.map((g, i) => <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {g}</div>)}
        </div>
      )}
    </motion.div>
  )
}

function AlertCard({ data }) {
  const [lang, setLang] = useState('english')
  const publicAlert = data?.public_alert || {}
  return (
    <motion.div className="result-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'rgba(234,179,8,0.15)' }}>📢</div>
        <div>
          <div className="result-card-title">Emergency Alerts</div>
          <div className="result-card-subtitle">Multilingual Communications</div>
        </div>
        <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{data?.official_communication?.priority}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {['english', 'hindi', 'regional'].map(l => (
          <button key={l} onClick={() => setLang(l)} className="severity-btn" data-level={l === lang ? 'CRITICAL' : ''} style={{ flex: 1, padding: '6px 4px', textTransform: 'capitalize', fontSize: '11px' }}>
            {l === 'english' ? '🇬🇧 EN' : l === 'hindi' ? '🇮🇳 HI' : '📍 REG'}
          </button>
        ))}
      </div>
      <div className={`alert-box ${lang}`}>{publicAlert[lang] || 'N/A'}</div>
      <div style={{ marginTop: '10px' }}>
        <div className="alert-label">📱 SMS Alert</div>
        <div className="alert-box" style={{ fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.02em' }}>{data?.sms_alert?.english}</div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <div className="alert-label">📞 Key Numbers</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(data?.media_advisory?.key_numbers || {}).map(([k, v]) => (
            <span key={k} className="badge badge-blue">{k.toUpperCase()}: {v}</span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function ResponsePlanCard({ data }) {
  return (
    <motion.div className="result-card" style={{ gridColumn: 'span 2' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'rgba(168,85,247,0.15)' }}>🎯</div>
        <div>
          <div className="result-card-title">Response Operations Plan</div>
          <div className="result-card-subtitle">Prioritized Task Assignments</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge badge-${data?.operational_status?.alert_level === 'RED' ? 'red' : 'orange'}`}>
            🔴 {data?.operational_status?.alert_level}
          </span>
          <span className="badge badge-green">{data?.overall_response_score}% Effective</span>
        </div>
      </div>
      
      {/* Commander briefing */}
      <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-purple)', display: 'block', marginBottom: '6px' }}>🎖️ COMMANDER BRIEFING</span>
        {data?.commander_briefing}
      </div>

      {/* Lives impact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-red)' }}>{(data?.estimated_lives_at_risk || 0).toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lives at Risk</div>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-green)' }}>{(data?.lives_potentially_saved_with_plan || 0).toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lives Protected</div>
        </div>
      </div>

      {/* Priority Tasks */}
      <div className="section-header"><span className="icon">⚡</span>PRIORITY TASK QUEUE</div>
      {(data?.priority_tasks || []).map((task, i) => (
        <div key={i} className="task-item">
          <div className="task-priority">{task.priority}</div>
          <div className="task-content">
            <div className="task-name">{task.task}</div>
            <div className="task-meta">{task.responsible} · {task.deadline}</div>
          </div>
          <span className={`badge badge-${task.priority <= 2 ? 'red' : task.priority <= 3 ? 'orange' : 'blue'}`}>
            {task.priority <= 2 ? 'URGENT' : task.priority <= 3 ? 'HIGH' : 'MEDIUM'}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

function HumanEscalationCard({ data }) {
  const [approved, setApproved] = useState({})
  const triggers = data?.human_escalation_triggers || []
  return (
    <motion.div className="result-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>👤</div>
        <div>
          <div className="result-card-title">Human-in-Loop Gates</div>
          <div className="result-card-subtitle">Escalation Triggers Requiring Human Decision</div>
        </div>
      </div>
      {triggers.map((t, i) => (
        <div key={i} className="escalation-card">
          <div className="escalation-header">⚠️ {approved[i] ? 'APPROVED' : 'AWAITING DECISION'}</div>
          <div className="escalation-body">{t.trigger}</div>
          <div className="escalation-to">Escalate to: <strong>{t.escalate_to}</strong></div>
          {!approved[i] && (
            <div style={{ marginTop: '8px' }}>
              <button className="approve-btn" onClick={() => setApproved(a => ({...a, [i]: 'approved'}))}>✅ Approve</button>
              <button className="override-btn" onClick={() => setApproved(a => ({...a, [i]: 'override'}))}>🚫 Override</button>
            </div>
          )}
          {approved[i] && (
            <span className={`badge badge-${approved[i] === 'approved' ? 'green' : 'red'}`} style={{ marginTop: '8px', display: 'inline-block' }}>
              {approved[i] === 'approved' ? '✅ APPROVED' : '🚫 OVERRIDDEN'}
            </span>
          )}
        </div>
      ))}
    </motion.div>
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
  const wsRef = useRef(null)

  const connectWS = useCallback((sid) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${sid}`)
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        setEvents(prev => [...prev, event])
      } catch {}
    }
    wsRef.current = ws
  }, [])

  const loadScenario = (scenario) => {
    setDisasterType(scenario.type)
    setLocation(scenario.location)
    setSeverity(scenario.severity)
    setDescription(scenario.desc)
  }

  const runAnalysis = async () => {
    if (!location || !description) return
    const sid = crypto.randomUUID()
    setSessionId(sid)
    setEvents([])
    setResults(null)
    setIsRunning(true)
    connectWS(sid)
    await new Promise(r => setTimeout(r, 300))
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disaster_type: disasterType, location, severity, description, session_id: sid })
      })
      const data = await res.json()
      setResults(data.result)
    } catch (err) {
      setEvents(prev => [...prev, { agent: 'System', agent_icon: '❌', event_type: 'error', message: `Error: ${err.message}. Is the backend running? Run: python main.py`, timestamp: new Date().toISOString() }])
    } finally {
      setIsRunning(false)
      if (wsRef.current) wsRef.current.close()
    }
  }

  const stats = results ? {
    pop: results.intelligence?.impact_assessment?.estimated_population_at_risk || 0,
    resources: (results.resources?.hospitals?.length || 0) + (results.resources?.rescue_teams?.length || 0),
    tasks: results.response_plan?.priority_tasks?.length || 0,
    score: results.response_plan?.overall_response_score || 0,
  } : null

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-logo">
          <div className="logo-icon">🛡️</div>
          <div>
            <div className="logo-text">CrisisGuard AI</div>
            <div className="logo-subtitle">Autonomous Disaster Response Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Agentic AI · WCC LaunchPad 3.0</span>
          <div className="header-status">
            <div className="status-dot" />
            SYSTEM ACTIVE
          </div>
        </div>
      </header>

      {/* Stats bar when results exist */}
      {stats && (
        <motion.div className="stats-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="stat-item"><div className="stat-value critical">{stats.pop.toLocaleString()}</div><div className="stat-label">Population at Risk</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.resources}</div><div className="stat-label">Resources Mapped</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{stats.tasks}</div><div className="stat-label">Priority Tasks</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.score}%</div><div className="stat-label">Response Score</div></div>
        </motion.div>
      )}

      <div className="main-layout">
        {/* Left Panel - Input */}
        <div className="left-panel">
          <div>
            <div className="section-header"><span className="icon">🎯</span>DISASTER TYPE</div>
            <div className="disaster-grid">
              {DISASTER_TYPES.map(d => (
                <button key={d.id} className={`disaster-btn ${disasterType === d.id ? 'active' : ''}`} onClick={() => setDisasterType(d.id)}>
                  <span className="emoji">{d.icon}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-card">
            <div className="form-group">
              <label className="form-label">📍 Location</label>
              <input className="form-input" placeholder="e.g. Bhubaneswar, Odisha" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">⚡ Severity Level</label>
              <div className="severity-selector">
                {['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map(s => (
                  <button key={s} className={`severity-btn ${severity === s ? 'active' : ''}`} data-level={s} onClick={() => setSeverity(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">📝 Description</label>
              <textarea className="form-textarea" placeholder="Describe the disaster situation..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <button className="submit-btn" onClick={runAnalysis} disabled={isRunning || !location || !description}>
              {isRunning ? <><div className="spinner" /> AGENTS RUNNING...</> : <>🚀 ACTIVATE CRISISGUARD AI</>}
            </button>
          </div>

          <div>
            <div className="section-header"><span className="icon">📋</span>SAMPLE SCENARIOS</div>
            {SAMPLE_SCENARIOS.map((s, i) => (
              <div key={i} className="scenario-card" onClick={() => loadScenario(s)}>
                <span className="emoji">{s.emoji}</span>
                <div>
                  <div className="scenario-title">{s.title}</div>
                  <div className="scenario-sub">{s.severity} · Click to load</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <AgentTracePanel events={events} />

          {!results && !isRunning ? (
            <div className="welcome-screen">
              <div className="welcome-icon">🛡️</div>
              <div className="welcome-title">CrisisGuard AI Ready</div>
              <div className="welcome-subtitle">
                Multi-agent AI system for autonomous disaster response coordination. 
                Enter a disaster scenario or use a sample to activate the agent pipeline.
              </div>
              <div className="feature-grid">
                <div className="feature-item"><span className="feature-icon">🔍</span><span className="feature-text">Intelligence Assessment Agent</span></div>
                <div className="feature-item"><span className="feature-icon">🗺️</span><span className="feature-text">Resource Mapper Agent</span></div>
                <div className="feature-item"><span className="feature-icon">📢</span><span className="feature-text">Multilingual Alert Agent</span></div>
                <div className="feature-item"><span className="feature-icon">🎯</span><span className="feature-text">Response Coordinator Agent</span></div>
              </div>
            </div>
          ) : isRunning && !results ? (
            <div className="welcome-screen">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '60px' }}>⚙️</motion.div>
              <div className="welcome-title">Agents Working...</div>
              <div className="welcome-subtitle">Multi-agent pipeline executing. Watch the live trace above.</div>
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
