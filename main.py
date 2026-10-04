"""
CrisisGuard AI - Autonomous Disaster Response Intelligence System
Main FastAPI application with WebSocket support for real-time agent tracing
"""
import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agents.orchestrator import run_crisis_response

load_dotenv()

app = FastAPI(
    title="CrisisGuard AI",
    description="Autonomous Disaster Response Intelligence System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections for real-time agent trace
active_connections: dict[str, WebSocket] = {}


class DisasterInput(BaseModel):
    disaster_type: str
    location: str
    severity: str
    description: str
    session_id: str | None = None


class AgentEvent(BaseModel):
    session_id: str
    agent_name: str
    event_type: str  # "start" | "thinking" | "tool_call" | "result" | "complete"
    message: str
    data: dict | None = None
    timestamp: str


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    active_connections[session_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.pop(session_id, None)


async def emit_event(session_id: str, event: dict):
    """Send real-time agent events to connected WebSocket clients"""
    if session_id in active_connections:
        try:
            await active_connections[session_id].send_json(event)
        except Exception:
            active_connections.pop(session_id, None)


@app.post("/api/analyze")
async def analyze_disaster(input_data: DisasterInput):
    """
    Main endpoint: triggers the multi-agent disaster response pipeline
    """
    session_id = input_data.session_id or str(uuid.uuid4())

    async def event_callback(event: dict):
        await emit_event(session_id, event)

    result = await run_crisis_response(
        disaster_type=input_data.disaster_type,
        location=input_data.location,
        severity=input_data.severity,
        description=input_data.description,
        session_id=session_id,
        event_callback=event_callback,
    )

    return {
        "session_id": session_id,
        "status": "complete",
        "result": result,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "operational",
        "version": "1.0.0",
        "agents": [
            "Intelligence Agent",
            "Resource Mapper Agent",
            "Alert Agent",
            "Response Coordinator Agent",
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/live-disasters")
async def get_live_disasters():
    """
    Returns verified live global disaster events directly from NASA EONET and USGS Earthquakes.
    """
    from services.real_data_service import fetch_live_global_disasters
    events = await fetch_live_global_disasters()
    return {
        "status": "success",
        "count": len(events),
        "sources": ["NASA EONET v3", "USGS Real-Time Seismic Network"],
        "events": events,
        "fetched_at": datetime.utcnow().isoformat(),
    }


@app.get("/api/telemetry/{location}")
async def get_live_telemetry(location: str):
    """
    Returns real-time GPS coordinates and live meteorological telemetry for any location.
    """
    from services.real_data_service import geocode_location, fetch_real_weather_telemetry
    geo = await geocode_location(location)
    wx = await fetch_real_weather_telemetry(geo["lat"], geo["lng"])
    return {
        "location": geo,
        "weather": wx,
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

