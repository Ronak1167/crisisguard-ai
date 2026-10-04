"""
CrisisGuard AI - Global Multi-Agency Emergency Dispatch Service
Generates internationally compliant operational dispatch directives
tailored to specific public safety cadres (Specialized USAR/Rescue, Fire & HazMat, 
Police/Security, Apex Trauma/EMS, Incident Command EOC, and Forensic Inquest/DVI) 
based on disaster type, country/region framework, and severity level.
"""
from datetime import datetime
from typing import Dict, List, Any
import uuid

from services.real_data_service import detect_country_and_region


def generate_multi_agency_dispatch(
    disaster_type: str,
    location: str,
    severity: str,
    coordinates: Dict[str, float],
    telemetry: Dict[str, Any],
    facilities: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Constructs role-tailored emergency dispatch directives for distinct public safety agencies worldwide.
    Strictly enforces jurisdictional role demarcation: what is expected vs what is NOT their responsibility.
    """
    lat = coordinates.get("lat", 20.2724)
    lng = coordinates.get("lng", 85.8338)
    disaster = (disaster_type or "cyclone").lower()
    sev = (severity or "CRITICAL").upper()
    
    country_info = facilities.get("region_profile") or detect_country_and_region(location, lat, lng)
    country_name = country_info.get("country", "International")
    emergency_num = country_info.get("emergency_number", "112 / 911")
    statutory_act = country_info.get("statutory_act", "Emergency Civil Protection Framework")
    framework_name = country_info.get("framework", "Common Alerting Protocol (CAP v1.2)")

    # Country code for CAP ID prefix
    cc_map = {
        "India": "IN", "United States": "US", "Japan": "JP", "United Kingdom": "UK",
        "Europe": "EU", "European Union": "EU", "Taiwan": "TW", "Australia": "AU"
    }
    cc = cc_map.get(country_name, "GL")
    dispatch_id = f"CAP-{cc}-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    timestamp = datetime.utcnow().isoformat()
    
    # Extract nearby facilities for targeting
    hospitals = facilities.get("hospitals", [])
    fire_stations = facilities.get("fire_stations", [])
    police_stations = facilities.get("police_stations", [])
    rescue_bases = facilities.get("rescue_bases", [])
    shelters = facilities.get("shelters", [])
    investigation_units = facilities.get("investigation_units", [])

    # Format facility names and distances for agency targeting
    target_rescue = [f"{r.get('name')} ({r.get('distance_km', 'N/A')} km)" for r in rescue_bases[:2]] or [f"{country_info.get('rescue_title', 'USAR Task Force')} ({location})"]
    target_fire = [f"{f.get('name')} ({f.get('distance_km', 'N/A')} km)" for f in fire_stations[:2]] or [f"{country_info.get('fire_title', 'Fire Command')} ({location})"]
    target_police = [f"{p.get('name')} ({p.get('distance_km', 'N/A')} km)" for p in police_stations[:2]] or [f"{country_info.get('police_title', 'Police Headquarters')} ({location})"]
    target_medical = [f"{h.get('name')} ({h.get('distance_km', 'N/A')} km)" for h in hospitals[:2]] or [f"{country_info.get('medical_title', 'Apex Trauma Center')} ({location})"]
    target_admin = [f"{country_info.get('admin_title', 'Emergency Management Agency')} ({location})", f"Municipal Operations Cell ({location})"]
    target_inquest = [f"{u.get('name')} ({u.get('distance_km', 'N/A')} km)" for u in investigation_units[:2]] or [f"{country_info.get('inquest_title', 'Forensic Inquest Division')} ({location})"]

    wind_speed = telemetry.get("wind_speed_kmh", 25)
    temp = telemetry.get("temperature_c", 28)

    # -------------------------------------------------------------
    # 1. Specialized Search & Rescue (USAR) Directive
    # -------------------------------------------------------------
    if "flood" in disaster or "tsunami" in disaster:
        rescue_mission = "Conduct swift water and maritime rescue in inundated residential sectors; extract marooned civilians using shallow-draft motorized rescue craft."
        rescue_gear = [
            "Inflatable Rescue Boats (IRB) & High-Torque Outboard Motors",
            "Type-V PFD Life Vests and High-Buoyancy Rings (500 units)",
            "Under-Water Sonar Victim Scanners & Submersible Search Drones",
            "High-tensile static kernmantle rope systems & river ziplines",
            "Amphibious All-Terrain Transport Craft"
        ]
        rescue_expected = [
            "Deploy motorized rescue craft directly into submerged streets and rooftop clusters",
            "Prioritize evacuation of geriatric, pediatric, and medically dependent citizens",
            "Coordinate with military/coast guard aviation units for helicopter hoist winching in cut-off zones",
            "Deliver emergency survival hydration packs and water purification tablets to isolated clusters"
        ]
        rescue_not_expected = [
            "DO NOT engage in dry-land vehicular traffic redirection (Law Enforcement domain)",
            "DO NOT manage evacuation shelter food distribution or community registers (Civil Administration domain)",
            "DO NOT operate heavy building demolition equipment unless structural collapse co-occurs"
        ]
    elif "earthquake" in disaster:
        rescue_mission = "Execute Collapsed Structure Search & Rescue (CSSR), acoustic void space listening, and canine-guided live victim extraction."
        rescue_gear = [
            "Acoustic / Seismic Life Detectors (DelSAR Audio Listening Systems)",
            "Fiber-optic Telescopic Search Cameras (SearchCam)",
            "Diamond-tip Rotary Concrete Cutters and Hydraulic Spreading Jaws",
            "Pneumatic Shoring Struts and Paratech High-Pressure Lifting Bags",
            "Canine USAR Scent Squads (Urban Search and Rescue Dogs)"
        ]
        rescue_expected = [
            "Establish standardized structural triage markings (INSARAG / FEMA international spray code)",
            "Perform technical void space exploration in collapsed multistory concrete buildings",
            "Erect pneumatic and timber shoring to stabilize overhangs before inserting rescue personnel",
            "Enforce scheduled 10-minute field silence windows across epicenter to capture tapped distress frequencies"
        ]
        rescue_not_expected = [
            "DO NOT clear general roadways unless directly obstructing an active CSSR rescue site (Fire/Public Works domain)",
            "DO NOT perform field surgeries or complex hospital procedures (transfer extracted casualties immediately to EMS)",
            "DO NOT enforce curfew or perimeter security cordons (Police domain)"
        ]
    elif "wildfire" in disaster:
        rescue_mission = "Deploy wildland search & rescue teams to perimeter interface zones; extract isolated hikers, rural residents, and vulnerable populations."
        rescue_gear = [
            "Wildland Fire Protective Ensembles & Fire Shelters (Aramid/Nomex)",
            "Thermal Imaging FLIR Drones for smoke-penetrating human detection",
            "High-clearance 4x4 off-road evacuation personnel carriers",
            "Emergency escape breathing devices (EEBD) for civilian extractions",
            "Satellite emergency tracking beacons"
        ]
        rescue_expected = [
            "Conduct rapid sweeps of threatened rural and canyon residential clusters ahead of fire fronts",
            "Coordinate emergency evacuation corridors with aerial spotter aircraft",
            "Extricate trapped civilians through advancing smoke layers using personal thermal cameras"
        ]
        rescue_not_expected = [
            "DO NOT direct frontline heavy wildland fire engine containment attacks (Fire Department domain)",
            "DO NOT coordinate municipal utility power shutoffs (Civil Protection & Utility domain)"
        ]
    elif "cyclone" in disaster or "typhoon" in disaster or "hurricane" in disaster:
        rescue_mission = "Pre-position amphibious and high-clearance tactical rescue units to storm surge sectors; breach debris blockades and execute coastal extrications."
        rescue_gear = [
            "Heavy-draft motorized storm rescue craft",
            "Hydraulic cable cutters and gas-powered demolition saws",
            "Satellite emergency transceivers (Inmarsat/Iridium)",
            "High-tensile water rescue throw-bags and lifeline spools",
            "Night-vision tactical search goggles and high-output LED flood pods"
        ]
        rescue_expected = [
            "Execute mandatory sweeps in vulnerable low-lying coastal zones within 5km of shoreline",
            "Safely transfer families trapped by storm surge breaches into designated hardened disaster shelters",
            "Maintain uninterrupted tactical radio link with Incident Command EOC on dedicated emergency channel"
        ]
        rescue_not_expected = [
            "DO NOT operate municipal drainage pumping stations (Fire & Public Works domain)",
            "DO NOT oversee electrical grid high-voltage line repair (Power Utility domain)",
            "DO NOT manage arterial highway roadblock diversions (Police domain)"
        ]
    else:  # HazMat / Industrial / General
        rescue_mission = "Deploy specialized technical rescue units, hazardous material shoring squads, and technical extraction personnel."
        rescue_gear = [
            "Level-A Chemical Encapsulating Gas-Tight Suits",
            "Multi-gas Photoionization Detectors (PID & Lower Explosive Limit)",
            "Heavy hydraulic extrication spreaders and high-pressure air jacks",
            "Thermal imaging perimeter surveillance drones"
        ]
        rescue_expected = [
            "Establish Warm and Hot Zone operational boundaries with Fire Incident Commander",
            "Execute technical extraction of victims trapped in contaminated or unstable structures",
            "Perform primary field decontamination prior to handoff to medical paramedics"
        ]
        rescue_not_expected = [
            "DO NOT extinguish primary petrochemical blazes (Fire Department domain)",
            "DO NOT conduct forensic criminal investigations (Investigative & Forensic domain)"
        ]

    # -------------------------------------------------------------
    # 2. Fire & Emergency Services Directive
    # -------------------------------------------------------------
    if "flood" in disaster:
        fire_mission = "Deploy high-volume dewatering pumps to salvage critical electrical substations, hospital basements, and clear fallen debris from arterial access routes."
        fire_gear = [
            "Trailer-mounted High-Discharge Dewatering Pumps (3,000 - 6,000 Litres/Min)",
            "Submersible sludge pumps with 150m discharge hoses",
            "Gas-powered heavy chainsaws and hydraulic pole pruners",
            "Mobile diesel floodlight towers (4x1000W)",
            "High-voltage electrical grappling tools and insulated pole hooks"
        ]
        fire_expected = [
            "Continuous suction dewatering at Apex Trauma Hospitals and main electrical substations to prevent blackouts",
            "Rapid clearing of uprooted trees and overhead electric wires blocking primary ambulance corridors",
            "Extrication of motorists pinned in submerged passenger vehicles or underground garages",
            "Extinguish localized electrical fires triggered by water ingress"
        ]
        fire_not_expected = [
            "DO NOT navigate swift open-river currents without specialized USAR boat accompaniment",
            "DO NOT manage civilian shelter intake registration or food provisioning",
            "DO NOT handle civil disorder protests or anti-looting security cordons"
        ]
    elif "cyclone" in disaster or "typhoon" in disaster or "hurricane" in disaster:
        fire_mission = "Arterial Road Clearance Task Force: Clear downed trees, mangled steel signage, and energized cables to restore critical mobility corridors."
        fire_gear = [
            "Heavy Rescue Tenders (HRT) equipped with crane winches",
            "High-RPM Commercial Chainsaws (20 units)",
            "Hydraulic Jaws of Life (Lucas Spreader/Cutter combos)",
            "High-capacity portable dewatering pump units",
            "Spark-proof safety axes and Kevlar cut-resistant gloves"
        ]
        fire_expected = [
            "Clear arterial highways connecting disaster epicenter to Regional Apex Trauma Centers",
            "Neutralize live electrical hazards in coordination with Power Grid authorities (confirm isolation before cutting)",
            "Extricate drivers and passengers pinned in crushed vehicles or collapsed light structures"
        ]
        fire_not_expected = [
            "DO NOT manage disaster shelter feeding and welfare logistics",
            "DO NOT perform structural demolition on multi-story buildings without structural engineer authorization",
            "DO NOT undertake offshore marine vessel salvage operations"
        ]
    elif "wildfire" in disaster:
        fire_mission = "Frontline Wildland-Urban Interface (WUI) Suppression, Structure Defense, and Defensible Space Enforcement."
        fire_gear = [
            "Type-3 and Type-6 Wildland Fire Engines with All-Wheel Drive",
            "Class-A Fire Suppression Foam Systems and Water Tender Bowsers",
            "Drip torches, McLeod fire tools, and Pulaski grub axes for fireline trenching",
            "High-capacity portable relay pumps and forestry hose packs",
            "Aerial retardant drop tactical coordination radio links"
        ]
        fire_expected = [
            "Establish defensive perimeters around residential subdivisions threatened by active fire fronts",
            "Construct mineral soil firebreaks and conduct controlled burnout operations where authorized",
            "Extinguish ember ignitions on residential roofs and structural eaves",
            "Direct tactical aerial retardant air-tanker drops via tactical air coordination"
        ]
        fire_not_expected = [
            "DO NOT conduct forensic wildfire cause investigations until scene is fully overhauled",
            "DO NOT treat severe burn shock beyond field airway stabilization (pass immediately to Trauma ICU)"
        ]
    else:  # Earthquake / General / HazMat
        fire_mission = "Urban Extrication, Gas Leak Containment, HazMat Mitigation, and Structural Fire Suppression."
        fire_gear = [
            "Hydraulic rescue rams and spreaders (Heavy Extrication)",
            "Combustible and toxic gas sniffers (Methane / LPG / Ammonia sensors)",
            "Positive Pressure Ventilation (PPV) smoke ejectors",
            "High-output portable generator lighting arrays"
        ]
        fire_expected = [
            "Isolate ruptured domestic and commercial natural gas supply lines to avert post-disaster infernos",
            "Extricate lightly-trapped victims from damaged ground floors and passenger vehicles",
            "Douse localized fires sparked by severed electrical transformers and ruptured utility mains"
        ]
        fire_not_expected = [
            "DO NOT conduct subterranean void tunneling without USAR technical shoring specialists",
            "DO NOT enter structures with visible pancake collapse before technical shoring struts are placed"
        ]

    # -------------------------------------------------------------
    # 3. Police Department & Traffic Enforcement Directive
    # -------------------------------------------------------------
    police_mission = f"Enforce Inner & Outer Perimeter Security, Establish Unimpeded Green Corridors for Emergency Convoys, Maintain Civil Order, and Prevent Looting in Evacuated Zones ({location})."
    police_gear = [
        "Highway Patrol Interceptor Vehicles with High-Decibel Siren PA systems",
        "Reflective Traffic Barricades and High-Visibility Hazard Cordon Tape (5,000 meters)",
        "Encrypted Digital VHF / TETRA Tactical Wireless Handsets",
        "Body-worn high-definition video recorders",
        "Tactical crowd management and protective security gear",
        "Automated License Plate Readers (ALPR) for traffic diversion checkpoints"
    ]
    police_expected = [
        f"Impose mandatory inner perimeter (Hot Zone cordon) at {lat:.4f}°N, {lng:.4f}°E — permit ONLY verified USAR, Fire, and Ambulance vehicles",
        "Create dedicated, non-stop 'Green Corridors' along primary arterial roadways towards Regional Apex Trauma Centers",
        "Broadcast urgent evacuation instructions through mobile PA speaker cruisers in relevant local languages",
        "Deploy armed mobile and foot patrols in vacated residential/commercial sectors to deter property theft",
        f"Enforce statutory emergency movement restrictions under {statutory_act}"
    ]
    police_not_expected = [
        "DO NOT enter structural collapse voids or deep floodwaters without specialized rescue PPE (alert USAR/Fire instead)",
        "DO NOT attempt to administer advanced medical injections or surgical trauma care",
        "DO NOT commandeer private property without formal requisition authority from Incident Command EOC"
    ]

    # -------------------------------------------------------------
    # 4. Medical Health & Apex Trauma Centers Directive
    # -------------------------------------------------------------
    med_mission = f"Activate Hospital Mass Casualty Incident (MCI) Code Red, Reserve Emergency Surge Beds ({facilities.get('summary', {}).get('total_surge_beds', 450)} beds), Mobilize Trauma Surgical Teams, and Deploy Mobile Field Clinics."
    med_gear = [
        "Advanced Life Support (ALS) Ambulances with Defibrillators & Transport Ventilators",
        "Emergency Mass Triage Tagging Bundles (START Protocol: Red/Yellow/Green/Black)",
        "O-Negative Blood Reserves (minimum 150 units cold-stored)",
        "Emergency Crush Syndrome & Trauma Infusion Kits (IV Saline, Sodium Bicarb, Mannitol)",
        "Burn Dressing Hydrogels and Anti-tetanus/Anti-venom stock",
        "Auxiliary Diesel Emergency Power Units for ICU / Oxygen concentrator isolation"
    ]
    med_expected = [
        "Discharge or transfer non-critical elective patients to release 35% bed capacity across Trauma, ICU, and Post-Op wards",
        "Establish an outdoor Pre-Hospital Triage Deck at ambulance entrance bays to sort arriving casualties",
        "Mobilize on-call orthopedic, neurosurgical, and vascular trauma surgeons into immediate 12-hour shifts",
        "Deploy Advanced Life Support mobile ambulances to designated Disaster Forward Staging Areas",
        "Initiate epidemiological syndromic surveillance in relief shelters to prevent waterborne or infectious outbreaks"
    ]
    med_not_expected = [
        "DO NOT deploy medical physicians or nursing staff into un-cleared structural collapse zones",
        "DO NOT transport medical supplies in non-sanitized general goods vehicles",
        "DO NOT release unverified casualty statistics to media (only Incident Commander / Chief Medical Officer authorized)"
    ]

    # -------------------------------------------------------------
    # 5. Government Incident Command & Civil Protection EOC Directive
    # -------------------------------------------------------------
    admin_mission = f"Exercise Statutory Unified Incident Command under {statutory_act}, Activate Emergency Shelters, Mobilize Strategic Relief Supply Chains, and Oversee Civil Protection."
    admin_gear = [
        "Emergency Operations Centre (EOC) Multi-Screen Command Console",
        "Satellite Phones (Iridium / Inmarsat / Thuraya) with solar charging packs",
        "Potable Drinking Water Bowsers (10,000 Litre Food-Grade Tankers)",
        "Mobile Community Kitchen / Meal Provisioning Vans (5,000 meals/hour)",
        "Civil Protection & Community Emergency Volunteer Rosters",
        "Disaster Relief Compensation Fast-Track Digitization Terminals"
    ]
    admin_expected = [
        f"Issue formal Disaster Emergency Declaration under {statutory_act} for {location}",
        f"Unlock, staff, and provision all {len(shelters)} verified emergency shelters with bedding, sanitation, and auxiliary power",
        "Requisition public/commercial transit vehicles, earthmovers, and buses for mass civilian evacuation",
        "Ensure uninterrupted municipal drinking water supply and essential infant formula distribution across relief camps",
        "Convene unified inter-agency command briefings every 4 hours with USAR, Police, Fire, and Medical Chiefs"
    ]
    admin_not_expected = [
        "DO NOT micromanage on-ground tactical squad rescue maneuvers (delegate operational decisions to USAR/Fire field commanders)",
        "DO NOT delay emergency relief resource allocation through excessive bureaucratic sign-offs",
        "DO NOT permit non-essential VIP visits or unauthorized gatherings inside active rescue hot zones"
    ]

    # -------------------------------------------------------------
    # 6. Forensic Inquest, Accident Investigation & Victim ID Directive
    # -------------------------------------------------------------
    if "fire" in disaster or "industrial" in disaster:
        inquest_role = "Investigate Arson, Industrial Safety Code Violations, Factory Regulatory Breaches, and Forensic Root Cause Analysis."
        inquest_focus = "Chemical valve tampering, boiler pressure anomalies, unauthorized volatile chemical storage, and electrical safety neglect."
    elif "earthquake" in disaster or "landslide" in disaster:
        inquest_role = "Disaster Victim Identification (DVI), Building Structural Integrity Inquest, Substandard Construction Material Compliance Review."
        inquest_focus = "Substandard concrete aggregate, unapproved architectural alterations, illegal slope excavation, and building permit compliance."
    else:  # Cyclone / Flood / Storm
        inquest_role = "Disaster Victim Identification (DVI), Dam Water Release Protocol Inquest, Flood Embankment Integrity Failure Investigation."
        inquest_focus = "Spillway operation adherence, levee maintenance audit, and legal chain-of-custody for missing individuals."

    inquest_gear = [
        "Disaster Victim Identification (DVI) Rapid DNA and Odontology Analysis Kits (INTERPOL Standards)",
        "3D Terrestrial LiDAR Disaster Scene Scanners",
        "Forensic Evidence Sealing Bags and Tamper-Evident Chain-of-Custody Containers",
        "Structural Core Concrete Sampling Drills & Metallurgical XRF Analyzers",
        "Digital Data Extraction Hardware for Industrial SCADA / Flight / Telemetry Black Boxes"
    ]
    inquest_expected = [
        "Assist Coroner / Medical Examiner with dignified, ISO/INTERPOL-compliant Disaster Victim Identification (DVI)",
        "Impound maintenance logs, structural blueprints, safety inspection permits, and sensor data before alteration",
        "Map structural collapse fracture points and failure propagation using high-precision 3D photogrammetry drones",
        "Prepare independent, tamper-proof statutory investigative brief for Judicial Court / National Safety Board"
    ]
    inquest_not_expected = [
        "STRICTLY FORBIDDEN from entering active rescue hot zones before USAR/Fire Incident Commander certifies scene safe",
        "DO NOT impede ambulances, fire tenders, or rescue squads to collect forensic samples",
        "DO NOT release speculative blame statements to news media prior to laboratory verification"
    ]

    # Build individual Agency Dispatch Packages
    agencies_dispatch = {
        "rescue_ndrf": {
            "agency_id": f"USAR-CADRE-{cc}",
            "agency_name": country_info.get("rescue_title", "Urban Search & Rescue Task Force"),
            "icon_type": "rescue",
            "color": "#eab308",
            "badge": "SPECIALIZED RESCUE",
            "target_units": target_rescue,
            "operational_urgency": "IMMEDIATE (Priority-1 Alpha)",
            "radio_frequency": "VHF-CH-03 (Tactical Rescue Channel)",
            "erss_cadre_code": f"SAR-{cc}-SPEC-01",
            "operational_mission": rescue_mission,
            "equipment_required": rescue_gear,
            "role_and_need": f"Primary specialized technical extraction authority for {location}. Possesses heavy hydraulic shoring and swift-water rescue craft required for this {sev} {disaster_type}.",
            "expected_actions": rescue_expected,
            "not_expected_boundaries": rescue_not_expected,
            "personnel_deployed": sum(r.get("personnel", 0) for r in rescue_bases) or 180,
            "status": "READY_FOR_TRANSMISSION",
            "dispatch_memo": (
                f"OPERATIONAL DISPATCH DIRECTIVE [IMMEDIATE TRANSMISSION]\n"
                f"TO: {', '.join(target_rescue)}\n"
                f"FROM: CrisisGuard Incident Command Center (CAP-ID: {dispatch_id})\n"
                f"INCIDENT: {sev} {disaster_type.upper()} at {location} ({lat:.4f}°N, {lng:.4f}°E)\n"
                f"MISSION: {rescue_mission}\n"
                f"MANDATORY GEAR: {', '.join(rescue_gear[:3])}\n"
                f"TACTICAL COMMS: VHF-CH-03 | GPS EPICENTER: {lat:.4f}, {lng:.4f}\n"
                f"AUTHORITY: {statutory_act}"
            )
        },
        "fire_service": {
            "agency_id": f"FIRE-CADRE-{cc}",
            "agency_name": country_info.get("fire_title", "Metropolitan Fire & Rescue Department"),
            "icon_type": "fire",
            "color": "#f97316",
            "badge": "HAZARD MITIGATION",
            "target_units": target_fire,
            "operational_urgency": "IMMEDIATE (Priority-1)",
            "radio_frequency": "VHF-CH-07 (Fire Command Frequency)",
            "erss_cadre_code": f"FIRE-{cc}-DEWATER-EXTRICATE",
            "operational_mission": fire_mission,
            "equipment_required": fire_gear,
            "role_and_need": f"Essential for frontline road clearance, high-capacity dewatering at hospitals and substations, and mitigating fire hazards caused by {disaster_type} impact.",
            "expected_actions": fire_expected,
            "not_expected_boundaries": fire_not_expected,
            "personnel_deployed": sum(f.get("personnel", 0) for f in fire_stations) or 85,
            "status": "READY_FOR_TRANSMISSION",
            "dispatch_memo": (
                f"OPERATIONAL DISPATCH DIRECTIVE [IMMEDIATE TRANSMISSION]\n"
                f"TO: {', '.join(target_fire)}\n"
                f"FROM: CrisisGuard Incident Command Center (CAP-ID: {dispatch_id})\n"
                f"INCIDENT: {sev} {disaster_type.upper()} at {location} ({lat:.4f}°N, {lng:.4f}°E)\n"
                f"MISSION: {fire_mission}\n"
                f"MANDATORY GEAR: {', '.join(fire_gear[:3])}\n"
                f"TACTICAL COMMS: VHF-CH-07 | ROAD ACCESS CLEARANCE PRIORITY 1"
            )
        },
        "police_department": {
            "agency_id": f"POLICE-CADRE-{cc}",
            "agency_name": country_info.get("police_title", "Police Force & Traffic Command"),
            "icon_type": "police",
            "color": "#3b82f6",
            "badge": "SECURITY & CORRIDORS",
            "target_units": target_police,
            "operational_urgency": "HIGH (Immediate Perimeter Lockdown)",
            "radio_frequency": "VHF-CH-01 (Police Tactical Command)",
            "erss_cadre_code": f"LAW-{cc}-PERIMETER-ESCORT",
            "operational_mission": police_mission,
            "equipment_required": police_gear,
            "role_and_need": f"Critical to prevent traffic gridlock on arterial evacuation routes, establish unhindered ambulance corridors to local Apex Trauma Hospitals, and prevent property theft in evacuated sectors of {location}.",
            "expected_actions": police_expected,
            "not_expected_boundaries": police_not_expected,
            "personnel_deployed": sum(p.get("officers", 0) for p in police_stations) or 150,
            "status": "READY_FOR_TRANSMISSION",
            "dispatch_memo": (
                f"OPERATIONAL DISPATCH DIRECTIVE [IMMEDIATE TRANSMISSION]\n"
                f"TO: {', '.join(target_police)}\n"
                f"FROM: CrisisGuard Incident Command Center (CAP-ID: {dispatch_id})\n"
                f"INCIDENT: {sev} {disaster_type.upper()} at {location}\n"
                f"MISSION: {police_mission}\n"
                f"IMMEDIATE ACTION: Impose mandatory outer security cordon. Establish Green Corridor on primary arterial route. Night anti-looting squads active."
            )
        },
        "medical_health": {
            "agency_id": f"MED-CADRE-{cc}",
            "agency_name": country_info.get("medical_title", "Apex Trauma Centers & Emergency Medical Services"),
            "icon_type": "hospital",
            "color": "#10b981",
            "badge": "MASS CASUALTY CARE",
            "target_units": target_medical,
            "operational_urgency": "CRITICAL (Mass Casualty Triage Protocol)",
            "radio_frequency": "VHF-CH-09 (EMS Triage Frequency)",
            "erss_cadre_code": f"MCI-{cc}-SURGE-TRAUMA",
            "operational_mission": med_mission,
            "equipment_required": med_gear,
            "role_and_need": f"Mandatory to receive, triage, and stabilize victims suffering from trauma, hypothermia, crush injuries, and shock. Immediate surge bed reservation of {facilities.get('summary', {}).get('total_surge_beds', 450)} beds required.",
            "expected_actions": med_expected,
            "not_expected_boundaries": med_not_expected,
            "personnel_deployed": len(hospitals) * 45,
            "status": "READY_FOR_TRANSMISSION",
            "dispatch_memo": (
                f"OPERATIONAL DISPATCH DIRECTIVE [IMMEDIATE TRANSMISSION]\n"
                f"TO: {', '.join(target_medical)}\n"
                f"FROM: CrisisGuard Incident Command Center (CAP-ID: {dispatch_id})\n"
                f"INCIDENT: {sev} {disaster_type.upper()} at {location}\n"
                f"MCI LEVEL: CODE RED MASS CASUALTY PROTOCOL ACTIVATED\n"
                f"ACTION: Pre-hospital triage bay ready. Reserve ICU & Trauma beds. Stock O-Negative blood. Auxiliary power isolated."
            )
        },
        "district_administration": {
            "agency_id": f"GOV-CADRE-{cc}",
            "agency_name": country_info.get("admin_title", "Incident Command Emergency Operations Center (EOC)"),
            "icon_type": "government",
            "color": "#0ea5e9",
            "badge": "CIVIL INCIDENT COMMAND",
            "target_units": target_admin,
            "operational_urgency": "IMMEDIATE (Statutory Unified Command)",
            "radio_frequency": "VHF-CH-12 (EOC Strategic Net)",
            "erss_cadre_code": f"EOC-{cc}-UNIFIED-COMMAND",
            "operational_mission": admin_mission,
            "equipment_required": admin_gear,
            "role_and_need": f"Statutory administrative authority to enact powers under {statutory_act}, requisition public transport, open all {len(shelters)} disaster shelters, and mobilize mass food and potable water logistics.",
            "expected_actions": admin_expected,
            "not_expected_boundaries": admin_not_expected,
            "personnel_deployed": 120,
            "status": "READY_FOR_TRANSMISSION",
            "dispatch_memo": (
                f"OPERATIONAL DISPATCH DIRECTIVE [IMMEDIATE TRANSMISSION]\n"
                f"TO: {', '.join(target_admin)}\n"
                f"FROM: CrisisGuard Incident Command Center (CAP-ID: {dispatch_id})\n"
                f"INCIDENT: {sev} {disaster_type.upper()} at {location}\n"
                f"EXERCISE: Statutory emergency powers under {statutory_act}. Open all designated emergency shelters. Deploy potable water bowsers. Daily inter-agency briefings scheduled."
            )
        },
        "investigation_forensic": {
            "agency_id": f"INQUEST-CADRE-{cc}",
            "agency_name": country_info.get("inquest_title", "Forensic Investigation Division & DVI Bureau"),
            "icon_type": "investigation",
            "color": "#a855f7",
            "badge": "FORENSIC INQUEST & DVI",
            "target_units": target_inquest,
            "operational_urgency": "STANDBY / PHASE-2 (Forensic Chain of Custody & Victim ID)",
            "radio_frequency": "SECURE-DATA-NET (Encrypted Digital Inquest)",
            "erss_cadre_code": f"DVI-{cc}-FORENSIC-INQUEST",
            "operational_mission": inquest_role,
            "equipment_required": inquest_gear,
            "role_and_need": f"Statutory forensic necessity for {inquest_focus} and dignified Disaster Victim Identification (DVI) using DNA and odontology protocols.",
            "expected_actions": inquest_expected,
            "not_expected_boundaries": inquest_not_expected,
            "personnel_deployed": 45,
            "status": "READY_FOR_TRANSMISSION",
            "dispatch_memo": (
                f"STATUTORY FORENSIC DIRECTIVE [PHASE 2 DEPLOYMENT]\n"
                f"TO: {', '.join(target_inquest)}\n"
                f"FROM: CrisisGuard Incident Command Center (CAP-ID: {dispatch_id})\n"
                f"INCIDENT: {sev} {disaster_type.upper()} at {location}\n"
                f"MANDATE: Impound construction/industrial records and telemetry logs. Prepare DVI sampling kits. DO NOT interfere with active life-saving rescue squads."
            )
        }
    }

    return {
        "dispatch_id": dispatch_id,
        "protocol": f"Common Alerting Protocol (CAP v1.2) / {framework_name}",
        "statutory_act": statutory_act,
        "country": country_name,
        "emergency_number": emergency_num,
        "timestamp": timestamp,
        "disaster_type": disaster_type,
        "severity": sev,
        "location": location,
        "coordinates": {"lat": lat, "lng": lng},
        "telemetry_snapshot": {
            "wind_speed_kmh": wind_speed,
            "temperature_c": temp,
            "provider": telemetry.get("provider", "Open-Meteo Satellite Feeds")
        },
        "total_agencies_count": len(agencies_dispatch),
        "total_responding_personnel": sum(a["personnel_deployed"] for a in agencies_dispatch.values()),
        "agencies": agencies_dispatch,
        "transmission_status": "PENDING_BROADCAST"
    }
