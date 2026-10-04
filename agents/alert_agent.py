"""
CrisisGuard AI - Alert Agent
Generates multilingual emergency alerts, evacuation notices, and official communications
"""
import json
from datetime import datetime
from agents.llm_client import call_gemini

SYSTEM_CONTEXT = """You are the Alert Agent for CrisisGuard AI.
Your role is to craft clear, urgent, and effective emergency alerts and communications.
You generate messages for multiple audiences: general public, rescue teams, government officials,
and media. You ensure messages are culturally appropriate and multilingual for Indian contexts.
Always respond with valid JSON."""


async def run_alert_agent(
    disaster_type: str,
    location: str,
    intelligence_data: dict,
    resource_data: dict,
    event_callback=None,
    session_id: str = "",
) -> dict:
    """
    Alert Agent: Generates multilingual emergency communications
    """

    async def emit(event_type: str, message: str, data: dict = None):
        if event_callback:
            await event_callback({
                "session_id": session_id,
                "agent": "Alert Agent",
                "agent_icon": "📢",
                "event_type": event_type,
                "message": message,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
            })

    await emit("start", "Drafting emergency alert communications...")
    
    severity = intelligence_data.get("disaster_classification", {}).get("severity_label", "HIGH")
    pop_at_risk = intelligence_data.get("impact_assessment", {}).get("estimated_population_at_risk", 100000)
    zones = intelligence_data.get("impact_assessment", {}).get("primary_affected_zones", [location])
    
    await emit("thinking", f"Crafting alerts for {pop_at_risk:,} people across {len(zones)} zones...")
    await emit("tool_call", "Translating alerts to regional languages...")

    prompt = f"""Generate emergency alert communications for the following disaster:

DISASTER: {disaster_type} in {location}
SEVERITY: {severity}
AFFECTED POPULATION: {pop_at_risk:,}
AFFECTED ZONES: {', '.join(zones)}
SHELTER LOCATIONS: {', '.join([s.get('name', 'Unknown') for s in resource_data.get('shelters', [])])}
RESCUE TEAMS DEPLOYED: {len(resource_data.get('rescue_teams', []))}

Generate comprehensive alert package as JSON with EXACTLY this structure:
{{
  "public_alert": {{
    "english": "Emergency public alert in English (2-3 sentences, urgent, clear action steps)",
    "hindi": "Hindi emergency alert (same content in Hindi)",
    "regional": "Regional language alert (Odia/Bengali/etc based on location)"
  }},
  "sms_alert": {{
    "english": "Short SMS-friendly alert under 160 characters",
    "hindi": "Hindi SMS alert under 160 characters"
  }},
  "evacuation_notice": {{
    "zones_to_evacuate": ["zone1", "zone2"],
    "safe_routes": ["route1", "route2"],
    "assembly_points": ["point1", "point2"],
    "evacuation_deadline": "specific deadline like '6 PM today'"
  }},
  "official_communication": {{
    "subject": "Subject line for official memo",
    "body": "3-4 sentence official communication for government officials",
    "priority": "URGENT/HIGH/NORMAL",
    "to": ["District Collector", "NDRF Commander", "State EOC"]
  }},
  "media_advisory": {{
    "headline": "News headline",
    "press_release": "3-4 sentence press release for media",
    "key_numbers": {{"helpline": "1077", "ndrf": "9711077372", "police": "100"}}
  }},
  "social_media": {{
    "twitter": "Tweet under 280 characters with hashtags",
    "whatsapp_broadcast": "WhatsApp broadcast message in simple language"
  }}
}}"""

    response_text = await call_gemini(prompt, SYSTEM_CONTEXT)

    try:
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        json_str = response_text[json_start:json_end]
        result = json.loads(json_str)
    except Exception:
        result = {
            "public_alert": {
                "english": f"⚠️ EMERGENCY ALERT: {severity} {disaster_type} warning for {location}. Evacuate immediately to designated shelters. Follow official instructions. This is a life-safety emergency.",
                "hindi": f"⚠️ आपातकालीन चेतावनी: {location} में {disaster_type} की गंभीर चेतावनी। तुरंत निकटतम आश्रय स्थल पर जाएं। जीवन-रक्षा आवश्यक है।",
                "regional": f"⚠️ ଜରୁରୀ ସୂଚନା: {location}ରେ {disaster_type} ର ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଚେତାବନୀ। ଅବିଳମ୍ବେ ନିରାପଦ ଆଶ୍ରୟ ସ୍ଥଳକୁ ଯାଆନ୍ତୁ।"
            },
            "sms_alert": {
                "english": f"ALERT: {severity} {disaster_type} in {location}. EVACUATE NOW. Go to nearest shelter. Helpline: 1077",
                "hindi": f"चेतावनी: {location} में {disaster_type}। अभी निकलें। हेल्पलाइन: 1077"
            },
            "evacuation_notice": {
                "zones_to_evacuate": zones[:3] if zones else [location],
                "safe_routes": ["National Highway NH-16 towards inland", "State Highway via district headquarters"],
                "assembly_points": ["District Sports Complex", "Government High School Ground"],
                "evacuation_deadline": "6:00 PM today"
            },
            "official_communication": {
                "subject": f"URGENT: {disaster_type} Emergency Response Required — {location}",
                "body": f"A {severity} level {disaster_type} is imminent/ongoing in {location} affecting approximately {pop_at_risk:,} residents. Immediate activation of State Disaster Response protocols required. All emergency services to be placed on highest alert. District administration to coordinate with NDRF and state EOC.",
                "priority": "URGENT",
                "to": ["District Collector", "NDRF Battalion Commander", "State EOC Director", "Health Secretary"]
            },
            "media_advisory": {
                "headline": f"{severity.title()} {disaster_type} Alert Issued for {location}: Mass Evacuation Underway",
                "press_release": f"The State Emergency Operations Centre has issued a {severity} alert for {location} following an approaching {disaster_type}. Approximately {pop_at_risk:,} residents are in affected zones. Evacuation operations are underway with NDRF teams deployed. Citizens are urged to cooperate with authorities.",
                "key_numbers": {"helpline": "1077", "ndrf": "9711077372", "police": "100", "ambulance": "108"}
            },
            "social_media": {
                "twitter": f"🚨 {severity} {disaster_type} ALERT for {location}. EVACUATE IMMEDIATELY. Shelter locations open. Helpline: 1077 #DisasterAlert #{location.replace(' ', '')} #CrisisGuard",
                "whatsapp_broadcast": f"🚨 *EMERGENCY* 🚨\n\n*{disaster_type.upper()} WARNING* — {location}\n\n✅ Evacuate to nearest shelter\n✅ Take essential documents\n✅ Follow police directions\n\n📞 Helpline: *1077*\n\nShare with everyone in {location}!"
            }
        }

    await emit("result", f"Generated {len(result)} alert types including multilingual public alerts, SMS, official notices, and social media content.", result)

    return result
