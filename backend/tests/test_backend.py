import pytest
from datetime import datetime, timezone, timedelta
from backend.core.schemas import CloseRoomOp, ChangeAttendanceOp, ProtectEventOp, BookingRequest
from backend.core.solver import CampusScheduleSolver
from backend.core.validator import validate_schedule_candidate
from backend.core.sla_worker import process_sla_auto_approvals
from backend.db.seed_data import get_seeded_rooms, get_seeded_events

def test_baseline_schedule():
    rooms = get_seeded_rooms()
    events = get_seeded_events()
    solver = CampusScheduleSolver(rooms, events)
    result = solver.solve_repair([])
    assert result.is_sat is True
    assert result.changed_count == 0

    val_report = validate_schedule_candidate(rooms, events, result.proposed_allocations, [])
    assert val_report.is_valid is True
    assert val_report.checks_passed == 8

def test_room_booking_allocation():
    rooms = get_seeded_rooms()
    events = get_seeded_events()
    solver = CampusScheduleSolver(rooms, events)

    # Request room for 30 people with electronics_kits at 14:00 (slot 10)
    recommendation = solver.find_best_slot_for_new_request(
        event_name="Hands-on Electronics",
        attendance=30,
        duration_slots=4,  # 2 hours
        required_equipment={"electronics_kits"},
        preferred_start_slot=10
    )
    # Maker Lab D has capacity 35 and electronics_kits, and is free at 14:00
    assert recommendation is not None
    assert recommendation["room_id"] == "lab_d"
    assert "Recommended Maker Lab D" in recommendation["explanation"]

def test_sla_auto_approval_timeout():
    now = datetime.now(timezone.utc)
    sla_time = now + timedelta(hours=2)

    req = BookingRequest(
        id="test_req",
        requested_by="Alice",
        event_name="AI Workshop",
        event_type="workshop",
        date="2026-10-10",
        attendance=30,
        duration_slots=4,
        status="proposed",
        proposed_room_id="lab_d",
        proposed_start_slot=10,
        sla_expires_at=sla_time
    )

    # Test before 2 hours: status stays proposed
    updated, notifs = process_sla_auto_approvals([req], [], current_time=now + timedelta(hours=1))
    assert updated[0].status == "proposed"
    assert len(notifs) == 0

    # Test after 2 hours: status flips to auto_approved
    updated, notifs = process_sla_auto_approvals([req], [], current_time=now + timedelta(hours=2, minutes=1))
    assert updated[0].status == "auto_approved"
    assert len(notifs) == 1
    assert "Auto-Approved" in notifs[0]["title"]

def test_disruption_room_closure_and_protection():
    rooms = get_seeded_rooms()
    events = get_seeded_events()
    solver = CampusScheduleSolver(rooms, events)

    # Lab A closed after 14:00 (slot 10..18); Coding Assessment protected in Lab B
    ops = [
        CloseRoomOp(room_id="lab_a", start_slot=10, end_slot=18),
        ProtectEventOp(event_id="coding_assessment")
    ]
    result = solver.solve_repair(ops)
    assert result.is_sat is True
    assert result.changed_count == 1  # Only robotics moves

    # Verify robotics moved to lab_d
    alloc_map = {a.event_id: a for a in result.proposed_allocations}
    assert alloc_map["robotics"].room_id == "lab_d"
    assert alloc_map["coding_assessment"].room_id == "lab_b"

    # Independent validation
    val_report = validate_schedule_candidate(rooms, events, result.proposed_allocations, ops)
    assert val_report.is_valid is True

def test_impossible_conflict_unsat():
    rooms = get_seeded_rooms()
    events = get_seeded_events()
    solver = CampusScheduleSolver(rooms, events)

    # Attendance spike to 45 + Lab A closed.
    # No other room has capacity >= 45 and electronics_kits (Lab D has kits but cap is only 35)
    ops = [
        ChangeAttendanceOp(event_id="robotics", new_attendance=45),
        CloseRoomOp(room_id="lab_a", start_slot=10, end_slot=18)
    ]
    result = solver.solve_repair(ops)
    assert result.is_sat is False
    assert result.status == "infeasible"
    assert len(result.unsat_core_tags) > 0
    assert "Conflicting Constraints" in result.conflict_explanation
