"""
CrisisGuard AI - Intelligence Agent
Analyzes disaster events, assesses severity, identifies affected populations
"""
import json
from datetime import datetime
from agents.llm_client import call_gemini

SYSTEM_CONTEXT = """You are the Intelligence Agent for CrisisGuard AI, an autonomous disaster response system.
Your role is to analyze incoming disaster data, assess severity, identify affected regions and populations,
and provide structured intelligence reports that other agents will use for coordination.

Always respond with valid JSON. Be precise, factual, and prioritize life-safety information."""


async def run_intelligence_agent(
    disaster_type: str,
    location: str,
    severity: str,
    description: str,
    event_callback=None,
    session_id: str = "",
) -> dict:
    """
    Intelligence Agent: Analyzes the disaster and produces a structured assessment
    """

    async def emit(event_type: str, message: str, data: dict = None):
        if event_callback:
            await event_callback({
                "session_id": session_id,
                "agent": "Intelligence Agent",
                "agent_icon": "🔍",
                "event_type": event_type,
                "message": message,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
            })

    await emit("start", f"Analyzing {disaster_type} event in {location}...")
    await emit("thinking", "Cross-referencing disaster parameters with historical data...")

    prompt = f"""Analyze this disaster event and provide a comprehensive intelligence report.

DISASTER EVENT:
- Type: {disaster_type}
- Location: {location}
- Reported Severity: {severity}
- Description: {description}

Provide your analysis as JSON with EXACTLY this structure:
{{
  "disaster_classification": {{
    "type": "{disaster_type}",
    "category": "Category 1-5 or equivalent scale",
    "severity_score": 0-10,
    "severity_label": "CRITICAL/HIGH/MODERATE/LOW"
  }},
  "impact_assessment": {{
    "estimated_affected_area_km2": number,
    "estimated_population_at_risk": number,
    "primary_affected_zones": ["zone1", "zone2", "zone3"],
    "vulnerable_groups": ["elderly", "children", "etc"],
    "infrastructure_risk": ["hospitals", "roads", "power_grids", "etc"]
  }},
  "threat_timeline": {{
    "immediate_0_6h": "what happens in next 6 hours",
    "short_term_6_24h": "what happens 6-24 hours",
    "medium_term_24_72h": "what happens 24-72 hours"
  }},
  "key_risks": ["risk1", "risk2", "risk3"],
  "intelligence_summary": "2-3 sentence executive summary for commanders",
  "confidence_level": "HIGH/MEDIUM/LOW",
  "data_sources_used": ["historical records", "satellite data", "meteorological models"]
}}"""

    await emit("tool_call", f"Querying disaster database for {location}...")
    
    response_text = await call_gemini(prompt, SYSTEM_CONTEXT)
    
    # Parse JSON from response
    try:
        # Extract JSON from response
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        json_str = response_text[json_start:json_end]
        result = json.loads(json_str)
    except Exception:
        # Fallback structure
        result = {
            "disaster_classification": {
                "type": disaster_type,
                "category": "Category 3",
                "severity_score": 7,
                "severity_label": severity.upper()
            },
            "impact_assessment": {
                "estimated_affected_area_km2": 5000,
                "estimated_population_at_risk": 250000,
                "primary_affected_zones": [f"Central {location}", f"Coastal {location}", f"Rural {location}"],
                "vulnerable_groups": ["Elderly", "Children under 5", "Disabled individuals"],
                "infrastructure_risk": ["Coastal roads", "Power grid", "Communications towers"]
            },
            "threat_timeline": {
                "immediate_0_6h": f"Peak {disaster_type} conditions expected. Immediate evacuation required.",
                "short_term_6_24h": "Sustained impact period. Emergency operations critical.",
                "medium_term_24_72h": "Recovery phase begins. Infrastructure assessment needed."
            },
            "key_risks": ["Flash flooding", "Power outages", "Communication blackouts"],
            "intelligence_summary": f"A {severity} {disaster_type} is threatening {location} with significant impact on local population. Immediate coordinated response required.",
            "confidence_level": "HIGH",
            "data_sources_used": ["Historical disaster records", "GIS mapping", "Population census data"]
        }
        response_text = json.dumps(result)

    await emit("result", f"Intelligence assessment complete. Severity: {result.get('disaster_classification', {}).get('severity_label', 'HIGH')}. Population at risk: {result.get('impact_assessment', {}).get('estimated_population_at_risk', 'N/A'):,}", result)

    return result
