---
name: campus-rescue
description: Neuro-symbolic campus schedule repair and room booking engine using Google Gemma 4 and Z3 SMT constraint solving. Parses natural-language room requests or emergency campus disruptions, enforces capacity, equipment, supervisor, and time-slot constraints, minimizes schedule displacement, and isolates Unsat Core conflict explanations without hallucinations.
---

# Campus Rescue — Agent Skill

## Purpose
This skill orchestrates the Campus Rescue neuro-symbolic engine:
1. **Semantic Ingestion:** Uses Google Gemma 4 to translate natural-language room requests or disruptions into validated JSON AST.
2. **SMT Constraint Solving:** Uses Z3 to prove constraint satisfaction or minimal disruption delta.
3. **SLA Management:** Enforces the 2-hour Auto-Approval policy for pending booking proposals.
4. **Conflict Explanation:** Ingests `unsat_core()` when constraints clash and produces human-understandable explanations.

## Supported Operations
- `book_room(event_name, event_type, date, attendance, duration_slots, preferred_start_slot, equipment)`
- `close_room(room_id, start_slot, end_slot)`
- `change_attendance(event_id, new_attendance)`
- `delay_supervisor(supervisor_id, available_after_slot)`
- `protect_event(event_id)`

## Guardrails
- **Zero Hallucination:** Never claim a room allocation is valid without verification from `validator.py`.
- **Truthful Labeling:** Clearly declare whether parsing was executed via `Live Gemma 4` or `Structured Fallback`.
- **Unsat Core Discipline:** Label conflicting subsets as "conflict explanations" rather than claiming minimal cores unless core minimization is executed.
