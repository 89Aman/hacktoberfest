# Product Requirements Document (PRD) — Campus Rescue

**Project Name:** Campus Rescue  
**Document Version:** 2.0  
**Target Delivery:** Hacktoberfest IITB / Campus Gemma Hackathon  
**Target Users:** Students, Faculty, Event Organizers, Super Admins (Operations / Timetable Coordinators)

---

## 1. Unified Product Definition

> **Campus Rescue** allows campus users (students, faculty, club leads) to request rooms for events using natural language. It finds a verified, conflict-free room and time, and allows administrators to review, approve, or repair the schedule when disruptions occur. If an administrator does not act within **2 hours**, the system automatically assigns the optimal verified slot and notifies both requester and administrator.

### Core Workflow
```
User Request (Plain English or Form)
       │
       ▼
Gemma 4 Semantic Parser (Extracts Constraints & Preferences)
       │
       ▼
Z3 SMT Solver (Finds Valid Slots / Minimal Disruption Repair)
       │
       ▼
Admin Approval Gate (2-Hour Auto-Approval SLA Timeout)
       ├── Approved within 2h ──> Schedule Published
       ├── 2h Timeout Reached ──> Auto-Assigned Best Slot & Published
       └── Rejected/Modified   ──> Requester Notified with Alternative
       │
       ▼
Schedule Published & Affected Users Notified (.ics & Toast/Alert Feed)
```

---

## 2. Target Personas & Core Use Cases

| Persona | Primary Goal | Key Interaction |
| :--- | :--- | :--- |
| **Student / Club Lead** | Book room for workshop, hackathon, or meeting without manual register hassle. | Submits room request in English or structured form; receives instant verified slot recommendation; gets notified when approved. |
| **Faculty / Instructor** | Reserve lab/hall for class, exam, or viva; protect high-stakes tests from being bumped. | Requests rooms; marks exams as `PROTECTED`; logs delays in natural language. |
| **Super Admin / Coordinator** | Maintain conflict-free campus spaces; handle emergency closures; manage requests queue. | One-click approve/reject/edit queue; handles room closures; auto-fallback commits unattended requests after 2 hours. |

---

## 3. Booking Request Entity & Fields

User booking requests accept both natural language and structured form inputs:

- **Event Name:** Display title (e.g., "Robotics Hands-on Workshop").
- **Event Type:** `class` | `lab` | `workshop` | `hackathon` | `cultural_event` | `exam`.
- **Date & Duration:** Date, duration in slots (30-minute intervals).
- **Attendee Count:** Expected attendance (positive integer).
- **Required Equipment:** Set of flags (`projector`, `computers`, `electronics_kits`, `audio_system`).
- **Setup & Cleanup Buffers:** Optional 30-minute buffer slots before and after events.
- **Preferred Time:** Target start slot, or toggle *"Suggest the best available time"*.
- **Priority & Accessibility:** `low` | `medium` | `high` | `protected_exam`; optional wheelchair/ground-floor access flag.
- **Status Lifecycle:** `pending` ➔ `proposed` ➔ `approved` (or `auto_approved`) | `rejected` | `cancelled`.

---

## 4. The 2-Hour Auto-Approval SLA Policy

To prevent campus scheduling bottlenecks caused by unavailable coordinators:
1. When a booking request is submitted, Z3 immediately solves for the highest-ranked feasible slot and marks the request as `proposed`.
2. A **2-Hour SLA Countdown Timer** is attached to the proposal.
3. If the coordinator manually approves, rejects, or modifies the proposal, the manual decision takes immediate effect.
4. If the timer expires (2 hours elapsed with status still `proposed`):
   - The engine automatically transitions status to `auto_approved`.
   - The proposed room and time are committed to the active schedule.
   - An audit notification is dispatched to both the requester and administrator:  
     *`"Auto-Approved: 'Robotics Workshop' assigned to Maker Lab D at 14:00 (Admin 2-hr SLA expired)."`*

---

## 5. Functional Requirements

### 5.1 Request Intake & Semantic Parsing (FR-1)
- Natural language requests parsed by **Gemma 4** (`gemma-4-26b-a4b-it` via API or local open-weights).
- Extracts event type, attendance, duration, equipment tags, preferred time.
- If required details are missing, system returns a single structured clarification prompt.
- **Structured Fallback:** If Gemma 4 is offline, UI provides standard form intake with zero loss of scheduling functionality.

### 5.2 Deterministic SMT Constraint Engine (FR-2)
- Time domain: **30-minute slots from 09:00 to 18:00** (18 discrete half-hour slots per day).
- Hard Constraints enforced:
  - Room capacity $\ge$ attendance.
  - Required equipment $\subseteq$ room equipment.
  - No two events overlap in the same room.
  - Room open hours respected.
  - Events sharing a supervisor or required instructor do not overlap.
  - Room closures strictly observed.
  - `PROTECTED` events are immutable in room and time.
- Setup and cleanup buffer slots enforced for workshops and hackathons.

### 5.3 Best-Alternative & Lexicographic Ranking (FR-3)
- When evaluating requests or disruptions, Z3 optimizes sequentially:
  1. Minimize count of changed/displaced existing events.
  2. Minimize time difference from preferred start slot.
  3. Prefer current room before suggesting alternative rooms.
- Provides a clear **"Why this slot?"** explanation card:
  > *"Recommended Maker Lab D at 14:00 because it seats 35, includes electronics kits, is free for 2 hours, and avoids moving any existing event."*

### 5.4 Infeasibility & Conflict Explanation (FR-4)
- When a request or disruption cannot be satisfied under hard constraints, engine returns `status: infeasible`.
- Uses Z3 `unsat_core()` to identify the conflicting constraints.
- UI displays a clear explanation of conflicting rules (e.g., *"Cannot host 45 attendees because no open room with electronics kits exceeds capacity 35"*).

### 5.5 Schedule Diff & Audit Trail (FR-5)
- Renders before/after diff for emergency repairs, showing relocated vs retained events.
- Audit panel tracks: requester, approver (manual vs auto-approved), moved events, and reasoning.

---

## 6. Non-Functional Goals & Guardrails

- **Solve Latency Goal:** Target sub-2-second Z3 solution for daily campus schedules ($< 50$ events).
- **Accuracy Guarantee:** 100% of published schedules must pass independent zero-trust pure-Python validation.
- **Fail-Safe UI:** Distinct labels for `Live Gemma 4` vs `Structured Fallback`. Never misrepresent mock output as model inference.
