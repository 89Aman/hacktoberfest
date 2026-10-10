from typing import List, Dict, Tuple, Optional
from .schemas import Room, Event, ProposedAllocation, ValidationReport, DisruptionOperation, TOTAL_SLOTS

def validate_schedule_candidate(
    rooms: List[Room],
    original_events: List[Event],
    candidate_allocations: List[ProposedAllocation],
    operations: Optional[List[DisruptionOperation]] = None
) -> ValidationReport:
    """
    Independent Zero-Trust Validator.
    Executes pure-Python constraint verification on solver candidate schedules.
    """
    violations = []
    checks_passed = 0
    total_checks = 8

    operations = operations or []
    room_map = {r.id: r for r in rooms}
    orig_event_map = {e.id: e for e in original_events}
    alloc_map = {a.event_id: a for a in candidate_allocations}

    # Extract closure and delay operations
    closed_intervals: List[Tuple[str, int, int]] = []
    supervisor_delays: Dict[str, int] = {}
    attendance_overrides: Dict[str, int] = {}
    protected_overrides: set = set()

    for op in operations:
        if op.type == "close_room":
            closed_intervals.append((op.room_id, op.start_slot, op.end_slot))
        elif op.type == "delay_supervisor":
            supervisor_delays[op.supervisor_id] = op.available_after_slot
        elif op.type == "change_attendance":
            attendance_overrides[op.event_id] = op.new_attendance
        elif op.type == "protect_event":
            protected_overrides.add(op.event_id)

    # 1. Completeness Check
    orig_ids = set(orig_event_map.keys())
    alloc_ids = set(alloc_map.keys())
    if orig_ids != alloc_ids:
        missing = orig_ids - alloc_ids
        extra = alloc_ids - orig_ids
        violations.append(f"Event set mismatch: missing {missing}, extra {extra}")
    else:
        checks_passed += 1

    # 2. Domain & Boundary Check
    domain_ok = True
    for alloc in candidate_allocations:
        ev = orig_event_map.get(alloc.event_id)
        if not ev:
            continue
        start = alloc.start_slot
        end = start + alloc.duration_slots + ev.cleanup_buffer_slots
        eff_start = start - ev.setup_buffer_slots

        if alloc.room_id not in room_map:
            violations.append(f"Event {alloc.event_id} assigned to unknown room {alloc.room_id}")
            domain_ok = False
        if eff_start < ev.earliest_start or end > ev.latest_end or end > TOTAL_SLOTS:
            violations.append(f"Event {alloc.event_id} slot interval [{eff_start}, {end}) violates allowed window [{ev.earliest_start}, {ev.latest_end})")
            domain_ok = False
    if domain_ok:
        checks_passed += 1

    # 3. Capacity Check
    cap_ok = True
    for alloc in candidate_allocations:
        ev = orig_event_map.get(alloc.event_id)
        rm = room_map.get(alloc.room_id)
        if ev and rm:
            effective_att = attendance_overrides.get(ev.id, ev.attendance)
            if rm.capacity < effective_att:
                violations.append(f"Capacity violation: {rm.name} ({rm.capacity}) < '{ev.name}' ({effective_att})")
                cap_ok = False
    if cap_ok:
        checks_passed += 1

    # 4. Equipment Check
    equip_ok = True
    for alloc in candidate_allocations:
        ev = orig_event_map.get(alloc.event_id)
        rm = room_map.get(alloc.room_id)
        if ev and rm:
            missing_equip = ev.required_equipment - rm.equipment
            if missing_equip:
                violations.append(f"Equipment violation: {rm.name} lacks {missing_equip} required by '{ev.name}'")
                equip_ok = False
    if equip_ok:
        checks_passed += 1

    # 5. Room Mutual Exclusion Check
    overlap_ok = True
    allocs = candidate_allocations
    for i in range(len(allocs)):
        for j in range(i + 1, len(allocs)):
            a1, a2 = allocs[i], allocs[j]
            if a1.room_id == a2.room_id:
                e1, e2 = orig_event_map[a1.event_id], orig_event_map[a2.event_id]
                e1_start = a1.start_slot - e1.setup_buffer_slots
                e1_end = a1.start_slot + a1.duration_slots + e1.cleanup_buffer_slots
                e2_start = a2.start_slot - e2.setup_buffer_slots
                e2_end = a2.start_slot + a2.duration_slots + e2.cleanup_buffer_slots

                # Overlap condition
                if not (e1_end <= e2_start or e2_end <= e1_start):
                    violations.append(f"Room overlap in {a1.room_id}: '{a1.event_id}' [{e1_start}, {e1_end}) clashes with '{a2.event_id}' [{e2_start}, {e2_end})")
                    overlap_ok = False
    if overlap_ok:
        checks_passed += 1

    # 6. Supervisor Mutual Exclusion & Delay Check
    sup_ok = True
    for i in range(len(allocs)):
        a1 = allocs[i]
        e1 = orig_event_map[a1.event_id]
        if e1.supervisor_id:
            # Delay check
            min_slot = supervisor_delays.get(e1.supervisor_id)
            if min_slot is not None and a1.start_slot < min_slot:
                violations.append(f"Supervisor delay violation: {e1.supervisor_id} arrives at slot {min_slot}, but '{e1.name}' starts at {a1.start_slot}")
                sup_ok = False

            # Supervisor overlap
            for j in range(i + 1, len(allocs)):
                a2 = allocs[j]
                e2 = orig_event_map[a2.event_id]
                if e2.supervisor_id == e1.supervisor_id:
                    if not (a1.start_slot + a1.duration_slots <= a2.start_slot or a2.start_slot + a2.duration_slots <= a1.start_slot):
                        violations.append(f"Supervisor double-booking: {e1.supervisor_id} scheduled in '{e1.id}' and '{e2.id}' concurrently")
                        sup_ok = False
    if sup_ok:
        checks_passed += 1

    # 7. Room Closure Check
    closure_ok = True
    for alloc in candidate_allocations:
        for c_room, c_start, c_end in closed_intervals:
            if alloc.room_id == c_room:
                e_start = alloc.start_slot
                e_end = alloc.start_slot + alloc.duration_slots
                if not (e_end <= c_start or e_start >= c_end):
                    violations.append(f"Room closure violation: '{alloc.event_id}' overlaps closure of {c_room} [{c_start}, {c_end})")
                    closure_ok = False
    if closure_ok:
        checks_passed += 1

    # 8. Protection Check
    protect_ok = True
    for alloc in candidate_allocations:
        ev = orig_event_map.get(alloc.event_id)
        if ev and (ev.is_protected or ev.id in protected_overrides):
            if alloc.room_id != ev.original_room_id or alloc.start_slot != ev.original_start_slot:
                violations.append(f"Protected event violation: '{ev.name}' was moved from {ev.original_room_id} at slot {ev.original_start_slot} to {alloc.room_id} at slot {alloc.start_slot}")
                protect_ok = False
    if protect_ok:
        checks_passed += 1

    is_valid = (len(violations) == 0) and (checks_passed == total_checks)
    return ValidationReport(
        is_valid=is_valid,
        checks_passed=checks_passed,
        total_checks=total_checks,
        violations=violations
    )
