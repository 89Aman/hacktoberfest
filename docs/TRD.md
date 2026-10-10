# Technical Requirements Document (TRD) — Campus Rescue

**Target Platform:** Python 3.10+  
**Core Dependencies:** `z3-solver`, `pydantic>=2.0`, `streamlit`, `requests`, `pytest`  
**Model Runtime:** Google Gemma 2 (2B / 9B) via Ollama, llama.cpp, or HuggingFace endpoint  
**Architecture Style:** Neuro-Symbolic State Machine  

---

## 1. System Technology Stack

| Layer | Component | Technical Selection | Rationale |
| :--- | :--- | :--- | :--- |
| **Model Ingestion** | Semantic Parser | Google Gemma 2 (`gemma-2-2b-it` / `gemma-2-9b-it`) | High instruction-following accuracy in small open-weight models. |
| **Model Serving** | Local Inference | Ollama HTTP API (`POST /api/generate`) | Zero-friction local serving on edge hardware with JSON mode. |
| **Data Contract** | Type & Schema Safety | Pydantic V2 (`BaseModel`, `Field`, `model_validator`) | Strict discriminated union verification and runtime type coercion. |
| **Formal Logic** | SMT Constraint Solver | Z3 SMT Solver (`z3-solver==4.13.0`) | Battle-tested SAT/SMT engine supporting integer arithmetic & unsat cores. |
| **Verification Gate**| Zero-Trust Gate | Pure Python (`validator.py`) | Decoupled verification eliminating solver modeling mistakes. |
| **UI Presentation** | Interactive Web | Streamlit (`streamlit>=1.35.0`) | Rapid, reactive UI without JavaScript build-chain complexity. |
| **Distribution** | Calendar Protocol | iCalendar specification (RFC 5545) | Universally compatible calendar subscription format. |

---

## 2. Gemma 2 Semantic Translation Specifications

### 2.1 Inference Parameters
- **Temperature:** `0.0` (Deterministic greedy decoding).
- **Top-P:** `0.95`
- **Output Format:** Strict JSON Object (`format: "json"` in Ollama).
- **Maximum Tokens:** 512 tokens.

### 2.2 System Prompt Skeleton
```text
You are a formal campus disruption parser for Campus Rescue.
Translate the user's natural-language campus disruption into an allowlisted JSON payload.

Available Room IDs: {ALLOWED_ROOM_IDS}
Available Event IDs: {ALLOWED_EVENT_IDS}
Available Supervisor IDs: {ALLOWED_SUPERVISOR_IDS}
Allowed Operations:
1. close_room: {"type": "close_room", "room_id": "<id>", "start_slot": <int>, "end_slot": <int>}
2. change_attendance: {"type": "change_attendance", "event_id": "<id>", "new_attendance": <int>}
3. delay_supervisor: {"type": "delay_supervisor", "supervisor_id": "<id>", "available_after_slot": <int>}
4. protect_event: {"type": "protect_event", "event_id": "<id>"}

Rules:
- Slots are 30-minute intervals: 0=09:00, 2=10:00, 6=12:00, 10=14:00, 12=15:00, 16=17:00.
- If information is missing or ambiguous, set status to "needs_clarification" with a concise question.
- Do NOT output explanations or markdown. Output JSON only.
```

### 2.3 Resilience & Retry Flow
1. **Pass 1:** Model generates JSON AST.
2. **Schema Check:** Pydantic validates payload against `DisruptionEnvelope`.
3. **Corrective Retry:** If JSON is malformed or contains invalid IDs, pass the error string back to Gemma for one corrective attempt:
   ```text
   Validation Error: room_id 'lab_x' does not exist. Permitted: ['lab_a', 'lab_b', 'seminar_c', 'lab_d'].
   Correct your JSON output.
   ```
4. **Fallback:** If retry fails, activate GUI Structured Input Mode.

---

## 3. Mathematical Constraint Formulation in Z3

### 3.1 Domain & Variables
For each event $i \in \{1, \dots, N\}$:
- Room Assignment Variable: $\text{room}_i \in \mathbb{Z}$, domain mapped to room index $[0, M-1]$.
- Start Time Variable: $\text{start}_i \in \mathbb{Z}$, domain $[0, 16]$.
- Constant: $\text{duration}_i \in \mathbb{Z}^+$.

### 3.2 Hard Constraints Implementation

#### 1. Time Window Constraints
For each event $i$:
$$\text{start}_i \ge \text{earliest\_start}_i \quad \land \quad \text{start}_i + \text{duration}_i \le \text{latest\_end}_i$$

#### 2. Room Capacity Constraints
For each event $i$ and room $r$:
$$(\text{room}_i = r) \implies (\text{Capacity}(r) \ge \text{attendance}_i)$$

#### 3. Equipment Prerequisite Constraints
For each event $i$ and room $r$:
$$(\text{room}_i = r) \implies (\text{required\_equipment}_i \subseteq \text{equipment}_r)$$

#### 4. Mutual Exclusion (No Room Overlap)
For every distinct pair of events $(i, j)$ where $i \ne j$:
$$(\text{room}_i = \text{room}_j) \implies (\text{start}_i + \text{duration}_i \le \text{start}_j \lor \text{start}_j + \text{duration}_j \le \text{start}_i)$$

#### 5. Supervisor Mutual Exclusion
For every distinct pair $(i, j)$ sharing supervisor $S$:
$$\text{start}_i + \text{duration}_i \le \text{start}_j \lor \text{start}_j + \text{duration}_j \le \text{start}_i$$

#### 6. Room Closure Interval $[A, B)$
For each event $i$ and closed room $R_{\text{closed}}$:
$$(\text{room}_i = R_{\text{closed}}) \implies (\text{start}_i + \text{duration}_i \le A \lor \text{start}_i \ge B)$$

#### 7. Protected Events
For each event $i$ marked `protected = True`:
$$\text{room}_i = \text{original\_room}_i \quad \land \quad \text{start}_i = \text{original\_start}_i$$

---

### 3.3 Lexicographic Multi-Objective Optimization

Optimization runs on `z3.Optimize()`:

```python
from z3 import *

opt = Optimize()
# Add all hard constraints...

# Objective 1: Minimize number of changed events
changed_flags = []
for i in events:
    is_changed = If(
        Or(room_var[i] != orig_room[i], start_var[i] != orig_start[i]), 1, 0
    )
    changed_flags.append(is_changed)

opt.minimize(Sum(changed_flags))

# Objective 2: Minimize total absolute displacement in time slots
displacements = []
for i in events:
    disp = If(
        start_var[i] >= orig_start[i],
        start_var[i] - orig_start[i],
        orig_start[i] - start_var[i]
    )
    displacements.append(disp)

opt.minimize(Sum(displacements))
```

---

### 3.4 Infeasibility & Minimal Unsatisfiable Core (MUC)
Feasibility check runs on a separate `z3.Solver()` using tracked assertions:
```python
solver = Solver()
# Attach named boolean tracking literal to each constraint
solver.assert_and_track(capacity_constraint_i, f"capacity_event_{i}")
solver.assert_and_track(equipment_constraint_i, f"equipment_event_{i}")
solver.assert_and_track(closure_constraint_i, f"closure_room_{r}")

if solver.check() == unsat:
    core = solver.unsat_core()
    # Returns: [capacity_event_robotics, closure_room_lab_a]
```
The application maps tracked labels directly to human explanations.

---

## 4. Zero-Trust Independent Validator (`validator.py`)

A pure-Python function executed prior to candidate display:
```python
def validate_candidate_schedule(original, proposed, disruptions) -> ValidationResult:
    # 1. Event completeness check: all IDs present, no extra IDs
    # 2. Domain check: valid slots [0..16], valid room IDs
    # 3. Capacity check: room capacity >= attendance
    # 4. Equipment check: room has all required equipment tags
    # 5. Non-overlap check: intervals in same room disjoint
    # 6. Supervisor check: intervals for same supervisor disjoint
    # 7. Closure check: no event intersects room closure window
    # 8. Protection check: protected events match original slot and room exactly
```

---

## 5. Performance Benchmarks & Targets

- **Seeded MVP (4 Rooms, 6 Events):** Solve time $< 50\text{ ms}$.
- **Medium Department (15 Rooms, 50 Events):** Solve time $< 800\text{ ms}$.
- **LLM Semantic Parsing (Gemma 2 2B Q4_K_M):** Inference time $< 1.2\text{ s}$.
- **Memory Footprint:** $< 2.5\text{ GB}$ RAM (including loaded GGUF model).
