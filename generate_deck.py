import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_pitch_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)       # Slate 900
    CARD_BG = RGBColor(30, 41, 59)       # Slate 800
    ACCENT_CYAN = RGBColor(0, 240, 255)  # Cyan
    ACCENT_RED = RGBColor(239, 68, 68)   # Red
    ACCENT_GREEN = RGBColor(16, 185, 129)# Green
    TEXT_LIGHT = RGBColor(248, 250, 252) # White
    TEXT_MUTED = RGBColor(148, 163, 184) # Slate 400

    def set_bg(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_DARK

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=None):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        if border_color:
            shape.line.color.rgb = border_color
            shape.line.width = Pt(1.5)
        else:
            shape.line.fill.background()
        return shape

    # SLIDE 1: Title Slide
    s1 = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(s1)

    # Accent badge
    add_card(s1, Inches(1.0), Inches(1.2), Inches(4.5), Inches(0.5), bg_color=RGBColor(30, 58, 138), border_color=ACCENT_CYAN)
    badge_tx = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(4.5), Inches(0.5))
    p = badge_tx.text_frame.paragraphs[0]
    p.text = "🏆 WCC LAUNCHPAD 30 · AGENTIC AI TRACK"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    # Title
    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(11.3), Inches(2.0))
    p = t_box.text_frame.paragraphs[0]
    p.text = "CrisisGuard AI"
    p.font.size = Pt(56)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    p2 = t_box.text_frame.add_paragraph()
    p2.text = "Autonomous Multi-Agent Emergency Operations & Disaster Dispatch Platform"
    p2.font.size = Pt(24)
    p2.font.color.rgb = ACCENT_CYAN

    p3 = t_box.text_frame.add_paragraph()
    p3.text = '"When every second counts in a disaster, AI autonomous agents coordinate everything in under 60 seconds."'
    p3.font.size = Pt(15)
    p3.font.italic = True
    p3.font.color.rgb = TEXT_MUTED

    # Highlights row
    h_data = [
        ("⏱️ < 45 Seconds", "End-to-End Multi-Cadre Coordination"),
        ("🤖 4 Autonomous Agents", "Intelligence, Resource, Alert & Response"),
        ("📡 CAP v1.2 Protocol", "Encrypted Multi-Agency Direct Routing"),
        ("🌐 Multilingual Alerts", "Native Regional Emergency Broadcasts")
    ]
    for i, (hd, sub) in enumerate(h_data):
        x = Inches(1.0 + i * 2.9)
        add_card(s1, x, Inches(4.8), Inches(2.7), Inches(1.6), bg_color=CARD_BG, border_color=RGBColor(51, 65, 85))
        box = s1.shapes.add_textbox(x + Inches(0.15), Inches(4.9), Inches(2.4), Inches(1.4))
        p = box.text_frame.paragraphs[0]
        p.text = hd
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        p2 = box.text_frame.add_paragraph()
        p2.text = sub
        p2.font.size = Pt(12)
        p2.font.color.rgb = TEXT_MUTED

    # SLIDE 2: The Problem
    s2 = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(s2)

    title_box = s2.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.0))
    p = title_box.text_frame.paragraphs[0]
    p.text = "The Crisis: The 72-Hour Golden Rescue Window"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    probs = [
        ("❌ Fragmented Communication Silos", "First responders (NDRF/FEMA, Police, Fire, DMAT, Hospitals) operate on separate communication channels, losing 4 to 6 critical hours in bureaucratic handoffs."),
        ("❌ Linguistic Warning Delays", "Emergency broadcasts are drafted manually in standard languages, failing to reach vulnerable rural populations in their native vernacular before disaster strikes."),
        ("❌ Blind Resource Allocation", "Incident commanders lack real-time GIS spatial distance and surge capacity verification (ICU beds, dewatering pumps, rescue boats), leading to misallocated assets."),
        ("❌ Human-In-The-Loop Fatigue", "High-stress cognitive overload causes bottlenecks in approving evacuations, declaring hotspots, and dispatching rescue personnel during the first critical hours.")
    ]
    for i, (pt, desc) in enumerate(probs):
        col = i % 2
        row = i // 2
        x = Inches(1.0 + col * 5.8)
        y = Inches(2.0 + row * 2.4)
        add_card(s2, x, y, Inches(5.5), Inches(2.1), bg_color=CARD_BG, border_color=RGBColor(239, 68, 68))
        box = s2.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), Inches(5.1), Inches(1.8))
        p = box.text_frame.paragraphs[0]
        p.text = pt
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = ACCENT_RED
        p2 = box.text_frame.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_LIGHT

    # SLIDE 3: The Multi-Agent Solution
    s3 = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(s3)

    title_box = s3.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.0))
    p = title_box.text_frame.paragraphs[0]
    p.text = "Autonomous Multi-Agent Architecture"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    agents = [
        ("🔍 Intelligence Agent", "Hazard Classification & Impact", "Estimates affected radius (km), severity score, casualties, and infrastructure vulnerability using Gemini 1.5 Flash.", ACCENT_CYAN),
        ("🗺️ Resource Mapper Agent", "Live GIS Tactical Telemetry", "Queries OpenStreetMap Overpass API for real-time hospitals, trauma beds, fire stations, dewatering pumps, and shelters.", ACCENT_GREEN),
        ("📢 Alert Agent", "Multilingual Emergency Broadcast", "Synthesizes simultaneous emergency warnings in English, Hindi, and regional dialects with actionable guidance.", RGBColor(245, 158, 11)),
        ("🎯 Response Coordinator", "Operational Plan & HITL Gates", "Generates prioritized tasks with assigned owners, calculates Lives-Saved metrics, and triggers authorization gates.", RGBColor(168, 85, 247))
    ]
    for i, (name, tag, details, color) in enumerate(agents):
        x = Inches(1.0 + i * 2.9)
        add_card(s3, x, Inches(2.0), Inches(2.7), Inches(4.8), bg_color=CARD_BG, border_color=color)
        box = s3.shapes.add_textbox(x + Inches(0.15), Inches(2.2), Inches(2.4), Inches(4.4))
        p = box.text_frame.paragraphs[0]
        p.text = name
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = color
        p2 = box.text_frame.add_paragraph()
        p2.text = tag
        p2.font.size = Pt(12)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_LIGHT
        p3 = box.text_frame.add_paragraph()
        p3.text = details
        p3.font.size = Pt(12)
        p3.font.color.rgb = TEXT_MUTED

    # SLIDE 4: CAP v1.2 Dispatch Console
    s4 = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(s4)

    title_box = s4.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.0))
    p = title_box.text_frame.paragraphs[0]
    p.text = "Innovation: Multi-Agency Rescue Dispatch Console"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    features = [
        ("📡 Direct Cadre Automated Routing", "Standardized CAP v1.2 automated dispatches directly to NDRF/FEMA USAR, Hospital Surge DMAT, Fire/HazMat, Police, and Civil Defense."),
        ("🛡️ Grounded in Statutory Frameworks", "Automatically embeds statutory disaster acts (e.g. Disaster Management Act 2005, Robert T. Stafford Disaster Relief Act) into every transmission memo."),
        ("🔒 Per-Emergency Isolation & Memory", "Maintains isolated dispatch state per incident with persistent cryptographic receipts and live latency tracking (45-75ms)."),
        ("↻ Re-Broadcast Situational Updates", "Allows incident commanders to re-transmit fresh situational orders anytime with live feedback across all active cadre networks.")
    ]
    for i, (head, desc) in enumerate(features):
        col = i % 2
        row = i // 2
        x = Inches(1.0 + col * 5.8)
        y = Inches(2.0 + row * 2.4)
        add_card(s4, x, y, Inches(5.5), Inches(2.1), bg_color=CARD_BG, border_color=ACCENT_CYAN)
        box = s4.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), Inches(5.1), Inches(1.8))
        p = box.text_frame.paragraphs[0]
        p.text = head
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        p2 = box.text_frame.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_LIGHT

    # SLIDE 5: Tech Stack & Verification
    s5 = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(s5)

    title_box = s5.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.0))
    p = title_box.text_frame.paragraphs[0]
    p.text = "Technology Stack & Technical Rigor"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    tech_cards = [
        ("🧠 AI & Agent Engine", "• Google Gemini 1.5 Flash\n• Multi-Agent DAG Orchestrator\n• Context-engineered Prompts\n• Structured JSON Schemas"),
        ("⚡ Backend Infrastructure", "• Python 3.11 & FastAPI\n• Asynchronous Task Pipelines\n• WebSockets for Live Telemetry\n• Mock & Live ERSS REST Endpoints"),
        ("💻 Frontend & Experience", "• React 19 + Vite\n• Framer Motion Dynamic Motion\n• 3D Earth Perspective Mapping\n• Cyber-Tactical Glassmorphism"),
        ("📊 Empirical Validation", "• E2E Playwright Browser Audited\n• Clean Unit & Build Passes\n• Zero Unhandled Promise Errors\n• Tested on International Scenarios")
    ]
    for i, (hd, bullets) in enumerate(tech_cards):
        x = Inches(1.0 + i * 2.9)
        add_card(s5, x, Inches(2.0), Inches(2.7), Inches(4.8), bg_color=CARD_BG, border_color=RGBColor(71, 85, 105))
        box = s5.shapes.add_textbox(x + Inches(0.15), Inches(2.2), Inches(2.4), Inches(4.4))
        p = box.text_frame.paragraphs[0]
        p.text = hd
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN
        p2 = box.text_frame.add_paragraph()
        p2.text = bullets
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_LIGHT

    # SLIDE 6: Impact & Future Roadmap
    s6 = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(s6)

    title_box = s6.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.0))
    p = title_box.text_frame.paragraphs[0]
    p.text = "Real-World Impact & Deployment Roadmap"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    impacts = [
        ("⏱️ Latency: 4 Hours ➔ 45 Seconds", "Compresses multi-department mobilization from half a day into under a minute."),
        ("🏥 100% Resource Spatial Awareness", "Gives commanders exact distances and capacities of surrounding facilities immediately."),
        ("👥 25%–40% Potential Mortality Reduction", "Rapid triage bed reservation and early warning dissemination saves lives in the golden window."),
        ("🚀 Future: IoT Mesh & Drone Telemetry", "Integration with LoRaWAN air-quality sensors and autonomous drone SAR video streams.")
    ]
    for i, (title, desc) in enumerate(impacts):
        col = i % 2
        row = i // 2
        x = Inches(1.0 + col * 5.8)
        y = Inches(2.0 + row * 2.4)
        add_card(s6, x, y, Inches(5.5), Inches(2.1), bg_color=CARD_BG, border_color=RGBColor(16, 185, 129))
        box = s6.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), Inches(5.1), Inches(1.8))
        p = box.text_frame.paragraphs[0]
        p.text = title
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN
        p2 = box.text_frame.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_LIGHT

    output_path = os.path.join(os.path.dirname(__file__), "CrisisGuard_AI_Pitch_Deck.pptx")
    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    create_pitch_deck()
