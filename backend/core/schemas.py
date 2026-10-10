from pydantic import BaseModel, Field, model_validator
from typing import Set, List, Optional, Literal, Union, Dict, Any
from datetime import datetime, timezone, timedelta

# Slot 0 = 09:00, Slot 18 = 18:00 (30-min intervals)
TOTAL_SLOTS = 18

class Room(BaseModel):
    id: str
    name: str
    capacity: int = Field(gt=0)
    equipment: Set[str] = Field(default_factory=set)
    open_start: int = 0
    open_end: int = TOTAL_SLOTS

class Event(BaseModel):
    id: str
    name: str
    attendance: int = Field(gt=0)
    duration_slots: int = Field(gt=0)
    setup_buffer_slots: int = Field(default=0, ge=0)
    cleanup_buffer_slots: int = Field(default=0, ge=0)
    required_equipment: Set[str] = Field(default_factory=set)
    supervisor_id: Optional[str] = None
    earliest_start: int = 0
    latest_end: int = TOTAL_SLOTS
    original_room_id: str
    original_start_slot: int
    is_protected: bool = False

class CloseRoomOp(BaseModel):
    type: Literal["close_room"] = "close_room"
    room_id: str
    start_slot: int = Field(ge=0, le=TOTAL_SLOTS)
    end_slot: int = Field(ge=0, le=TOTAL_SLOTS)

class ChangeAttendanceOp(BaseModel):
    type: Literal["change_attendance"] = "change_attendance"
    event_id: str
    new_attendance: int = Field(gt=0)

class DelaySupervisorOp(BaseModel):
    type: Literal["delay_supervisor"] = "delay_supervisor"
    supervisor_id: str
    available_after_slot: int = Field(ge=0, le=TOTAL_SLOTS)

class ProtectEventOp(BaseModel):
    type: Literal["protect_event"] = "protect_event"
    event_id: str

DisruptionOperation = Union[CloseRoomOp, ChangeAttendanceOp, DelaySupervisorOp, ProtectEventOp]

class DisruptionEnvelope(BaseModel):
    status: Literal["ready", "needs_clarification", "unsupported"]
    operations: List[DisruptionOperation] = Field(default_factory=list)
    clarification_question: Optional[str] = None

class BookingRequestCreate(BaseModel):
    requested_by: str
    event_name: str
    event_type: Literal["class", "lab", "workshop", "hackathon", "cultural_event", "exam"] = "workshop"
    date: str
    attendance: int = Field(gt=0)
    duration_slots: int = Field(gt=0)
    setup_buffer_slots: int = Field(default=0, ge=0)
    cleanup_buffer_slots: int = Field(default=0, ge=0)
    preferred_start_slot: Optional[int] = Field(default=None, ge=0, le=TOTAL_SLOTS)
    allow_time_suggestion: bool = True
    required_equipment: Set[str] = Field(default_factory=set)
    priority: Literal["low", "medium", "high", "protected_exam"] = "medium"
    accessibility_needed: bool = False

class BookingRequest(BookingRequestCreate):
    id: str
    status: Literal["pending", "proposed", "approved", "auto_approved", "rejected", "cancelled"] = "pending"
    proposed_room_id: Optional[str] = None
    proposed_start_slot: Optional[int] = None
    explanation: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sla_expires_at: datetime
    auto_approved_at: Optional[datetime] = None

class ProposedAllocation(BaseModel):
    event_id: str
    room_id: str
    start_slot: int
    duration_slots: int
    is_changed: bool = False
    displacement_slots: int = 0
    explanation: Optional[str] = None

class SolverResult(BaseModel):
    is_sat: bool
    status: Literal["feasible", "infeasible", "timeout", "error"]
    proposed_allocations: List[ProposedAllocation] = Field(default_factory=list)
    changed_count: int = 0
    total_displacement_slots: int = 0
    unsat_core_tags: List[str] = Field(default_factory=list)
    conflict_explanation: Optional[str] = None
    solver_time_ms: float = 0.0

class ValidationReport(BaseModel):
    is_valid: bool
    checks_passed: int
    total_checks: int
    violations: List[str] = Field(default_factory=list)
