# Technical Requirements Document (TRD) — Campus Rescue

**Target Platform:** Python 3.10+  
**Core Dependencies:** `z3-solver>=4.13.0`, `pydantic>=2.0`, `streamlit>=1.35.0`, `requests`  
**Model Runtime:** Google Gemma 4 (e.g., `gemma-4-26b-a4b-it` via Google GenAI API or local server) with structured form fallback  
**Mathematical Engine:** Z3 SMT Theorem Prover & Optimizer  

---

## 1. System Technology Stack & Hosting Modes

| Layer | Component | Technical Selection | Rationale |
| :--- | :--- | :--- | :--- |
| **Model Ingestion** | Semantic Parser | Google Gemma 4 (`gemma-4-26b-a4b-it`) | State-of-the-art open-weights instruction model with native JSON constraint support. |
| **Hosting Mode A** | Live Inference | Google GenAI API / Gemma 4 Endpoint | Real-time semantic translation of complex requests. |
| **Hosting Mode B** | Fallback Mode | Structured Form / Seeded Preset Parser | Offline demo reliability; guaranteed operation when API is unreachable. |
| **Data Contract** | Type & Schema Safety | Pydantic V2 (`BaseModel`, `Field`) | Strict schema validation, datetime parsing, and enum enforcement. |
| **Formal Logic** | SMT Constraint Solver | Z3 SMT Solver (`z3-solver`) | Integer arithmetic, discrete optimization, and `unsat_core()` conflict tracking. |
| **Verification Gate**| Zero-Trust Gate | Pure Python (`validator.py`) | Decoupled verification eliminating modeling errors before UI display. |
| **UI Presentation** | Interactive Web | Streamlit (3-Tab Application) | Rapid reactive frontend without separate JavaScript build steps. |

---

## 2. Time Grid Standard: 30-Minute Discretization

The scheduling engine operates on **30-minute discrete slots from 09:00 to 18:00** (18 slots per day):

| Slot | Time Window | Slot | Time Window | Slot | Time Window |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | 09:00 – 09:30 | **6** | 12:00 – 12:30 | **12** | 15:00 – 15:30 |
| **1** | 09:30 – 10:00 | **7** | 12:30 – 13:00 | **13** | 15:30 – 16:00 |
| **2** | 10:00 – 10:30 | **8** | 13:00 – 13:30 | **14** | 16:00 – 16:30 |
| **3** | 10:30 – 11:00 | **9** | 13:30 – 14:00 | **15** | 16:30 – 17:00 |
| **4** | 11:00 – 11:30 | **10** | 14:00 – 14:30 | **16** | 17:00 – 17:30 |
| **5** | 11:30 – 12:00 | **11** | 14:30 – 15:00 | **17** | 17:30 – 18:00 |

- **Rounding Rule:** Requests with off-grid times (e.g., 3:15 PM) are rounded forward to the next available 30-minute boundary (e.g., 3:30 PM, Slot 13) or prompted for clarification. Never truncate or drift arbitrarily.
- **Interval Notation:** Half-open intervals $[s, e)$, allowing an event ending at slot 10 (14:00) to be followed immediately by an event starting at slot 10.

---

## 3. Gemma 4 Semantic Translation Pipeline

### 3.1 Inference Configuration
- **Model:** `gemma-4-26b-a4b-it`
- **Temperature:** `0.0` (Greedy decoding for maximum consistency).
- **Prompt Architecture:**
  - Ingests room catalog, equipment labels, and slot mapping.
  - Outputs typed JSON conforming to `BookingRequestExtraction` or `DisruptionEnvelope`.
  - Rejects unknown entities with `status: "needs_clarification"`.

### 3.2 Labeling Requirement
The UI must explicitly display which mode produced the parsed state:
- `Badge: Live Gemma 4 Inference` when using the model API.
- `Badge: Structured Fallback Mode` when using local presets or form input.
*Never present fallback output as model-generated.*

---

## 4. Mathematical Constraint Formulation in Z3

### 4.1 Decision Variables
For each event $i$:
- $\text{room}_i \in \{0, \dots, M-1\}$ (Integer index of assigned room)
- $\text{start}_i \in \{0, \dots, 17\}$ (Integer start slot)
- Constant duration: $d_i$
- Buffers: $\text{buf\_before}_i, \text{buf\_after}_i \in \{0, 1\}$

### 4.2 Hard Constraints
1. **Window Boundaries:**
   $$\text{start}_i - \text{buf\_before}_i \ge \text{earliest}_i \quad \land \quad \text{start}_i + d_i + \text{buf\_after}_i \le \text{latest}_i$$
2. **Room Capacity:**
   $$\forall r, \quad (\text{room}_i = r) \implies (\text{Capacity}(r) \ge \text{attendance}_i)$$
3. **Equipment Requirements:**
   $$\forall r, \quad (\text{room}_i = r) \implies (\text{required\_equipment}_i \subseteq \text{equipment}_r)$$
4. **Room Mutual Exclusion (with Buffers):**
   $$\forall i \ne j, \quad (\text{room}_i = \text{room}_j) \implies (\text{end\_with\_buffer}_i \le \text{start\_with\_buffer}_j \lor \text{end\_with\_buffer}_j \le \text{start\_with\_buffer}_i)$$
5. **Supervisor Mutual Exclusion:**
   $$\forall i \ne j \text{ with same supervisor}, \quad (\text{start}_i + d_i \le \text{start}_j \lor \text{start}_j + d_j \le \text{start}_i)$$
6. **Room Closure:**
   $$\forall i \text{ where } \text{room}_i = r_{\text{closed}}, \quad (\text{start}_i + d_i \le \text{close\_start} \lor \text{start}_i \ge \text{close\_end})$$
7. **Protected Events:**
   $$\forall i \text{ where } \text{is\_protected} = \text{True}, \quad \text{room}_i = \text{orig\_room}_i \land \text{start}_i = \text{orig\_start}_i$$

---

## 5. Lexicographic Optimization & Conflict Explanation

### 5.1 Optimization Objectives
When solving for room requests or disruption repairs, `z3.Optimize()` executes in priority sequence:
1. **Primary:** Minimize displacement of existing events ($\min \sum \mathbb{I}[\text{changed}]$).
2. **Secondary:** Minimize difference between proposed slot and preferred slot ($\min |\text{start}_i - \text{pref}_i|$).
3. **Tertiary:** Prefer assigning originally requested room before searching alternatives.

### 5.2 Conflict Explanations via `unsat_core()`
- A distinct `z3.Solver()` instance runs `assert_and_track()` on every named constraint.
- If `solver.check() == unsat`, `solver.unsat_core()` isolates the conflicting constraint subset.
- Note: Z3's `unsat_core()` is a **conflicting subset**, not mathematically guaranteed to be minimal without running iterative core reduction. The system documents this truthfully as a **conflict explanation**, not a "minimal core."

---

## 6. The 2-Hour Auto-Approval Daemon & SLA Worker

### 6.1 State Machine & Expiry Logic
```python
def check_sla_timeouts(active_requests, current_timestamp):
    """
    Checks for proposed requests exceeding the 2-hour SLA window.
    Automatically commits the optimal verified slot if admin hasn't intervened.
    """
    for req in active_requests:
        if req.status == "proposed":
            time_elapsed = current_timestamp - req.created_at
            if time_elapsed.total_seconds() >= 7200:  # 2 hours
                # 1. Commit allocation to active schedule
                commit_allocation(req.proposed_room_id, req.proposed_start_slot, req)
                # 2. Update status
                req.status = "auto_approved"
                req.auto_approved_at = current_timestamp
                # 3. Log notification for requester and admin
                log_notification(
                    recipient="requester_and_admin",
                    message=f"Auto-Approved: {req.event_name} allocated to {req.proposed_room_id} at slot {req.proposed_start_slot} (2-hr SLA timeout)."
                )
```

In the local Streamlit MVP, this logic is evaluated upon state refresh or simulated via a **"Fast-Forward 2 Hours"** testing button.

---

## 7. Independent Zero-Trust Validator (`validator.py`)

A pure-Python validation module checks all 8 invariant rules independently of Z3 before any candidate schedule is rendered:
1. Exact event list completeness.
2. Valid slot ranges $[0, 18)$.
3. Room capacity $\ge$ attendance.
4. Required equipment tags satisfied.
5. Zero room overlaps (including setup/cleanup buffers).
6. Zero supervisor overlaps.
7. Zero events in closed rooms during closure windows.
8. All protected events completely unchanged.
