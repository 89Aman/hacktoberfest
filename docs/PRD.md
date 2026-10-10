# Product Requirements Document (PRD) — Campus Rescue

**Project Name:** Campus Rescue  
**Document Version:** 1.0  
**Target Delivery:** Hacktoberfest IITB / Campus Gemma Hackathon  
**Target Users:** Students, Faculty, Super Admin (Campus Operations / Academic Coordinators)

---

## 1. Executive Summary

Campus scheduling is volatile. Unexpected disruptions—water leaks in laboratories, equipment malfunctions, sudden attendance surges, faculty transit delays—break pre-arranged schedules. Moving one event manually creates cascading conflicts. 

**Campus Rescue** is a neuro-symbolic platform that repairs campus daily schedules under disruptions. It combines **Google Gemma 2** for natural-language semantic parsing with the **Z3 SMT solver** for deterministic constraint satisfaction and lexicographic delta minimization.

---

## 2. Problem Statement & User Pain Points

| Role | Current Pain Points | Desired Outcome |
| :--- | :--- | :--- |
| **Student** | Shows up to closed or relocated rooms; relies on unverified WhatsApp rumor chains; workshops land in rooms without required kits. | Immediate access to verified daily schedule; 1-click calendar sync; guaranteed equipment match. |
| **Faculty** | Unforeseen delays force manual rescheduling through administrative bureaucracy; fear that critical exams or vivas will be bumped. | Voice/text delay logging in plain English; one-toggle `PROTECTED` status on exam slots; zero double-booking. |
| **Super Admin** | Sudden room shutdowns cause chaos across 50+ classes; manual swaps create hidden overlaps; generic AI chatbots hallucinate fake solutions. | Instant disruption intake; mathematically proven minimal-change repair; transparent explanations of infeasibility. |

---

## 3. Product Goals & Success Metrics

### Primary Goals
1. **Zero Hallucination:** Every proposed repair is mathematically verified against hard capacity, equipment, supervisor, and time constraints before presentation.
2. **Minimal Schedule Disruption:** Prioritize moving the fewest events first, followed by minimizing total minute displacements.
3. **Transparent Infeasibility Handling:** When a conflict is mathematically impossible (`UNSAT`), isolate the conflicting constraints instead of corrupting data.
4. **Sub-Second Repair Latency:** Solve bounded daily campus instances ($< 50$ events) in under 2 seconds.

### Success Metrics
- **Verification Rate:** 100% of generated repairs pass independent zero-trust constraint validation.
- **Displacement Reduction:** $\ge 80\%$ fewer displaced students compared to complete timetable recalculation.
- **Coordinator Time Saved:** Reduce emergency room reshuffling time from 45 minutes to under 30 seconds.

---

## 4. User Personas & Permissions

### 4.1 Student
- **Access Level:** Read-Only + Subscription.
- **Actions:** View live timetable, filter by department/room, check equipment tags, subscribe to live iCal (`.ics`) feed, report broken equipment or locked doors.

### 4.2 Faculty / Mentor
- **Access Level:** Semi-Privileged.
- **Actions:** View assigned sessions, submit personal availability adjustments or delays in plain English (e.g., *"Arriving 40 mins late today"*), mark personal lab assessments as `PROTECTED`, review proposed slot moves before commit.

### 4.3 Super Admin / Coordinator
- **Access Level:** Full Administrative Control.
- **Actions:** Ingest campus-wide disruptions (e.g., *"Close Lab A after 2 PM"*), inspect Z3 optimization plans, review `UNSAT` conflict cores, relax non-critical constraints when needed, commit verified repairs, dispatch campus alerts.

---

## 5. Functional Requirements

### 5.1 Disruption Ingestion (FR-1)
- The system must accept natural language input from Super Admins and Faculty.
- Supported operations:
  - `close_room(room_id, start_slot, end_slot)`
  - `change_attendance(event_id, new_attendance)`
  - `delay_supervisor(supervisor_id, available_after_slot)`
  - `protect_event(event_id)`
- Gemma parses user requests into a validated Pydantic JSON AST.
- If input is ambiguous or unsupported, the system must trigger a single structured clarification prompt rather than guessing.

### 5.2 Deterministic SMT Engine (FR-2)
- Engine must enforce all hard constraints:
  - Room domain, room hours, room capacity $\ge$ event attendance.
  - Required equipment $\subseteq$ room equipment.
  - No two events in the same room overlap.
  - No two events with the same supervisor overlap.
  - No event in a closed room during closure interval.
  - Protected events must retain original start time and original room.
- Engine must optimize via lexicographic ordering:
  1. Minimize count of altered events ($\text{room} \ne \text{orig\_room} \lor \text{start} \ne \text{orig\_start}$).
  2. Minimize total minute displacement.
  3. Minimize room changes.

### 5.3 Infeasibility & Conflict Diagnostics (FR-3)
- If constraints cannot be satisfied, engine must output `status: infeasible`.
- Engine must extract the Minimal Unsatisfiable Core (MUC) using `assert_and_track()`.
- System must map conflict labels to human-readable explanations (e.g., *"Cannot place 45 students in Maker Lab D because maximum capacity is 35"*).

### 5.4 Zero-Trust Independent Validation (FR-4)
- A standalone pure-Python validator must execute on the solver's candidate plan.
- The plan will not be displayed as valid unless 100% of mathematical checks pass.

### 5.5 Schedule Diff & Commit Workflow (FR-5)
- UI must render a before/after diff table highlighting only changed rows.
- Unchanged rows must be visibly flagged as `Retained`.
- Schedule updates persist only after explicit coordinator confirmation (`Apply Repair`).

### 5.6 Real-Time Notification & Export (FR-6)
- Provide one-click `.ics` calendar file download and subscription endpoint.
- Provide structured webhook payload for student WhatsApp / SMS / Email gateways.

---

## 6. Non-Functional Requirements

- **Performance:** Sub-2-second end-to-end processing (LLM extraction + SMT solve) on local consumer hardware.
- **Offline Reliability:** Must support structured fallback buttons if local LLM service is offline.
- **Privacy & Security:** Complete local data execution; zero schedule or personnel data sent to external cloud APIs.
- **Auditability:** Complete timestamped audit log of all applied disruptions and solver outputs.

---

## 7. Out of Scope for MVP

- Multi-semester curriculum timetabling.
- Automated classroom electronic lock integrations.
- Multi-campus cross-city transit calculations.
