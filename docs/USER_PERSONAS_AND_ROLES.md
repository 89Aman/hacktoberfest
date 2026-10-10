# Campus Rescue — User Personas & Role-Based Workflows

This document specifies the exact requirements, operational workflows, and access boundaries for the three primary user personas of **Campus Rescue**:
1. **Student** (Consumer / Participant)
2. **Faculty / Mentor** (Resource Contributor & Session Supervisor)
3. **Super Admin / Campus Coordinator** (Authority, Arbiter & Dispatcher)

---

## 1. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Student | Faculty | Super Admin |
| :--- | :---: | :---: | :---: |
| **View Live Active Day Schedule** | Read-Only | Read-Only | Full Access |
| **View Equipment & Room Availability** | Read-Only | Read-Only | Full Access |
| **Subscribe to iCal / WhatsApp Room Alerts** | Allowed | Allowed | Allowed |
| **Submit Natural Language Delay / Availability Change** | No | Allowed (Own sessions) | Allowed (Any event) |
| **Toggle "Protected" Status on Exam / Critical Event** | No | Allowed (Own sessions) | Full Override |
| **Declare Emergency Room Closure (Flooding/Renovation)** | No | No | Full Access |
| **Trigger Z3 SMT Optimization & View Proposed Diff** | No | Read proposed preview | Full Access |
| **Inspect Unsat Conflict Cores & Relax Constraints** | No | Review conflict summary | Full Access |
| **Apply / Commit Schedule Repair Campus-Wide** | No | No | Full Authority |

---

## 2. Persona 1: The Student

### Profile & Context
- **Name Archetype:** Aarav (3rd-Year Undergraduate / Robotics Club Lead)
- **Environment:** Attending lectures, participating in student hackathons, robotics club workshops, and lab exams across multiple campus buildings.
- **Key Frustrations:**
  - Walking 15 minutes to Maker Lab D only to find it locked due to maintenance.
  - Relying on messy WhatsApp group forward messages that get buried or contradict official notices.
  - Unannounced room shifts that land their workshop in a room without required soldering kits or power plugs.

### Core Student Capabilities & Workflows

#### Workflow S-1: Checking Verified Daily Schedule
1. Aarav opens the Campus Rescue Student Portal on mobile or web.
2. The UI displays today's schedule organized chronologically:
   - Event Name, Current Room, Time Slot, Required Equipment.
   - Live Status Badge: `On Schedule` or `Relocated (Verified)`.
3. If an event has moved, a highlighted banner shows:
   *`Robotics Workshop: Moved from Lab A ➔ Lab D (14:00 - 16:00). Reason: Emergency AC Repair.`*

#### Workflow S-2: One-Click Calendar Feed Sync
1. Aarav clicks **"Subscribe to Today's Calendar"**.
2. Campus Rescue generates a dynamic `.ics` subscription URL.
3. Any changes applied by the Super Admin auto-update on Aarav's Google Calendar or Apple Calendar within seconds.

#### Workflow S-3: Equipment Verification
- Aarav checks whether Lab D has `electronics_kits` and `projector` before heading over. The platform guarantees that no workshop is ever relocated to a room lacking its mandatory equipment tags.

---

## 3. Persona 2: The Faculty / Mentor

### Profile & Context
- **Name Archetype:** Prof. Sunita Mehta / Dr. Rao (Department Faculty & Course Instructor)
- **Environment:** Conducting high-stakes coding assessments, supervising labs, managing academic committee meetings.
- **Key Frustrations:**
  - Getting delayed due to departmental meetings or travel and having no straightforward way to adjust lab timings without breaking other classes.
  - Fear of automated tools arbitrarily bumping high-stakes exams into inadequate rooms or overlapping slots.
  - Tedious bureaucratic paperwork just to reschedule a 2-hour lab session.

### Core Faculty Capabilities & Workflows

#### Workflow F-1: Reporting a Delay via Natural Language
1. Prof. Rao opens the Faculty Mobile Console.
2. Prof. Rao types in plain English:  
   *"I am delayed in transit and cannot supervise before 3:00 PM today."*
3. Gemma parses the statement into:
   ```json
   {
     "type": "delay_supervisor",
     "supervisor_id": "rao",
     "available_after_slot": 12
   }
   ```
4. The system previews the impact: *"Affects: Design Session (10:00) and Robotics Workshop (14:00)"*.
5. If an impossible condition is detected (e.g., morning session cannot fit its fixed allowed window), the system alerts Prof. Rao immediately with the conflicting rule rather than corrupting the timetable.

#### Workflow F-2: Locking / Protecting Critical Sessions
1. Prof. Mehta opens her schedule dashboard.
2. Selects `Coding Assessment (14:00 - 16:00, Computer Lab B)`.
3. Toggles the **`PROTECTED`** lock switch.
4. **System Guarantee:** Neither the room nor the time slot can be moved during any automated disruption repair. Even if a campus-wide emergency occurs, the solver considers protected events immutable unless manually unlocked by the coordinator.

---

## 4. Persona 3: The Super Admin / Campus Coordinator

### Profile & Context
- **Name Archetype:** Priya Sharma (Chief Academic Coordinator / Lab Superintendent)
- **Environment:** Central operations office, managing campus resources, physical keys, maintenance staff, and room allotments.
- **Key Frustrations:**
  - Sudden crises (water leaks, power cuts, air conditioner failure) requiring instantaneous decisions.
  - The ripple effect: moving Event 1 to Room 2 knocks Event 3 into Room 4, creating an invisible double-booking.
  - Faculty complaints when schedules are disrupted without clear explanations.

### Core Super Admin Capabilities & Workflows

#### Workflow A-1: Ingesting Emergency Disruption
1. Priya receives word that *Robotics Lab A has a water leak and must shut down from 14:00 to 17:00*.
2. In the Campus Rescue Admin Console, Priya types:  
   *"Close Lab A from 2 PM onward. Keep the Coding Assessment untouched."*
3. **Gemma Semantic Parser** translates the input:
   - Operation 1: `close_room(room_id="lab_a", start=14:00, end=17:00)`
   - Operation 2: `protect_event(event_id="coding_assessment")`
4. Priya clicks **"Verify & Run Solver"**.

#### Workflow A-2: Evaluating Minimal Disruption Repair
1. The **Z3 SMT Solver** runs within 300 ms.
2. UI displays a side-by-side **Diff Comparison**:
   - Total Events in Day: 6
   - **Events Changed: 1** (Only Robotics Workshop shifted to Lab D).
   - **Events Retained: 5** (Coding assessment, Club meeting, Maker intro, Project review, Design session untouched).
   - **Total Displacement:** 0 minutes shifted.
3. The **Independent Validator** badge displays green:  
   `✓ Capacity OK | ✓ Equipment OK | ✓ No Overlaps | ✓ Supervisor Available`.

#### Workflow A-3: Handling Unsatisfiable (UNSAT) Conflicts
1. In an extreme case, Priya inputs a scenario where *Robotics attendance surges to 45 while Lab A is closed*.
2. The solver returns **`UNSAT` (Infeasible)**.
3. Instead of crashing, the **Conflict Arbiter** highlights the Minimal Conflicting Core:
   - *Conflict:* Robotics Workshop needs `electronics_kits` and capacity $\ge 45$.
   - *Active state:* Lab A (closed) is the only room with capacity 40+. Lab D has equipment but only 35 seats.
   - *Resolution prompt:* *"Cannot schedule without relaxing attendance cap or authorizing an unequipped seminar room."*

#### Workflow A-4: One-Click Commit & Broadcast
1. Once Priya approves a valid repair, she clicks **"Apply Repair & Broadcast"**.
2. State updates atomically.
3. Fresh calendar feeds are served to students and faculty instantly.
