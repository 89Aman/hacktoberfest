# Application Flow & UX Specification (App Flow) — Campus Rescue

**UX Model:** Unified 3-Tab Single-Page Reactive Application  
**Framework:** Streamlit (Python) with live state persistence  

---

## 1. Application Layout & Tab Architecture

The UI is streamlined into three high-impact tabs:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header: Campus Rescue  [Live Gemma 4 / Structured Mode]  [Current Time] │
├────────────────────────────────────────────────────────────────────────┤
│ [ Tab 1: Request a Room ]  │  [ Tab 2: Live Schedule ]  │  [ Tab 3: Admin Console ] │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tab 1: Request a Room (General User Portal)

Built for students, club organizers, and instructors to book campus spaces.

```
┌──────────────────────────────────────────────────────────────┐
│ [Left: Request Form]           │ [Right: Proposed Allocation]│
│ - Natural Language or Inputs:  │                             │
│   "Need a room for 35 people   │ ✓ Verified Slot Found       │
│    for 2h robotics workshop    │ Room: Maker Lab D           │
│    with electronics kits"      │ Time: 14:00 – 16:00 (2 hrs) │
│ - Event Type: Workshop         │ Equipment: [kits] [projector│
│ - Attendance: 35               │                             │
│ - Equipment checkboxes         │ ─── Explanation Card ────── │
│ - Preferred Time (or Best)     │ "Recommended Maker Lab D at │
│ - Setup Buffer: [30m toggle]   │  14:00 because it seats 35, │
│                                │  includes electronics kits, │
│ [Submit Request Button]        │  and avoids moving events." │
│                                │                             │
│                                │ Status: Proposed to Admin   │
│                                │ (Auto-approves in 2 hrs)    │
└──────────────────────────────────────────────────────────────┘
```

### User Journey
1. User types in plain English or fills the structured dropdown form.
2. In **Live Mode**, Gemma 4 extracts constraints into JSON. In **Fallback Mode**, standard form values are ingested directly.
3. The SMT solver identifies the best vacant slot and displays the **"Why this slot?"** explanation card.
4. User clicks **"Submit Request"** ➔ Status enters `proposed`, and the 2-hour SLA countdown begins.

---

## 3. Tab 2: Live Schedule (Public Timetable View)

Built for campus-wide visibility (Students & Faculty).

```
┌──────────────────────────────────────────────────────────────┐
│ Date: Today  |  Filter: [All Rooms] [Only Relocated Events]  │
├──────────────────────────────────────────────────────────────┤
│ 09:00 - 18:00 Grid (18 Slots x 4 Seeded Rooms):              │
│                                                              │
│ [Robotics Lab A]   [Computer Lab B]  [Seminar C]  [Maker D]  │
│ 09:00 - 10:00      Design Session                            │
│ 10:00 - 11:00                                                │
│ 13:00 - 14:00                                     Maker Intro│
│ 14:00 - 16:00      Coding Exam [🔒]               Robotics*  │
│                                                              │
│ * Badge: Relocated to Maker Lab D (Reason: AC leak in Lab A) │
├──────────────────────────────────────────────────────────────┤
│ [Download .ics Calendar]   [Subscribe to WhatsApp Alerts]    │
└──────────────────────────────────────────────────────────────┘
```

### Key Elements:
- **30-Minute Grid:** 09:00 to 18:00 half-hour blocks.
- **Relocation Badges:** Clearly highlights if an event was relocated from its original venue.
- **Protected Badge:** Shows `[🔒 PROTECTED]` for exams or locked lectures.

---

## 4. Tab 3: Admin Console (Operations & Emergency Desk)

Built for campus coordinators and administrators.

```
┌──────────────────────────────────────────────────────────────┐
│ Section A: Pending Booking Requests & 2-Hour SLA Queue       │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ "Robotics Workshop" | 35 Seats | Proposed: Lab D (14:00) │ │
│ │ SLA Remaining: 01h:42m [Auto-approves if unreviewed]     │ │
│ │ Actions: [Approve Now]  [Edit Slot]  [Reject]            │ │
│ └──────────────────────────────────────────────────────────┘ │
│ [Simulate 2-Hour SLA Timeout (Demo Test Button)]             │
├──────────────────────────────────────────────────────────────┤
│ Section B: Emergency Disruption Desk                         │
│ - Natural Language Input: "Lab A flooded after 2 PM"         │
│ - Quick Preset Buttons:                                      │
│   [Preset 1: Room Closure]  [Preset 2: Attendance Spike]     │
│   [Preset 3: Impossible Conflict (UNSAT)]                    │
├──────────────────────────────────────────────────────────────┤
│ Section C: Repair Diff & Independent Verification            │
│ - Metric Cards: 1 Event Changed · 0 Mins Shifted · 100% Valid│
│ - Diff Table: Shows original vs repaired location.           │
│ - Actions: [Apply Repair & Broadcast]   [Discard]   [Reset]  │
└──────────────────────────────────────────────────────────────┘
```

### Admin Actions & SLA Behavior:
1. **Manual Action:** Admin clicks `Approve Now` ➔ Request status becomes `approved`. Schedule updates.
2. **Auto-Approval:** If admin takes no action within 2 hours (or tester clicks `Simulate 2-Hour SLA Timeout`), the system automatically promotes the proposed slot to `auto_approved` and broadcasts the update.
3. **Emergency Disruption:** When a room is closed, Z3 executes lexicographic minimal disruption and highlights the verified replacement plan.
