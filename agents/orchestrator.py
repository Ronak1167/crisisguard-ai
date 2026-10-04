"""
CrisisGuard AI - Master Orchestrator
Coordinates all agents in the correct sequence using async pipeline
"""
import asyncio
from datetime import datetime
from agents.intelligence_agent import run_intelligence_agent
from agents.resource_mapper_agent import run_resource_mapper_agent
from agents.alert_agent import run_alert_agent
from agents.response_coordinator_agent import run_response_coordinator_agent
from services.agency_dispatch_service import generate_multi_agency_dispatch


async def run_crisis_response(
    disaster_type: str,
    location: str,
    severity: str,
    description: str,
    session_id: str,
    event_callback=None,
    coordinates: dict = None,
) -> dict:
    """
    Master Orchestrator: Runs all agents in sequence with dependency management
    
    Pipeline:
    1. Intelligence Agent → Assessment
    2. Resource Mapper Agent → Multi-agency facility and resource map
    3. Alert Agent → Multilingual Public Communications
    4. Agency Dispatch Engine → Role-Tailored Operational Directives (Rescue/USAR, Police, Fire, Health, Admin/EOC, Inquest/Forensics)
    5. Response Coordinator → ICS Incident Action Plan
    """

    async def emit(event_type: str, message: str, agent: str = "Orchestrator", data: dict = None):
        if event_callback:
            await event_callback({
                "session_id": session_id,
                "agent": agent,
                "agent_icon": "🤖",
                "event_type": event_type,
                "message": message,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
            })

    await emit("start", f"🚀 CrisisGuard AI activating — {disaster_type} detected in {location}")
    await emit("thinking", "Initializing multi-agent response pipeline...")
    
    start_time = datetime.utcnow()

    # ── Phase 1: Intelligence Assessment ─────────────────────────────────────
    await emit("thinking", "▶ Phase 1: Launching Intelligence Agent...")
    intelligence_data = await run_intelligence_agent(
        disaster_type=disaster_type,
        location=location,
        severity=severity,
        description=description,
        event_callback=event_callback,
        session_id=session_id,
        coordinates=coordinates,
    )

    # ── Phase 2: Resource Mapping ──────────────────────────────────────────
    await emit("thinking", "▶ Phase 2: Launching Resource Mapper Agent...")
    resource_data = await run_resource_mapper_agent(
        location=location,
        disaster_type=disaster_type,
        intelligence_data=intelligence_data,
        event_callback=event_callback,
        session_id=session_id,
    )

    # ── Phase 3: Alert Generation ──────────────────────────────────────────
    await emit("thinking", "▶ Phase 3: Launching Alert Agent...")
    alert_data = await run_alert_agent(
        disaster_type=disaster_type,
        location=location,
        intelligence_data=intelligence_data,
        resource_data=resource_data,
        event_callback=event_callback,
        session_id=session_id,
    )

    # ── Phase 3b: Multi-Agency Dispatch Generation ─────────────────────────
    coords = intelligence_data.get("coordinates", {"lat": 20.2724, "lng": 85.8338})
    telemetry = intelligence_data.get("real_time_telemetry", {})
    agency_dispatches = generate_multi_agency_dispatch(
        disaster_type=disaster_type,
        location=location,
        severity=severity,
        coordinates=coords,
        telemetry=telemetry,
        facilities=resource_data,
    )
    country_name = agency_dispatches.get("country", "Regional")
    await emit(
        "tool_call",
        f"Generated operational dispatch directives for {len(agency_dispatches['agencies'])} cadres ({country_name} Incident Command Mesh: USAR, Police, Fire, Health, Civil Protection, Forensics)...",
        agent="Dispatch Engine"
    )

    # ── Phase 4: Response Coordination ───────────────────────────────────
    await emit("thinking", "▶ Phase 4: Launching Response Coordinator Agent...")
    response_plan = await run_response_coordinator_agent(
        disaster_type=disaster_type,
        location=location,
        intelligence_data=intelligence_data,
        resource_data=resource_data,
        alert_data=alert_data,
        event_callback=event_callback,
        session_id=session_id,
    )

    # ── Final Assembly ─────────────────────────────────────────────────────
    elapsed = (datetime.utcnow() - start_time).total_seconds()
    
    final_result = {
        "session_id": session_id,
        "elapsed_seconds": round(elapsed, 2),
        "disaster_type": disaster_type,
        "location": location,
        "severity": severity,
        "intelligence": intelligence_data,
        "resources": resource_data,
        "alerts": alert_data,
        "agency_dispatches": agency_dispatches,
        "response_plan": response_plan,
        "pipeline_completed": True,
        "agents_executed": [
            "Intelligence Agent",
            "Resource Mapper Agent", 
            "Alert Agent",
            "Multi-Agency Dispatch Engine",
            "Response Coordinator Agent",
        ],
    }

    lives_saved = response_plan.get("lives_potentially_saved_with_plan", 0)
    score = response_plan.get("overall_response_score", 0)
    
    await emit(
        "complete",
        f"✅ CrisisGuard AI response complete in {elapsed:.1f}s. "
        f"Response effectiveness: {score}%. "
        f"Estimated {lives_saved:,} lives protected.",
        data={"elapsed": elapsed, "score": score, "lives_saved": lives_saved}
    )

    return final_result
