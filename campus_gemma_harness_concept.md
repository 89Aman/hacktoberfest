# Project Concept Document: Gemma + Deterministic Harness for Campus Problems

**Document Type:** Technical Concept Note & Architecture Specification  
**Model Family:** Google Gemma 2 (2B / 9B) & Open-Weights Ecosystem  
**Target Domain:** Campus Logistics, Hard Combinatorial Coordination & Systems Engineering  
**Core Technical Differentiator:** Neuro-Symbolic Verification and Closed-Loop Dynamic Execution (Beyond "Vibe Coding" LLM Wrappers)

---

## 1. Executive Summary & Problem Formulation

Standard campus applications built with modern AI often suffer from the "vibe coder" trap: they are thin API wrappers around proprietary LLMs, producing probabilistic text summaries for simple FAQs or basic CRUD boards. However, the most acute problems on university campuses—such as **resource allocation, room and timetable clashes, lab equipment contention, and debugging low-level engineering assignments**—cannot be solved by text generation alone. They require **strict mathematical correctness, constraint satisfaction, and deterministic verification**.

This document specifies a project architecture where **Gemma acts as a semantic translation and compromise negotiation layer**, while a **custom deterministic harness enforces formal proofs, constraint solving, and sandboxed validation**.

---

## 2. Core Architectural Thesis: Beyond "Vibe Coding"

A standard LLM wrapper relies on the model to "hallucinate" an answer. In contrast, this architecture embeds Gemma inside a **verification-directed control loop**:

```
                       ┌──────────────────────────────┐
                       │   Messy Natural Language     │
                       │     (Campus Constraints)     │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │      Gemma 2 (Parser)        │
                       │ Translates to Formal AST/SMT │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │    Deterministic Harness     │
                       │   (Z3 SMT Solver / Sandbox)  │
                       └──────────────┬───────────────┘
                                      │
                      Satisfiable? ───┴─── Unsatisfiable?
                           │                      │
                           ▼                      ▼
                   ┌───────────────┐     ┌───────────────────┐
                   │ Valid Solution│     │ Minimal Conflict  │
                   │ (Mathematically│    │    Core (MUC)     │
                   │    Proven)    │     └────────┬──────────┘
                   └───────────────┘              │
                                                  ▼
                                         ┌───────────────────┐
                                         │ Gemma (Arbiter)   │
                                         │ Proposes Priority │
                                         │   Relaxations     │
                                         └───────────────────┘
```

1. **Semantic Ingestion:** Natural language constraints from students, professors, and administration are parsed into formal symbolic definitions by Gemma.
2. **Deterministic Verification:** The harness runs formal engines (SMT solvers, static analyzers, or compilers). Hallucinations are rejected mathematically.
3. **Automated Negotiation Loop:** When constraints conflict (UNSAT), the harness computes the exact conflicting core and prompts Gemma to negotiate an optimal compromise.

---

## 3. Flagship Concept: "Gemma-Z3" Neuro-Symbolic Campus Scheduler

### 3.1 The Problem
Hostel room allotment, elective scheduling, lab machinery bookings, and exam timetables involve dozens of hard constraints (room capacity, equipment requirements, professor availability, no overlapping core courses) and soft constraints (student timing preferences). Human coordinators take days to resolve clashes, and standard chatbots produce schedules riddled with overlapping slots.

### 3.2 System Architecture
* **Frontend/Interface:** Web or CLI intake collecting instructor and department constraints in raw text.
* **Gemma Semantic Compiler:**
  * Model: `gemma-2-9b-it` (or `gemma-2-2b-it` via GGUF/llama.cpp).
  * Task: Converts natural language rules into structured JSON AST representing variables, domains, and predicates.
* **The Z3 SMT Harness:**
  * Ingests the AST and builds formal integer arithmetic and boolean assertions in Z3 (`z3-solver` Python runtime).
  * Executes `solver.check()`.
* **The Conflict Arbiter Loop:**
  * If `sat`: The harness extracts `solver.model()` and formats the proven, collision-free schedule.
  * If `unsat`: The harness calls `solver.unsat_core()` to isolate the exact conflicting statements, feeds them to Gemma with priority rules, and prompts: *"Rule A (Prof. X morning slot) strictly clashes with Rule B (Lab 3 consecutive hours). Formulate an adjusted slot for Prof. X."*
  * The loop iterates until a proven solution is reached.

### 3.3 Concrete Verification Scenario
* **Input Request:**  
  *"Third-year CS has Operating Systems lab on Tuesday afternoon. Prof. Rao can only supervise between 2 PM and 5 PM. Room 102 has 40 seats. Batch A (35 students) and Batch B (38 students) must both take the lab on Tuesday, but they cannot attend together."*
* **Z3 Constraint Generated:**
  ```python
  from z3 import *
  s = Solver()
  start_A = Int('start_A')
  start_B = Int('start_B')
  duration = 3 # hours
  
  # Bounds
  s.add(start_A >= 14, start_A + duration <= 17)
  s.add(start_B >= 14, start_B + duration <= 17)
  
  # Disjoint time slots (cannot overlap)
  s.add(Or(start_A + duration <= start_B, start_B + duration <= start_A))
  
  print(s.check()) # Returns 'unsat' (6 hours cannot fit in a 3-hour window)
  ```
* **Harness Interception:** Z3 immediately detects `unsat`. Gemma receives the conflict and suggests a split schedule (e.g., shifting Batch B to Wednesday afternoon or extending supervisory hours), ensuring invalid schedules are never delivered to administration.

---

## 4. Alternative High-Impact Concept Specifications

### Concept B: "ASan-Gemma" Systems Engineering Lab Assistant
* **Problem:** Introductory CS and Systems students encounter cryptic runtime crashes (`SIGSEGV`, memory leaks, double-frees) in C/C++ assignments. Generic chatbots guess blind solutions without seeing machine memory.
* **The Harness:**
  * Wraps an isolated container running Clang with `-fsanitize=address,undefined -g`.
  * Runs the student's code against test inputs, intercepts crashes, and parses the AddressSanitizer shadow memory report and GDB stack frame.
* **Gemma Role:** Ingests the parsed memory trace and AST node, explains the root cause conceptually (e.g., pointing out a dangling pointer or uninitialized heap buffer), and asks Socratic guidance questions without revealing the homework solution.

### Concept C: "CampusMesh-Sentinel" Offline Emergency Triage Node
* **Problem:** Severe weather, network fiber cuts, or power outages knock out campus cloud infrastructure. Student hostels require coordination for medical help, water shortages, or generator rationing without internet access.
* **The Harness:**
  * Runs quantized `gemma-2-2b-it` (Q4_K_M GGUF) locally on an offline single-board computer or laptop (requiring < 1.8 GB RAM).
  * Serves an ad-hoc local Wi-Fi / Bluetooth peer-to-peer queue.
* **Gemma Role:** Ingests unstructured, fragmented student messages, deduplicates redundant reports, scores urgency, and synthesizes a priority action manifest for campus response teams with zero cloud connectivity.

---

## 5. Technical Stack & Hardware Specification

| Layer | Component | Specification |
| :--- | :--- | :--- |
| **Model** | Google Gemma 2 | `gemma-2-2b-it` (Edge/Low-spec) or `gemma-2-9b-it` (High precision) |
| **Inference Engine** | `llama.cpp` / `vLLM` / `Ollama` | Local GGUF execution; 4-bit to 8-bit quantization |
| **Harness Core** | Python 3.10+ | Custom deterministic state machine (`pydantic`, `asyncio`) |
| **Verification Engines**| `z3-solver` / AddressSanitizer | Formal logic proofs, SMT constraint solving, or Clang toolchains |
| **API & Delivery** | FastAPI / CLI | Lightweight endpoints serving validated outputs |

---

## 6. Implementation & Hackathon Milestone Roadmap

### Phase 1: Harness Scaffold & Formal Test Rig (Hours 0–12)
* Implement the baseline verification engine (e.g., Z3 solver wrapper or Clang sandbox runner).
* Define strict Pydantic schemas for the structured AST output expected from the LLM.
* Create unit tests demonstrating detection of unsatisfiable states and crashes.

### Phase 2: Gemma Prompting & AST Parser (Hours 12–24)
* Set up local Gemma inference (`llama.cpp` or Ollama).
* Design few-shot prompts instructing Gemma to output strict constraint JSON.
* Connect the output parser directly into the solver harness.

### Phase 3: Closed-Loop Arbiter & Recovery Loop (Hours 24–36)
* Wire the `UNSAT` core / crash trace feedback into Gemma's arbiter prompt.
* Implement automated iterative relaxation: verify that the system can resolve an unfeasible request within 2–3 refinement cycles.

### Phase 4: UI Prototype & Benchmark Demonstration (Hours 36–48)
* Build a clean interactive UI demonstrating real-time constraint compilation, mathematical verification, and compromise explanations.
* Prepare side-by-side benchmark comparisons showing standard LLM failure (hallucination) versus Gemma-Harness success (mathematical proof).

---

## 7. Evaluator & Hackathon Defense Strategy

When presenting this project to judges, professors, or evaluators:
1. **Highlight the Failure of Naive AI:** Live-demo an off-the-shelf chatbot failing an impossible scheduling problem by hallucinating a non-existent room or overlapping timeslot.
2. **Demonstrate Mathematical Guarantee:** Show the Z3 solver proving why the schedule is clash-free.
3. **Emphasize Local Capability:** Emphasize that Gemma 2 runs cost-effectively and privately on local or edge hardware, without external cloud dependence or data leaks.
