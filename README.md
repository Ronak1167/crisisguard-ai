# 🛡️ CrisisGuard AI
## Autonomous Disaster Response Intelligence System
### WCC LaunchPad 3.0 — Agentic AI Track

> **"When every second counts, AI coordinates everything."**

---

## 🎯 Problem Statement

India faces **700+ natural disasters annually**, affecting millions of people. Current response systems suffer from:
- **Fragmented coordination** between NDRF, SDRF, hospitals, and district administration
- **Language barriers** preventing timely alerts to regional populations  
- **No unified intelligence** — resource mapping and response planning happen in silos
- **Human bottlenecks** slow critical decisions during the golden rescue window

**CrisisGuard AI** solves this with an autonomous multi-agent system that coordinates the entire disaster response pipeline in under 60 seconds.

---

## 🤖 Multi-Agent Architecture

```
User Input (Disaster Event)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                     │
│        Plans • Routes • Supervises • Retries        │
└──────────┬──────────────────────────────────────────┘
           │
    ┌──────┼──────────────┬─────────────────────┐
    ▼      ▼              ▼                     ▼
┌──────┐ ┌──────────┐ ┌──────────┐      ┌────────────────┐
│ 🔍   │ │  🗺️      │ │  📢      │      │   🎯           │
│Intel │ │Resource  │ │ Alert    │      │ Response       │
│Agent │ │ Mapper   │ │ Agent    │      │ Coordinator    │
│      │ │  Agent   │ │          │      │    Agent       │
└──────┘ └──────────┘ └──────────┘      └────────────────┘
   │           │            │                    │
Assessment  Resource    Multilingual         Operational
 Report      Map          Alerts              Plan +
                                           Human-in-Loop
```

### Agent Responsibilities

| Agent | Role | Tools Used |
|-------|------|-----------|
| **Intelligence Agent** | Analyzes disaster, classifies severity, maps affected zones | Historical DB, GIS, Population Census |
| **Resource Mapper Agent** | Finds hospitals, shelters, rescue teams, supply depots | NDRF Database, OSM, Health Records |
| **Alert Agent** | Generates multilingual alerts (EN/HI/Regional) | Translation, SMS Gateway, Social Media |
| **Response Coordinator** | Creates prioritized task plan with human escalation gates | All agent outputs, HITL system |

---

## ⚡ Key Features

- 🔄 **Real-time agent trace** — Watch every agent think, plan, and act
- 🌐 **Multilingual alerts** — English, Hindi, and regional languages simultaneously
- 👤 **Human-in-the-Loop** — AI flags decisions requiring human approval
- 📊 **Resource adequacy scoring** — Know exactly what you have vs. what you need
- 🎯 **Priority task queue** — 5 actionable tasks with clear ownership and deadlines
- 📈 **Lives-saved estimation** — Quantifiable impact metric for every response plan

---

## 🚀 Quick Start

### Step 1: Get Gemini API Key (Free)
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Copy the key

### Step 2: Configure
```bash
# Edit .env file
GEMINI_API_KEY=your_key_here
```

### Step 3: Start Backend
```bash
cd crisisguard-ai
python -m uvicorn main:app --reload --port 8000
```

### Step 4: Start Frontend
```bash
cd crisisguard-ai/frontend
npm run dev
```

### Step 5: Open App
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI / LLM** | Google Gemini 1.5 Flash (free tier) |
| **Agent Orchestration** | Custom async pipeline with dependency management |
| **Backend** | Python FastAPI + WebSockets (real-time streaming) |
| **Frontend** | React + Vite + Framer Motion |
| **Real-time** | WebSocket for live agent trace |

---

## 📁 Project Structure

```
crisisguard-ai/
├── main.py                          # FastAPI server + WebSocket
├── agents/
│   ├── orchestrator.py              # Master agent coordinator
│   ├── intelligence_agent.py        # Disaster analysis agent
│   ├── resource_mapper_agent.py     # Resource mapping agent
│   ├── alert_agent.py               # Multilingual alert agent
│   ├── response_coordinator_agent.py # Response plan agent
│   └── llm_client.py                # Shared Gemini client
├── frontend/
│   └── src/
│       ├── App.jsx                  # Main React UI
│       └── index.css                # Dark premium styles
└── requirements.txt
```

---

## 🔑 Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key  # Required: Get free at aistudio.google.com
PORT=8000                           # Optional: default 8000
```

---

## 🏆 Built For

**WCC LaunchPad 3.0** · Agentic AI Track · WeCodeCoders · October 2026

*Saving lives through autonomous AI coordination.*
