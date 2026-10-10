import os
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
try:
    from dotenv import load_dotenv
    base_dir = Path(__file__).resolve().parent
    load_dotenv(base_dir / ".env")
    load_dotenv(base_dir.parent / ".env")
    load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.core.schemas import (
    Room, Event, BookingRequest, BookingRequestCreate,
    DisruptionOperation, DisruptionEnvelope, SolverResult, ValidationReport, ProposedAllocation
)
from backend.core.solver import CampusScheduleSolver
from backend.core.validator import validate_schedule_candidate
from backend.core.model_adapter import GemmaModelAdapter
from backend.core.sla_worker import process_sla_auto_approvals
from backend.db.supabase_client import db

app = FastAPI(
    title="Campus Rescue API",
    description="Neuro-Symbolic Campus Scheduling Engine with Google Gemma 4 and Z3 SMT Prover",
    version="2.0.0"
)

# Allow React Frontend on localhost (Vite: 5173 / Next: 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_adapter = GemmaModelAdapter()

# ----------------- Health & Status -----------------
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "gemma_configured": bool(model_adapter.client),
        "supabase_connected": bool(db.is_connected),
        "active_rooms": len(db.get_rooms()),
        "active_events": len(db.get_events())
    }

# ----------------- Schedule & Rooms -----------------
@app.get("/api/rooms", response_model=List[Room])
def get_rooms():
    return db.get_rooms()

@app.get("/api/schedule")
def get_schedule():
    rooms = db.get_rooms()
    events = db.get_events()
    return {
        "rooms": rooms,
        "events": events
    }

# ----------------- Room Booking Requests -----------------
class BookingPromptRequest(BaseModel):
    requested_by: str = "Student Organizer"
    prompt: Optional[str] = None
    structured: Optional[BookingRequestCreate] = None

@app.post("/api/bookings/request")
def create_booking_request(req_body: BookingPromptRequest):
    rooms = db.get_rooms()
    events = db.get_events()
    solver = CampusScheduleSolver(rooms, events)

    # 1. Determine constraints: from prompt or structured payload
    event_name = "Campus Activity"
    attendance = 30
    duration_slots = 4
    required_equipment = set()
    preferred_start_slot = None
    setup_buffer = 0
    cleanup_buffer = 0
    parsing_mode = "Structured Direct"

    if req_body.structured:
        s = req_body.structured
        event_name = s.event_name
        attendance = s.attendance
        duration_slots = s.duration_slots
        required_equipment = s.required_equipment
        preferred_start_slot = s.preferred_start_slot
        setup_buffer = s.setup_buffer_slots
        cleanup_buffer = s.cleanup_buffer_slots
    elif req_body.prompt:
        # Parse prompt with Gemma 4 or structured fallback
        extracted, parsing_mode = model_adapter.parse_booking_request(
            req_body.prompt, requested_by=req_body.requested_by
        )
        event_name = extracted.event_name
        attendance = extracted.attendance
        duration_slots = extracted.duration_slots
        required_equipment = extracted.required_equipment
        preferred_start_slot = extracted.preferred_start_slot
        setup_buffer = extracted.setup_buffer_slots
        cleanup_buffer = extracted.cleanup_buffer_slots

    # 2. Find best collision-free slot via SMT engine
    slot_recommendation = solver.find_best_slot_for_new_request(
        event_name=event_name,
        attendance=attendance,
        duration_slots=duration_slots,
        required_equipment=required_equipment,
        preferred_start_slot=preferred_start_slot,
        setup_buffer_slots=setup_buffer,
        cleanup_buffer_slots=cleanup_buffer
    )

    if not slot_recommendation:
        raise HTTPException(
            status_code=400,
            detail="No available room satisfies the required capacity, equipment, and duration."
        )

    # 3. Create BookingRequest with 2-hour SLA deadline
    now = datetime.now(timezone.utc)
    sla_deadline = now + timedelta(hours=2)

    booking = BookingRequest(
        id=str(uuid.uuid4())[:8],
        requested_by=req_body.requested_by,
        event_name=event_name,
        event_type="workshop",
        date="2026-10-10",
        attendance=attendance,
        duration_slots=duration_slots,
        setup_buffer_slots=setup_buffer,
        cleanup_buffer_slots=cleanup_buffer,
        preferred_start_slot=preferred_start_slot,
        required_equipment=required_equipment,
        priority="medium",
        status="proposed",
        proposed_room_id=slot_recommendation["room_id"],
        proposed_start_slot=slot_recommendation["start_slot"],
        explanation=slot_recommendation["explanation"],
        created_at=now,
        sla_expires_at=sla_deadline
    )

    saved = db.create_booking_request(booking)

    # Dispatch proposal toast notification
    db.add_notification({
        "type": "booking_proposed",
        "title": f"Proposed: '{booking.event_name}'",
        "message": f"Proposed allocation in {slot_recommendation['room_name']} at slot {slot_recommendation['start_slot']} (2-Hour SLA active).",
        "timestamp": now.isoformat()
    })

    return {
        "booking": saved,
        "recommendation": slot_recommendation,
        "parsing_mode": parsing_mode
    }

@app.get("/api/bookings", response_model=List[BookingRequest])
def list_bookings():
    return db.get_booking_requests()

@app.post("/api/bookings/{booking_id}/approve")
def approve_booking(booking_id: str, admin_user: str = "Chief Coordinator"):
    db.update_booking_status(booking_id, status="approved", approved_by=admin_user)
    now = datetime.now(timezone.utc)
    db.add_notification({
        "type": "booking_approved",
        "title": "Booking Approved",
        "message": f"Request {booking_id} was approved by {admin_user}.",
        "timestamp": now.isoformat()
    })
    return {"status": "approved", "booking_id": booking_id}

@app.post("/api/bookings/{booking_id}/reject")
def reject_booking(booking_id: str, admin_user: str = "Chief Coordinator"):
    db.update_booking_status(booking_id, status="rejected", approved_by=admin_user)
    now = datetime.now(timezone.utc)
    db.add_notification({
        "type": "booking_rejected",
        "title": "Booking Rejected",
        "message": f"Request {booking_id} was rejected by {admin_user}.",
        "timestamp": now.isoformat()
    })
    return {"status": "rejected", "booking_id": booking_id}

# ----------------- 2-Hour SLA Daemon & Fast-Forward -----------------
class SLACheckRequest(BaseModel):
    fast_forward_hours: float = 0.0

@app.post("/api/admin/sla-check")
def run_sla_check(payload: SLACheckRequest = Body(default=SLACheckRequest())):
    current_time = datetime.now(timezone.utc) + timedelta(hours=payload.fast_forward_hours)
    all_requests = db.get_booking_requests()
    all_events = db.get_events()

    updated_requests, new_notifications = process_sla_auto_approvals(
        all_requests, all_events, current_time=current_time
    )

    auto_approved_count = 0
    for req in updated_requests:
        if req.status == "auto_approved" and req.approved_by is None:
            db.update_booking_status(req.id, status="auto_approved", approved_by="Auto-Approval Daemon")
            auto_approved_count += 1

    for n in new_notifications:
        db.add_notification(n)

    return {
        "auto_approved_count": auto_approved_count,
        "simulated_time": current_time.isoformat(),
        "notifications": new_notifications
    }

# ----------------- Emergency Disruption & Z3 SMT Repair -----------------
class DisruptionRepairRequest(BaseModel):
    natural_language_prompt: Optional[str] = None
    operations: Optional[List[DisruptionOperation]] = None

@app.post("/api/disruptions/repair")
def repair_disruption(req: DisruptionRepairRequest):
    rooms = db.get_rooms()
    events = db.get_events()
    solver = CampusScheduleSolver(rooms, events)

    parsing_mode = "Direct Operations"
    ops = req.operations or []

    if req.natural_language_prompt:
        envelope, parsing_mode = model_adapter.parse_disruption(req.natural_language_prompt)
        if envelope.status == "needs_clarification":
            return {
                "is_sat": False,
                "status": "needs_clarification",
                "clarification_question": envelope.clarification_question,
                "parsing_mode": parsing_mode
            }
        ops = envelope.operations

    # Run Z3 SMT solver
    solver_result = solver.solve_repair(operations=ops)

    # Independent Zero-Trust Verification
    validation_report = None
    if solver_result.is_sat:
        validation_report = validate_schedule_candidate(
            rooms=rooms,
            original_events=events,
            candidate_allocations=solver_result.proposed_allocations,
            operations=ops
        )

    return {
        "solver_result": solver_result,
        "validation_report": validation_report,
        "applied_operations": ops,
        "parsing_mode": parsing_mode
    }

class ApplyRepairRequest(BaseModel):
    allocations: List[ProposedAllocation]

@app.post("/api/disruptions/apply")
def apply_repair(payload: ApplyRepairRequest):
    for alloc in payload.allocations:
        if alloc.is_changed:
            db.update_event_allocation(alloc.event_id, alloc.room_id, alloc.start_slot)

    now = datetime.now(timezone.utc)
    db.add_notification({
        "type": "emergency_relocation",
        "title": "Emergency Schedule Repaired",
        "message": f"Schedule updated with {len([a for a in payload.allocations if a.is_changed])} relocated events.",
        "timestamp": now.isoformat()
    })
    return {"status": "success", "message": "Repaired schedule committed to active state."}

# ----------------- Notifications & Reset -----------------
@app.get("/api/notifications")
def get_notifications():
    return db.get_notifications()

@app.post("/api/admin/reset")
def reset_schedule():
    db.reset_to_seed()
    now = datetime.now(timezone.utc)
    db.add_notification({
        "type": "reset",
        "title": "Schedule Reset",
        "message": "Baseline seeded campus schedule restored.",
        "timestamp": now.isoformat()
    })
    return {"status": "reset", "message": "Schedule restored to seeded baseline."}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)

