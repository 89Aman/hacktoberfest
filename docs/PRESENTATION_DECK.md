# Campus Rescue — Presentation Deck & Speaker Script

**Project:** Campus Rescue — Neuro-Symbolic Campus Scheduling & Disruption Repair  
**Target:** Hacktoberfest IIT Bombay / Campus Gemma Hackathon  
**PowerPoint File:** [`Campus_Rescue_Presentation.pptx`](file:///c:/Users/shasa/Projects/Hacktoberfest-iitb/Hackathon/Campus_Rescue_Presentation.pptx)  
**Aspect Ratio:** 16:9 Widescreen (13.33" × 7.5")  
**Target Pitch Time:** 2 to 5 minutes  

---

## Slide 1: Title & Hero Pitch
- **Header:** Hacktoberfest IIT Bombay 2026
- **Title:** CAMPUS RESCUE
- **Subtitle:** Neuro-Symbolic Campus Scheduling & Autonomous Disruption Repair
- **Byline:** Bridging Google Gemma 4 Semantic Understanding with Z3 SMT Deterministic Proofs
- **Highlights:**
  - **Google Gemma 4:** Natural language constraint compiler & AST extractor
  - **Z3 SMT Solver:** Deterministic 0-conflict proof & lexicographic repair
  - **2-Hour SLA Daemon:** Zero administrative bottlenecks via autonomous fallback
- **Speaker Notes:**
  > *"Good morning, judges. We are presenting Campus Rescue. Every campus struggles with room bookings and unexpected timetable disruptions. Standard AI chatbots hallucinate phantom rooms and double-book slots. Campus Rescue solves this by pairing Google Gemma 4 for natural language parsing with the Z3 SMT theorem prover for mathematical verification. In addition, our 2-hour SLA daemon guarantees students are never left stranded by busy coordinators."*

---

## Slide 2: The Problem — Why Traditional & AI Scheduling Fails
- **Category:** Campus Friction
- **Title:** The Problem: Why Traditional & AI Scheduling Fails
- **Subtitle:** Real campuses face chaotic schedule disruptions, slow approvals, and unreliable AI chatbots
- **Three Pillars:**
  1. **Campus Scheduling Reality:**
     - Paper forms, WhatsApp groups, spreadsheets cause 48+ hour delays.
     - Rooms booked without required projectors, computer labs, or kits.
     - Single water leak or class delay causes cascading timetable clashes.
     - Coordinators drown in approval queues.
  2. **The "Chatbot Trap":**
     - LLMs predict text probabilities, not discrete mathematical truths.
     - Generative chatbots hallucinate non-existent rooms or double-book spaces.
     - Silently violate 30-minute slot boundaries, capacity ceilings, and teacher schedules.
     - One hallucinated room swap breaks 10 subsequent university lectures.
  3. **The Campus Rescue Standard:**
     - Neuro-symbolic split: Gemma understands; Z3 proves.
     - Mathematical guarantee of 0 double-bookings.
     - 2-Hour SLA auto-commits verified slots if coordinators are unavailable.
     - Truthful Unsat cores explain why a conflict cannot be satisfied without phantom rooms.
- **Speaker Notes:**
  > *"Why can't universities just use a ChatGPT or Gemini wrapper for room bookings? Because LLMs are probabilistic token predictors. If you ask a chatbot to reschedule a 45-person lab when Room A is flooded, it will casually hallucinate a 35-seat room or assign two workshops to the same hall. Campus Rescue decouples language understanding from mathematical constraints so hallucination is physically impossible."*

---

## Slide 3: Neuro-Symbolic Architecture
- **Category:** Core Innovation
- **Title:** Architecture: Neuro-Symbolic Separation of Concerns
- **Subtitle:** Decoupling probabilistic natural language understanding from deterministic mathematical proof
- **Components:**
  - **Semantic Translation (Google Gemma 4):**
    - Parses conversational requests in free-form English.
    - Role-restricted as a semantic compiler into a typed Pydantic V2 AST.
    - Emits targeted clarification prompts if inputs are ambiguous.
  - **Deterministic Proof (Z3 SMT Engine):**
    - Discretizes campus day into 18 half-hour integer slots (09:00 - 18:00).
    - Formulates capacity, equipment, and teacher schedules into hard SMT constraints.
    - Runs lexicographic multi-objective optimization (minimizes displacement & time drift).
    - Pure-Python zero-trust gate audits all 8 invariant rules independently before render.
- **Speaker Notes:**
  > *"Here is our core technical innovation. Gemma 4 acts strictly as an AST compiler—extracting duration, equipment tags, and attendee counts into typed schemas. It is explicitly prohibited from assigning rooms. That job belongs entirely to the Z3 SMT solver, which evaluates the entire campus state and returns a mathematically sound solution in under 50 milliseconds."*

---

## Slide 4: End-to-End Control Flow
- **Category:** Workflow
- **Title:** End-to-End Control Loop: From Request to Verified Calendar
- **Subtitle:** Structured data pipeline with multi-gate validation and automated SLA fallback
- **5-Step Pipeline:**
  1. **Intake Request:** Student or faculty submits conversational query or structured form.
  2. **Gemma 4 Parse:** Compiles text into typed AST payload.
  3. **Z3 SMT Solver:** Computes optimal collision-free slot or extracts Unsat core.
  4. **Zero-Trust Gate:** Pure-Python auditor verifies 8/8 invariant rules independently.
  5. **Admin / SLA Gate:** Coordinator reviews with 2-hour countdown; auto-commits if timer expires.
- **Performance:** Gemma 4 (~800ms) + Z3 Solver (<50ms) + Zero-Trust audit (<5ms) = Instant UI response.
- **Speaker Notes:**
  > *"Let's trace the control loop. From a natural language prompt, Gemma produces a validated schema in 800ms. Z3 solves the constraints in under 50ms. Before any schedule changes reach the UI, an independent Python validator verifies 8 invariant rules. The coordinator receives a verified proposal with a 2-hour SLA countdown."*

---

## Slide 5: The SMT Constraint Engine
- **Category:** Constraint Formulation
- **Title:** The SMT Engine: Mathematical Rigor & Multi-Objective Optimization
- **Subtitle:** Formal constraints eliminate double-bookings and ensure optimal schedule repair
- **Hard Constraints (Non-Negotiable):**
  - $\text{Capacity}(\text{Room}_i) \ge \text{Attendance}_i$
  - $\text{Required Equipment}_i \subseteq \text{Room Equipment}_i$
  - Discrete slot intervals $\subset [0, 18)$
  - Zero room overlaps & Zero supervisor overlaps
  - Mandatory 30-min setup/cleanup buffers for workshops
  - Protected events (exams) are immutable in room and time
- **Lexicographic Optimization Objectives:**
  - **Priority 1:** Minimize event displacement ($\min \sum \mathbb{I}[\text{changed}]$).
  - **Priority 2:** Minimize time drift ($\min |\text{start}_i - \text{pref}_i|$).
  - **Priority 3:** Preserve original requested room.
- **Speaker Notes:**
  > *"When an emergency occurs, you don't want an algorithm that scrambles the whole campus timetable. Our Z3 engine uses lexicographic optimization: first, it strictly minimizes the number of existing events moved. Second, it minimizes time drift from the requested slot. Third, it keeps the original room if possible. Protected exams are mathematically locked and can never be moved."*

---

## Slide 6: Autonomous Governance & 2-Hour SLA
- **Category:** Operational Velocity
- **Title:** Autonomous Governance: The 2-Hour Auto-Approval SLA
- **Subtitle:** Eliminating bureaucratic bottlenecks while preserving complete administrator oversight
- **State Machine Flow:**
  1. **Instant Proposal:** Request verified by Z3 immediately upon submission.
  2. **2-Hour SLA Countdown:** Real-time timer visible on requester view and admin dashboard.
  3. **Manual Window:** Coordinator can approve, modify, or reject within 120 minutes.
  4. **Autonomous Commit:** If timer elapses with no action, status transitions to `auto_approved` and commits to active timetable.
  5. **Audit Notification:** Dispatch instant notice to student, coordinator, and facility head.
- **Key Metrics:**
  - **0 Hours** unattended scheduling delay.
  - **100% Safe:** Auto-approvals are pre-verified by Z3 before timer starts.
- **Speaker Notes:**
  > *"In university life, requests often sit in an administrator's inbox for days. Campus Rescue introduces an autonomous 2-hour SLA daemon. Because Z3 has already verified the slot as collision-free, if an administrator does not intervene within 2 hours, the engine automatically commits the booking and alerts all stakeholders. No student event is ever blocked by bureaucratic latency."*

---

## Slide 7: Explainability & Zero-Trust Validation
- **Category:** Transparency & Auditing
- **Title:** Explainability: 'Why This Slot?' & Zero-Trust Validation
- **Subtitle:** Every recommendation is accompanied by human-readable proof and audited by an independent gate
- **Features:**
  - **"Why This Slot?" Explanation Cards:**
    - Derived directly from Z3 model assignments, not fabricated by LLM.
    - Example: *"Recommended Maker Lab D at 14:00 because it seats 35 (request: 30), includes electronics kits, has no supervisor conflicts, and displaces 0 existing events."*
  - **Independent Zero-Trust Validator (`validator.py`):**
    - Pure Python, zero external dependencies.
    - Evaluates 8 invariant rules independently of Z3 before any schedule mutation is displayed.
    - Displays a live `✓ 8/8 checks passed` verification badge.
- **Speaker Notes:**
  > *"Trust requires explanation and verification. First, our 'Why This Slot?' cards explain the solver's rationale using verified facts. Second, we implement a Zero-Trust architecture: an independent pure-Python validator checks all 8 invariant rules before the frontend is allowed to render the schedule. Even if the solver encountered an edge case, the zero-trust gate acts as an uncompromisable barrier."*

---

## Slide 8: Edge Cases & Unsat Core Diagnostics
- **Category:** Zero-Hallucination Robustness
- **Title:** Edge Cases: Mathematical Unsat Core Diagnostics
- **Subtitle:** When a request is impossible, the system proves infeasibility and isolates exact mathematical blockers
- **The Impossible Scenario:**
  - Request: Robotics workshop for 45 students with kits after 2 PM.
  - Physical constraint: Lab A is closed (pipe leak). Maker Lab D only seats 35 students.
  - Standard Chatbot: Hallucinates 45 seats into Lab D or creates a phantom room.
  - Campus Rescue: Proves `UNSAT` in <20ms.
- **Unsat Core Isolation:**
  - Solver tracks named constraints via `assert_and_track()`.
  - Extracts conflicting subset: *Lab A is closed AND Maker Lab D max capacity is 35 (demanded 45)*.
  - Gives actionable options: split into sections, relax attendance, or waive equipment prerequisite.
- **Speaker Notes:**
  > *"What happens when a request is physically impossible? An LLM will lie to please the user. Campus Rescue refuses to hallucinate. It runs Z3's Unsat Core extractor, isolates the exact conflicting constraints, and explains: 'Lab A is closed, and Maker Lab D only seats 35.' It then suggests actionable compromises like splitting the session or waiving equipment."*

---

## Slide 9: User Experience & 3-Role Interface
- **Category:** Application Workflows
- **Title:** User Experience: Tailored Workflows for Campus Personas
- **Subtitle:** Role-based views designed for fast decision making and zero administrative friction
- **Workflows:**
  - **Student & Club Leads (Tab 1: Request a Room):**
    - Natural language input bar + structured form toggle.
    - Instant verified slot recommendation card.
    - "Why this slot?" transparent justification.
    - Live 2-Hour SLA countdown badge + .ics calendar export.
  - **Super Admins & Coordinators (Tab 2: Admin Queue & SLA):**
    - Live pending requests queue with one-click approve/edit/reject.
    - "Simulate 2-Hour Timeout" testing button.
    - Complete audit log of manual and auto-approved bookings.
    - Room emergency closure toggle.
  - **Disruption Response Team (Tab 3: Emergency Repair):**
    - Emergency disruption simulator (water leaks, delayed professors).
    - Lexicographic minimal-disruption SMT repair.
    - Interactive Before/After diff schedule matrix.
    - Zero-Trust 8/8 invariant audit badge.
- **Speaker Notes:**
  > *"Our Streamlit application provides dedicated tabs for students, administrators, and emergency coordinators. Students get simple plain-English bookings; admins get a high-velocity approval queue; coordinators get interactive before-and-after diff tables to repair schedule disruptions in one click."*

---

## Slide 10: Tech Stack & Production Engineering
- **Category:** System Implementation
- **Title:** Technology Stack & Production Engineering
- **Subtitle:** Production-grade stack built with Google Cloud AI, formal logic, and modern web frameworks
- **Stack Breakdown:**
  - **Google Gemma 4 (`gemma-4-26b-a4b-it`):** Semantic compiler & AST extractor with structured fallback mode.
  - **Z3 SMT Solver (`z3-solver` v4.13+):** Theorem prover, lexicographic optimizer, and Unsat core extractor.
  - **Backend & Schemas:** FastAPI + Pydantic V2 type contracts with 30-minute discrete time slots.
  - **Database & Persistence:** Supabase PostgreSQL for persistent schedules, rooms, and audit trails.
  - **Frontend UI:** Streamlit responsive dashboard with live timetable matrix and SLA badges.
  - **Independent Auditor:** Pure-Python `validator.py` executing 8 zero-trust rules.
- **Speaker Notes:**
  > *"Our tech stack is engineered for production reliability: Google Gemma 4 for language understanding, Z3 SMT solver for mathematical proof, FastAPI and Pydantic V2 for schema contracts, Supabase PostgreSQL for persistence, and Streamlit for an interactive dashboard. Even if Gemma 4 is offline, our structured fallback ensures 100% operational continuity."*

---

## Slide 11: 2-Minute Judging Demo Script
- **Category:** Demo Rehearsal
- **Title:** Live Demo Plan: The 2-Minute Judging Chronology
- **Subtitle:** Structured pitch sequence demonstrating every core breakthrough within 120 seconds
- **Chronological Sequence:**
  - **0:00 – 0:25 | Act I:** Submit natural language booking ("30 students, Robotics, kits"). Show Gemma parse + Z3 solve (<50ms). Highlight "Why this slot?" card and 2-Hour SLA timer.
  - **0:25 – 0:50 | Act II:** Switch to Admin Queue. Show pending request. Click "Simulate 2-Hour Timeout". Status flips to `auto_approved` with audit notification.
  - **0:50 – 1:25 | Act III:** Trigger Preset 1: Lab A water leak after 2 PM. SMT solver moves only 1 workshop to Lab D, keeps exam protected, 0 displaced minutes. Show 8/8 Zero-Trust badge.
  - **1:25 – 1:45 | Act IV:** Trigger Preset 3: 45 attendees + Lab A closed. Returns `UNSAT`. Show Unsat Core explanation (zero hallucinations).
  - **1:45 – 2:00 | Act V:** Deliver punchline: *"Campus Rescue bridges natural language requests with formal mathematical verification, making campus scheduling accountable, transparent, and resilient."*
- **Speaker Notes:**
  > *"When demoing for judges, follow this strict 120-second choreography. In 2 minutes, you prove natural language understanding, automated SLA resolution, minimal disruption schedule repair, and mathematical hallucination immunity."*

---

## Slide 12: Impact, Scalability & Future Roadmap
- **Category:** Vision & Viability
- **Title:** Impact, Campus Scalability & Future Roadmap
- **Subtitle:** Transforming university operations from fragile manual registers to resilient autonomous infrastructure
- **Key Dimensions:**
  - **Immediate Campus Value:**
    - 0 double-bookings guaranteed.
    - 90% faster booking turnaround (48h down to instant or 2h SLA).
    - 100% conflict transparency with mathematical justifications.
    - Autonomous resilience during floods, power outages, and delays.
  - **Technical Scalability:**
    - Sub-50ms solver performance across 50+ campus rooms and 300+ daily events.
    - Edge/Local Gemma 4 execution for zero data egress and low cost.
    - Stateless solver architecture ready for serverless horizontal scaling.
  - **Future Roadmap:**
    - Multi-campus federated resource mesh for shared inter-college facilities.
    - Energy-aware HVAC routing: clustering events to minimize building cooling power.
    - Two-way Google Calendar and Microsoft Outlook bi-directional sync.
    - QR-code check-ins with 15-minute auto-release for no-show events.
- **Speaker Notes:**
  > *"Campus Rescue transforms campus operations from fragile spreadsheets into an autonomous, self-healing operating system. It scales to hundreds of classrooms, cuts approval delays from days to hours, and lays the groundwork for energy-smart campus facility automation. Thank you, and we welcome your questions!"*

---

## Quick Presentation Tips for the Hackathon Pitch
1. **Don't Read the Slides:** Use the bullet points as visual anchors while you deliver the spoken script naturally.
2. **Emphasize the Neuro-Symbolic Distinction:** Judges love when teams clearly explain why an LLM alone is insufficient for combinatorial optimization.
3. **Show, Don't Just Tell:** Run the 2-minute demo live using the pre-seeded buttons to guarantee a flawless presentation.
4. **Highlight the 2-Hour SLA:** It demonstrates real-world operational thinking beyond just building another tech demo.
