import time
from typing import List, Dict, Tuple, Optional, Set
from z3 import Solver, Optimize, Int, Bool, Or, And, Not, Implies, If, sat, unsat, unknown
from .schemas import Room, Event, DisruptionOperation, SolverResult, ProposedAllocation, TOTAL_SLOTS

class CampusScheduleSolver:
    def __init__(self, rooms: List[Room], events: List[Event]):
        self.rooms = rooms
        self.events = events
        self.room_id_to_idx = {r.id: i for i, r in enumerate(rooms)}
        self.idx_to_room_id = {i: r.id for i, r in enumerate(rooms)}
        self.room_by_id = {r.id: r for r in rooms}
        self.event_by_id = {e.id: e for e in events}

    def solve_repair(self, operations: List[DisruptionOperation] = None) -> SolverResult:
        """
        Repairs schedule under disruption operations using Z3 SMT solver.
        Enforces hard constraints, tracks UNSAT cores, and optimizes minimal delta.
        """
        start_time = time.time()
        operations = operations or []

        # 1. Apply in-memory modifications from operations to a cloned event set
        active_events: Dict[str, Event] = {e.id: e.model_copy(deep=True) for e in self.events}
        room_closures: List[Tuple[str, int, int]] = []
        supervisor_delays: Dict[str, int] = {}

        for op in operations:
            if op.type == "close_room":
                room_closures.append((op.room_id, op.start_slot, op.end_slot))
            elif op.type == "change_attendance":
                if op.event_id in active_events:
                    active_events[op.event_id].attendance = op.new_attendance
            elif op.type == "delay_supervisor":
                supervisor_delays[op.supervisor_id] = op.available_after_slot
            elif op.type == "protect_event":
                if op.event_id in active_events:
                    active_events[op.event_id].is_protected = True

        event_list = list(active_events.values())

        # 2. Phase 1: Feasibility Check with assert_and_track for UNSAT Core
        feasibility_solver = Solver()
        room_vars = {e.id: Int(f"room_{e.id}") for e in event_list}
        start_vars = {e.id: Int(f"start_{e.id}") for e in event_list}

        named_constraints = self._build_constraints(
            event_list, room_vars, start_vars, room_closures, supervisor_delays
        )

        for name, expr in named_constraints.items():
            feasibility_solver.assert_and_track(expr, name)

        check_result = feasibility_solver.check()

        if check_result == unsat:
            elapsed = (time.time() - start_time) * 1000.0
            core = [str(clause) for clause in feasibility_solver.unsat_core()]
            explanation = self._format_conflict_explanation(core, event_list, room_closures)
            return SolverResult(
                is_sat=False,
                status="infeasible",
                unsat_core_tags=core,
                conflict_explanation=explanation,
                solver_time_ms=elapsed
            )
        elif check_result == unknown:
            elapsed = (time.time() - start_time) * 1000.0
            return SolverResult(
                is_sat=False,
                status="timeout",
                conflict_explanation="Solver timed out or hit resource limit.",
                solver_time_ms=elapsed
            )

        # 3. Phase 2: Lexicographic Optimization
        opt = Optimize()
        for expr in named_constraints.values():
            opt.add(expr)

        # Objective 1: Minimize count of changed events
        changed_indicators = []
        for e in event_list:
            orig_r_idx = self.room_id_to_idx.get(e.original_room_id, 0)
            orig_s = e.original_start_slot
            is_changed = If(
                Or(room_vars[e.id] != orig_r_idx, start_vars[e.id] != orig_s),
                1, 0
            )
            changed_indicators.append(is_changed)

        sum_changed = opt.minimize(sum(changed_indicators))

        # Objective 2: Minimize total time displacement
        displacements = []
        for e in event_list:
            orig_s = e.original_start_slot
            disp = If(
                start_vars[e.id] >= orig_s,
                start_vars[e.id] - orig_s,
                orig_s - start_vars[e.id]
            )
            displacements.append(disp)

        sum_disp = opt.minimize(sum(displacements))

        # Objective 3: Minimize room switches
        room_switches = []
        for e in event_list:
            orig_r_idx = self.room_id_to_idx.get(e.original_room_id, 0)
            switched = If(room_vars[e.id] != orig_r_idx, 1, 0)
            room_switches.append(switched)
        opt.minimize(sum(room_switches))

        opt_result = opt.check()
        elapsed = (time.time() - start_time) * 1000.0

        if opt_result != sat:
            return SolverResult(
                is_sat=False,
                status="infeasible",
                conflict_explanation="Optimization phase failed to find solution.",
                solver_time_ms=elapsed
            )

        model = opt.model()

        # 4. Extract Allocations & Formulate Explanations
        allocations = []
        total_changed = 0
        total_displacement = 0

        for e in event_list:
            assigned_r_idx = model[room_vars[e.id]].as_long()
            assigned_room_id = self.idx_to_room_id[assigned_r_idx]
            assigned_start = model[start_vars[e.id]].as_long()

            is_diff = (assigned_room_id != e.original_room_id) or (assigned_start != e.original_start_slot)
            disp_slots = abs(assigned_start - e.original_start_slot)

            if is_diff:
                total_changed += 1
                total_displacement += disp_slots

            explanation = None
            if is_diff:
                reasons = []
                if assigned_room_id != e.original_room_id:
                    reasons.append(f"Relocated from {e.original_room_id} to {assigned_room_id}")
                if assigned_start != e.original_start_slot:
                    reasons.append(f"Shifted by {disp_slots * 30} mins")
                explanation = "; ".join(reasons)
            else:
                explanation = "Retained in original room and time."

            allocations.append(ProposedAllocation(
                event_id=e.id,
                room_id=assigned_room_id,
                start_slot=assigned_start,
                duration_slots=e.duration_slots,
                is_changed=is_diff,
                displacement_slots=disp_slots,
                explanation=explanation
            ))

        return SolverResult(
            is_sat=True,
            status="feasible",
            proposed_allocations=allocations,
            changed_count=total_changed,
            total_displacement_slots=total_displacement,
            solver_time_ms=elapsed
        )

    def find_best_slot_for_new_request(
        self,
        event_name: str,
        attendance: int,
        duration_slots: int,
        required_equipment: Set[str],
        preferred_start_slot: Optional[int] = None,
        setup_buffer_slots: int = 0,
        cleanup_buffer_slots: int = 0
    ) -> Optional[Dict]:
        """
        Finds the optimal conflict-free room and time slot for a new booking request
        without moving any existing schedule events.
        """
        candidate_rooms = [
            r for r in self.rooms
            if r.capacity >= attendance and required_equipment.issubset(r.equipment)
        ]

        if not candidate_rooms:
            return None

        # Build occupancy map of current events: (room_id, slot) -> occupied
        occupied: Set[Tuple[str, int]] = set()
        for e in self.events:
            tot_dur = e.duration_slots + e.setup_buffer_slots + e.cleanup_buffer_slots
            s_slot = max(0, e.original_start_slot - e.setup_buffer_slots)
            for s in range(s_slot, s_slot + tot_dur):
                occupied.add((e.original_room_id, s))

        best_choice = None
        best_score = float('inf')

        # Slots: 0..18
        tot_req_duration = duration_slots + setup_buffer_slots + cleanup_buffer_slots

        for room in candidate_rooms:
            for start in range(0, TOTAL_SLOTS - duration_slots + 1):
                effective_start = start - setup_buffer_slots
                effective_end = start + duration_slots + cleanup_buffer_slots

                if effective_start < 0 or effective_end > TOTAL_SLOTS:
                    continue

                # Check collision with existing occupied slots
                collision = any((room.id, s) in occupied for s in range(effective_start, effective_end))
                if collision:
                    continue

                # Compute preference penalty
                pref_penalty = 0
                if preferred_start_slot is not None:
                    pref_penalty = abs(start - preferred_start_slot) * 10
                else:
                    pref_penalty = start  # earlier is slightly preferred

                # Capacity penalty (prefer smaller room that fits, avoiding wasting big halls)
                cap_waste = room.capacity - attendance

                score = pref_penalty + cap_waste * 0.1

                if score < best_score:
                    best_score = score
                    start_hour = 9 + (start // 2)
                    start_min = "30" if (start % 2 == 1) else "00"
                    end_slot = start + duration_slots
                    end_hour = 9 + (end_slot // 2)
                    end_min = "30" if (end_slot % 2 == 1) else "00"

                    time_str = f"{start_hour:02d}:{start_min} – {end_hour:02d}:{end_min}"
                    explanation = (
                        f"Recommended {room.name} at {start_hour:02d}:{start_min} because it seats {room.capacity} "
                        f"(requested {attendance}), includes {', '.join(required_equipment) or 'all required equipment'}, "
                        f"is free for {duration_slots * 30} minutes, and avoids moving any existing event."
                    )

                    best_choice = {
                        "room_id": room.id,
                        "room_name": room.name,
                        "start_slot": start,
                        "duration_slots": duration_slots,
                        "time_str": time_str,
                        "explanation": explanation
                    }

        return best_choice

    def _build_constraints(
        self,
        event_list: List[Event],
        room_vars: Dict[str, Int],
        start_vars: Dict[str, Int],
        room_closures: List[Tuple[str, int, int]],
        supervisor_delays: Dict[str, int]
    ) -> Dict[str, Bool]:
        constraints = {}

        # 1. Domain constraints
        for e in event_list:
            r_v = room_vars[e.id]
            s_v = start_vars[e.id]
            constraints[f"domain_room::{e.id}"] = And(r_v >= 0, r_v < len(self.rooms))
            constraints[f"domain_start::{e.id}"] = And(
                s_v - e.setup_buffer_slots >= e.earliest_start,
                s_v + e.duration_slots + e.cleanup_buffer_slots <= e.latest_end
            )

        # 2. Capacity & Equipment
        for e in event_list:
            for r in self.rooms:
                r_idx = self.room_id_to_idx[r.id]
                is_room = (room_vars[e.id] == r_idx)
                
                # Capacity
                if r.capacity < e.attendance:
                    constraints[f"cap::{e.id}::{r.id}"] = Not(is_room)
                
                # Equipment
                if not e.required_equipment.issubset(r.equipment):
                    constraints[f"equip::{e.id}::{r.id}"] = Not(is_room)

        # 3. Room Mutual Exclusion
        for i in range(len(event_list)):
            for j in range(i + 1, len(event_list)):
                e1, e2 = event_list[i], event_list[j]
                same_room = (room_vars[e1.id] == room_vars[e2.id])
                e1_end = start_vars[e1.id] + e1.duration_slots + e1.cleanup_buffer_slots
                e2_start = start_vars[e2.id] - e2.setup_buffer_slots
                e2_end = start_vars[e2.id] + e2.duration_slots + e2.cleanup_buffer_slots
                e1_start = start_vars[e1.id] - e1.setup_buffer_slots

                no_overlap = Or(e1_end <= e2_start, e2_end <= e1_start)
                constraints[f"no_overlap::{e1.id}::{e2.id}"] = Implies(same_room, no_overlap)

        # 4. Supervisor Mutual Exclusion
        for i in range(len(event_list)):
            for j in range(i + 1, len(event_list)):
                e1, e2 = event_list[i], event_list[j]
                if e1.supervisor_id and e2.supervisor_id and e1.supervisor_id == e2.supervisor_id:
                    sup_no_overlap = Or(
                        start_vars[e1.id] + e1.duration_slots <= start_vars[e2.id],
                        start_vars[e2.id] + e2.duration_slots <= start_vars[e1.id]
                    )
                    constraints[f"sup_overlap::{e1.id}::{e2.id}"] = sup_no_overlap

        # 5. Room Closures
        for c_room_id, c_start, c_end in room_closures:
            c_r_idx = self.room_id_to_idx.get(c_room_id)
            if c_r_idx is not None:
                for e in event_list:
                    is_c_room = (room_vars[e.id] == c_r_idx)
                    disjoint_closure = Or(
                        start_vars[e.id] + e.duration_slots <= c_start,
                        start_vars[e.id] >= c_end
                    )
                    constraints[f"closure::{c_room_id}::{e.id}"] = Implies(is_c_room, disjoint_closure)

        # 6. Supervisor Delays
        for sup_id, after_slot in supervisor_delays.items():
            for e in event_list:
                if e.supervisor_id == sup_id:
                    constraints[f"sup_delay::{sup_id}::{e.id}"] = (start_vars[e.id] >= after_slot)

        # 7. Protected Events
        for e in event_list:
            if e.is_protected:
                orig_r_idx = self.room_id_to_idx.get(e.original_room_id, 0)
                constraints[f"protect_room::{e.id}"] = (room_vars[e.id] == orig_r_idx)
                constraints[f"protect_start::{e.id}"] = (start_vars[e.id] == e.original_start_slot)

        return constraints

    def _format_conflict_explanation(
        self,
        core: List[str],
        event_list: List[Event],
        room_closures: List[Tuple[str, int, int]]
    ) -> str:
        messages = []
        for tag in core:
            parts = tag.split("::")
            prefix = parts[0]
            if prefix == "cap" and len(parts) >= 3:
                ev_id, r_id = parts[1], parts[2]
                ev = self.event_by_id.get(ev_id)
                rm = self.room_by_id.get(r_id)
                if ev and rm:
                    messages.append(f"Event '{ev.name}' ({ev.attendance} attendees) exceeds capacity of {rm.name} ({rm.capacity} seats).")
            elif prefix == "equip" and len(parts) >= 3:
                ev_id, r_id = parts[1], parts[2]
                ev = self.event_by_id.get(ev_id)
                rm = self.room_by_id.get(r_id)
                if ev and rm:
                    missing = ev.required_equipment - rm.equipment
                    messages.append(f"Room {rm.name} lacks required equipment {missing} for '{ev.name}'.")
            elif prefix == "closure" and len(parts) >= 3:
                r_id, ev_id = parts[1], parts[2]
                ev = self.event_by_id.get(ev_id)
                rm = self.room_by_id.get(r_id)
                ev_name = ev.name if ev else ev_id
                rm_name = rm.name if rm else r_id
                messages.append(f"Room {rm_name} is closed during the required schedule window for '{ev_name}'.")
            elif prefix.startswith("protect") and len(parts) >= 2:
                ev_id = parts[1]
                ev = self.event_by_id.get(ev_id)
                ev_name = ev.name if ev else ev_id
                messages.append(f"Event '{ev_name}' is strictly marked PROTECTED and cannot be shifted.")
            elif prefix == "no_overlap" and len(parts) >= 3:
                ev1_id, ev2_id = parts[1], parts[2]
                ev1 = self.event_by_id.get(ev1_id)
                ev2 = self.event_by_id.get(ev2_id)
                name1 = ev1.name if ev1 else ev1_id
                name2 = ev2.name if ev2 else ev2_id
                messages.append(f"Events '{name1}' and '{name2}' cannot occupy the same room at the same time.")

        if not messages:
            return "Hard constraints cannot be simultaneously satisfied. Relax attendance, equipment, or time windows."
        return "Conflicting Constraints: " + " | ".join(messages)
