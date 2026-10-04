"""
CrisisGuard AI - Alert Agent
Generates localized, multilingual emergency alerts, evacuation notices, and official communications
tailored to the specific country, languages, emergency helplines, and civil protection protocols.
"""
import json
from datetime import datetime
from agents.llm_client import call_gemini
from services.real_data_service import detect_country_and_region

SYSTEM_CONTEXT = """You are the Alert Agent for CrisisGuard AI — an international autonomous disaster incident command system.
Your role is to craft clear, urgent, authoritative, and life-saving emergency communications.
You generate messages for multiple audiences: general public, rescue teams, government emergency operations centers,
and media. You ensure messages use the accurate official and regional languages of the incident's country,
with real statutory emergency helplines and authentic terminology.
Always respond with valid JSON only."""


async def run_alert_agent(
    disaster_type: str,
    location: str,
    intelligence_data: dict,
    resource_data: dict,
    event_callback=None,
    session_id: str = "",
) -> dict:
    """
    Alert Agent: Generates localized multilingual emergency communications.
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

    await emit("start", "Drafting localized emergency alert communications...")
    
    coords = intelligence_data.get("coordinates", {})
    lat = coords.get("lat", 20.2724)
    lng = coords.get("lng", 85.8338)
    
    country_info = resource_data.get("region_profile") or detect_country_and_region(location, lat, lng)
    country_name = country_info.get("country", "International")
    primary_lang = country_info.get("primary_lang", "English")
    secondary_lang = country_info.get("secondary_lang", "Secondary Official / Spanish")
    tertiary_lang = country_info.get("tertiary_lang", "Emergency Broadcast / Regional")
    lang_labels = country_info.get("lang_labels", {"primary": "EN (PRIMARY)", "secondary": "SECONDARY", "tertiary": "EMERGENCY BROADCAST"})
    helplines = country_info.get("helplines", {"emergency": country_info.get("emergency_number", "911 / 112")})
    emergency_num = country_info.get("emergency_number", "911 / 112")

    severity = intelligence_data.get("disaster_classification", {}).get("severity_label", "HIGH")
    pop_at_risk = intelligence_data.get("impact_assessment", {}).get("estimated_population_at_risk", 100000)
    zones = intelligence_data.get("impact_assessment", {}).get("primary_affected_zones", [location])
    
    await emit("thinking", f"Synthesizing emergency alerts for {country_name} ({primary_lang} & {secondary_lang}) covering {pop_at_risk:,} residents across {location}...")
    await emit("tool_call", f"Configuring emergency channels: {tertiary_lang} & emergency helplines ({emergency_num})...")

    prompt = f"""Generate authoritative, life-safety emergency alert communications for the following incident:

DISASTER TYPE: {disaster_type}
LOCATION: {location}
COUNTRY / JURISDICTION: {country_name}
STATUTORY EMERGENCY NUMBER: {emergency_num}
SEVERITY LEVEL: {severity}
ESTIMATED POPULATION AT RISK: {pop_at_risk:,}
AFFECTED SECTORS / ZONES: {', '.join(zones)}
LOCAL DESIGNATED SHELTERS: {', '.join([s.get('name', 'Community Evacuation Center') for s in resource_data.get('shelters', [])[:3]])}
AUTHORIZED RESPONDING AGENCIES: {country_info.get('rescue_title', 'USAR')}, {country_info.get('fire_title', 'Fire & Rescue')}, {country_info.get('police_title', 'Police')}
PRIMARY LANGUAGE: {primary_lang}
SECONDARY LANGUAGE: {secondary_lang}

Generate a comprehensive emergency alert package as JSON with EXACTLY this structure:
{{
  "public_alert": {{
    "english": "Authoritative public alert in English (2-3 sentences, urgent, unambiguous life-saving evacuation directive)",
    "hindi": "Emergency alert in {secondary_lang} (identical meaning translated accurately into natural {secondary_lang})",
    "regional": "Emergency alert in {tertiary_lang} / local vernacular (clear, urgent community instruction)"
  }},
  "sms_alert": {{
    "english": "Concise SMS / Cell Broadcast alert under 160 characters with action and helpline",
    "hindi": "SMS alert in {secondary_lang} under 160 characters"
  }},
  "evacuation_notice": {{
    "zones_to_evacuate": ["Priority evacuation zone 1", "Priority evacuation zone 2"],
    "safe_routes": ["Primary designated arterial evacuation corridor for {location}", "Secondary designated route"],
    "assembly_points": ["Primary community refuge in {location}", "Secondary rally point"],
    "evacuation_deadline": "Immediate / within 2 hours"
  }},
  "official_communication": {{
    "subject": "OFFICIAL ICS DIRECTIVE: {severity} {disaster_type.upper()} Response Activation — {location}",
    "body": "3-4 sentence statutory directive for unified incident command, inter-agency coordination, and asset staging.",
    "priority": "{severity}",
    "to": ["{country_info.get('admin_title', 'Incident Commander')}", "{country_info.get('rescue_title', 'USAR Command')}", "{country_info.get('medical_title', 'Health Director')}"]
  }},
  "media_advisory": {{
    "headline": "{severity} {disaster_type.title()} Warning Issued for {location}: Emergency Directives Active",
    "press_release": "3-4 sentence official press dispatch from Emergency Operations Center.",
    "key_numbers": {json.dumps(helplines)}
  }},
  "social_media": {{
    "twitter": "Emergency alert post under 280 characters with hashtags #{location.replace(' ', '').replace(',', '')} #{disaster_type.replace(' ', '')}",
    "whatsapp_broadcast": "Formatted mobile emergency bulletin with bullet points and helpline"
  }}
}}"""

    response_text = await call_gemini(prompt, SYSTEM_CONTEXT)

    try:
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        json_str = response_text[json_start:json_end]
        result = json.loads(json_str)
    except Exception:
        # Region-aware robust fallback
        if "united_states" in country_info.get("detected_key", "") or "miami" in location.lower() or "los angeles" in location.lower():
            sec_alert = f"⚠️ ALERTA DE EMERGENCIA: Advertencia {severity} por {disaster_type} en {location}. Evacúe de inmediato a los refugios asignados. Siga las instrucciones oficiales de FEMA y las autoridades locales."
            sec_sms = f"ALERTA: {severity} {disaster_type} en {location}. EVACUE AHORA. Llame al 911 o acuda al refugio mas cercano."
            safe_r = [f"Interstate Highway / Arterial Inland Corridor from {location}", "Designated County Evacuation Route"]
            to_list = ["County Emergency Management Director", "FEMA Region Incident Commander", "City Police Chief & Fire Chief"]
        elif "japan" in country_info.get("detected_key", "") or "tokyo" in location.lower():
            sec_alert = f"⚠️ 緊急避難警報：{location}において重大な{disaster_type}が発生しています。直ちに指定された高台・避難所に避難してください。生命の安全を最優先に行動してください。"
            sec_sms = f"緊急速報: {location}で{disaster_type}発生。直ちに高台避難。119/110番。"
            safe_r = ["Designated Prefectural Tsunami / Earthquake Evacuation Route", "Metropolitan Elevated Expressway Corridor"]
            to_list = ["Prefectural Governor", "Disaster Headquarters Commander", "JSDF Disaster Relief Liaison"]
        elif "europe" in country_info.get("detected_key", "") or "valencia" in location.lower() or "spain" in location.lower():
            sec_alert = f"⚠️ ALERTA PROTECCIÓN CIVIL: Aviso de nivel {severity} por {disaster_type} en {location}. Evacuen inmediatamente las zonas inundables hacia zonas altas. No crucen puentes ni vados."
            sec_sms = f"ALERTA CECOPI: {disaster_type} grave en {location}. Permanezca en zonas altas. Emergencias: 112."
            safe_r = ["Autovía hacia el interior / Cota elevada", "Corredor de evacuación asignado por Protección Civil"]
            to_list = ["Director del CECOPI", "Mando de la UME", "Consorcio Provincial de Bomberos"]
        elif "taiwan" in country_info.get("detected_key", "") or "hualien" in location.lower():
            sec_alert = f"⚠️ 災防告警：{location}發生{severity}級{disaster_type}。請沿指定避難路線立即疏散至避難收容處所，遠離危險坡地與沿海區域。"
            sec_sms = f"災防告警訊息: {location}發生{disaster_type}，請即刻避難。緊急電話: 119。"
            safe_r = ["省道內陸疏散避難幹道", "高處避難所引導路線"]
            to_list = ["中央災害應變中心指揮官", "縣市長", "消防局救災大隊長"]
        else:
            sec_alert = f"⚠️ आपातकालीन चेतावनी: {location} में {disaster_type} की {severity} चेतावनी। तुरंत निकटतम राहत आश्रय स्थल पर जाएं। जीवन-रक्षा आवश्यक है।"
            sec_sms = f"चेतावनी: {location} में {disaster_type}। तुरंत सुरक्षित आश्रय स्थल जाएं। हेल्पलाइन: {emergency_num}"
            safe_r = ["National Highway towards inland high ground", "Designated District Evacuation Corridor"]
            to_list = ["District Magistrate / Collector", "Disaster Management Authority EOC", "Commandant, Disaster Response Force"]

        result = {
            "public_alert": {
                "english": f"⚠️ LIFE-SAFETY EMERGENCY ALERT: {severity} {disaster_type} warning active for {location}. Immediate evacuation ordered for vulnerable zones. Move to designated relief shelters immediately and follow emergency instructions.",
                "hindi": sec_alert,
                "regional": f"🚨 URGENT CIVIL PROTECTION BROADCAST [{country_name.upper()}]: Unified Command active for {location}. All emergency corridors opened. Emergency response services deployed."
            },
            "sms_alert": {
                "english": f"ALERT: {severity} {disaster_type} in {location}. EVACUATE NOW to nearest shelter. Helpline: {emergency_num}",
                "hindi": sec_sms
            },
            "evacuation_notice": {
                "zones_to_evacuate": zones[:3] if zones else [location],
                "safe_routes": safe_r,
                "assembly_points": [s.get("name", "Civic Center Disaster Shelter") for s in resource_data.get("shelters", [])[:2]] or [f"{location} Municipal Complex"],
                "evacuation_deadline": "Immediate / within 2 hours"
            },
            "official_communication": {
                "subject": f"OFFICIAL STATUTORY DIRECTIVE: {severity} {disaster_type.upper()} Response Activation — {location}",
                "body": f"A {severity} level {disaster_type} incident is active in {location} impacting approximately {pop_at_risk:,} residents. Immediate activation of statutory disaster response protocols under {country_info.get('statutory_act', 'Emergency Framework')} is mandated. All primary responding cadres are placed on full operational mobilization.",
                "priority": severity,
                "to": to_list
            },
            "media_advisory": {
                "headline": f"{severity.title()} {disaster_type} Emergency Declared for {location}: Mass Evacuation in Progress",
                "press_release": f"The Unified Incident Command has declared a {severity} emergency for {location} due to an ongoing {disaster_type}. Over {pop_at_risk:,} residents are in high-hazard perimeters. Evacuation corridors are operational and emergency response units are actively on scene. Citizens are urged to heed official advisories.",
                "key_numbers": helplines
            },
            "social_media": {
                "twitter": f"🚨 {severity} {disaster_type.upper()} ALERT for {location}. EVACUATE IMMEDIATELY to designated shelters. Emergency lines: {emergency_num}. #EmergencyAlert #{location.replace(' ', '').replace(',', '')} #CrisisGuard",
                "whatsapp_broadcast": f"🚨 *EMERGENCY NOTIFICATION* 🚨\n\n*{disaster_type.upper()} WARNING* — {location}\n\n✅ Evacuate designated hazard zones\n✅ Proceed to certified shelters\n✅ Emergency Dial: *{emergency_num}*\n\nShare with all residents in {location}!"
            }
        }

    # Attach country & language metadata to result for frontend dynamic labels
    result["language_meta"] = {
        "country": country_name,
        "primary_lang": primary_lang,
        "secondary_lang": secondary_lang,
        "tertiary_lang": tertiary_lang,
        "lang_labels": lang_labels,
        "emergency_number": emergency_num,
        "helplines": helplines,
    }

    await emit("result", f"Generated localized alert package ({primary_lang}, {secondary_lang}, {tertiary_lang}) with statutory helplines ({emergency_num}).", result)

    return result
