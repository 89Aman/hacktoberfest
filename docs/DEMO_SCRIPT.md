# 2-Minute Judging Demo Script — Campus Rescue

**Target Duration:** 120 Seconds (2 Minutes)  
**Pitch Essence:** *Campus Rescue uses Google Gemma 4 to understand campus scheduling requests in natural language, then a deterministic SMT constraint engine proves that every suggested classroom, time, capacity, and equipment requirement is mathematically valid before an admin publishes it.*

---

## Chronological Walkthrough

### 0:00 – 0:25 | Act I: The User Booking Request & "Why This Slot?"
- **Action:** Open **Tab 1: Request a Room**.
- **Demonstration:** Type or select:  
  *"We need a room for 30 students for a 2-hour Robotics workshop with electronics kits and projector."*
- **Explain to Judges:**  
  *"Gemma 4 parses the request into formal equipment, time, and capacity constraints. In under 50 milliseconds, our Z3 solver inspects the entire campus timetable and finds a collision-free slot."*
- **Highlight UI:** Point out the **"Why this slot?"** explanation card:  
  > *`"Recommended Maker Lab D at 14:00 because it seats 35, includes electronics kits, is free for 2 hours, and avoids displacing existing events."`*
- **Show SLA:** Highlight the **2-Hour Auto-Approval SLA countdown**.

---

### 0:25 – 0:50 | Act II: 2-Hour SLA Auto-Approval Daemon
- **Action:** Switch to **Tab 3: Admin Console**.
- **Demonstration:** Show the pending request in the queue. Click **"Simulate 2-Hour Timeout"**.
- **Explain to Judges:**  
  *"Campus coordinators are busy. If an admin doesn't approve within 2 hours, Campus Rescue doesn't leave students hanging—it automatically commits the verified slot, updates the live schedule, and sends notifications to both parties."*
- **Visual:** Request status flips to `auto_approved` (Green badge).

---

### 0:50 – 1:25 | Act III: Emergency Disruption & Minimal Disruption SMT Repair
- **Action:** On Admin Console, trigger **Preset 1 (Room Closure)**:  
  *"Robotics Lab A has an emergency water leak after 2 PM. Keep the Coding Assessment untouched."*
- **Demonstration:** Click **"Verify & Run Solver"**.
- **Explain to Judges:**  
  *"Notice the difference between a naive LLM and our system. Standard chatbots guess and cause double-bookings. Our SMT optimizer enforces lexicographic minimal disruption: it shifts only 1 single workshop to Lab D, keeps the assessment protected in Lab B, and displaces 0 total minutes."*
- **Visual:** Show the before/after diff table and the **Zero-Trust Validator Badge** (`✓ 8/8 checks passed`).

---

### 1:25 – 1:45 | Act IV: The Impossible Conflict (Unsat Core)
- **Action:** Click **Preset 3 (Attendance Spike + Closure)**:  
  *"Robotics Workshop now has 45 attendees, and Lab A is closed."*
- **Demonstration:** Run solver ➔ System returns **`UNSAT (Infeasible)`**.
- **Explain to Judges:**  
  *"Here is our core differentiator against AI hallucinations. When an impossible constraint occurs, Gemma and Z3 refuse to invent a phantom room. Instead, it extracts the Unsat Core and explains the exact mathematical blocker: Lab A is closed, and Maker Lab D only seats 35 students."*

---

### 1:45 – 2:00 | Conclusion & Impact
- **Deliver Final Punchline:**  
  *"Most campus tools generate a static timetable that breaks on day one. Campus Rescue bridges natural language requests with formal mathematical verification, making campus scheduling accountable, transparent, and resilient."*
