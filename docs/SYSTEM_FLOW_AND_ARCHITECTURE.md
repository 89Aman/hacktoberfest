# System Architecture & End-to-End System Flow — Campus Rescue

**Architecture Paradigm:** Neuro-Symbolic State Machine  
**Key Invariants:** Zero Hallucination, Lexicographic Minimal Disruption, Decoupled Zero-Trust Verification  

---

## 1. Layered System Architecture

```mermaid
graph TB
    subgraph PresentationLayer["Presentation Layer (Streamlit & Mobile View)"]
        UI_Admin["Super Admin Operations Console"]
        UI_Faculty["Faculty Delay Intake & Session Lock"]
        UI_Student["Student Live Schedule & iCal Feed"]
    end

    subgraph IngestionLayer["Ingestion & Semantic Translation Layer"]
        InputHandler["Input Normalizer & Disruption Handler"]
        GemmaAdapter["Gemma 4 Open-Weights LLM Adapter"]
        PydanticValidator["Pydantic Schema Guard (Discriminated Unions)"]
    end

    subgraph FormalLogicLayer["Formal Verification & SMT Optimization Layer"]
        ConstraintBuilder["Z3 Constraint Matrix Builder"]
        UnsatTracker["Z3 Solver with assert_and_track (Feasibility & MUC)"]
        LexicoOptimizer["Z3 Optimize (Lexicographic Delta Minimization)"]
    end

    subgraph ZeroTrustLayer["Zero-Trust Validation Gate"]
        PythonValidator["Independent Pure-Python Rule Checker"]
    end

    subgraph PersistenceLayer["State & Distribution Layer"]
        StateDB["Active & Versioned State Database"]
        ICalGenerator["RFC 5545 iCalendar (.ics) Generator"]
        WebhookDispatcher["Student Alert Webhook Dispatcher"]
    end

    UI_Admin --> InputHandler
    UI_Faculty --> InputHandler
    InputHandler --> GemmaAdapter
    GemmaAdapter --> PydanticValidator
    PydanticValidator --> ConstraintBuilder
    
    ConstraintBuilder --> UnsatTracker
    UnsatTracker -- "If SAT" --> LexicoOptimizer
    UnsatTracker -- "If UNSAT" --> UI_Admin
    
    LexicoOptimizer --> PythonValidator
    PythonValidator -- "100% Passed" --> UI_Admin
    PythonValidator -- "Check Failed" --> UI_Admin
    
    UI_Admin -- "Apply Repair" --> StateDB
    StateDB --> ICalGenerator
    StateDB --> WebhookDispatcher
    ICalGenerator --> UI_Student
```

---

## 2. End-to-End System Flows

### Flow 1: Natural Language Disruption to SMT Translation

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin / Faculty
    participant Adapter as Gemma Adapter (model_adapter.py)
    participant Parser as Pydantic Schema Guard (schemas.py)
    participant Engine as SMT Solver (solver.py)

    Admin->>Adapter: "Robotics Lab A has a water leak after 2 PM. Don't touch coding exam."
    Note over Adapter: Inject bounded system prompt with ID allowlists
    Adapter->>Adapter: Gemma Greedy Inference (temp=0.0)
    Adapter->>Parser: Raw JSON String
    alt Valid Schema
        Parser-->>Engine: DisruptionEnvelope(status='ready', operations=[...])
    else Schema Violation or Unknown ID
        Parser->>Adapter: Error feedback ("unknown room id")
        Adapter->>Admin: Clarification prompt / Structured manual fallback
    end
```

---

### Flow 2: SMT Constraint Execution & Lexicographic Optimization

```mermaid
sequenceDiagram
    autonumber
    participant Engine as Z3 Engine (solver.py)
    participant Validator as Zero-Trust Gate (validator.py)
    participant UI as Admin Diff Table (app.py)

    Note over Engine: Phase 1: Build Hard Assertions (Capacity, Equipment, Windows, Overlaps)
    Engine->>Engine: solver.check()
    alt Result == SAT (Feasible)
        Note over Engine: Phase 2: Lexicographic Multi-Objective Optimization
        Engine->>Engine: Minimize Sum(Changed_Events)
        Engine->>Engine: Minimize Sum(Displacement_Slots)
        Engine->>Validator: Raw candidate schedule
        Validator->>Validator: Execute 8 independent pure-Python checks
        alt Validation Passed
            Validator->>UI: Candidate verified (Highlight diff rows)
        else Validation Failed
            Validator->>UI: Alert: Internal engine fault (Never show corrupted plan)
        end
    else Result == UNSAT (Impossible)
        Engine->>Engine: solver.unsat_core()
        Engine->>UI: Return Minimal Conflicting Core & human explanation
    end
```

---

## 3. Finite State Machine (FSM) Lifecycle

The application schedule state transitions through strictly defined lifecycle stages:

```
┌────────────────────┐
│  BASELINE_LOADED   │  (Seeded verified day schedule active)
└─────────┬──────────┘
          │ User submits disruption
          ▼
┌────────────────────┐
│     PARSING        │  (Gemma extracting structured AST)
└─────────┬──────────┘
          │ Schema verified
          ▼
┌────────────────────┐
│     SOLVING        │  (Z3 feasibility check & optimization)
└─────────┬──────────┘
          ├──────────────────────────────────┐
          │ If SAT                           │ If UNSAT
          ▼                                  ▼
┌────────────────────┐             ┌─────────────────────┐
│  CANDIDATE_READY   │             │ INFEASIBLE_CONFLICT │
└─────────┬──────────┘             └──────────┬──────────┘
          │ Independent check passes          │ User relaxes rule
          ▼                                   └─────────┐
┌────────────────────┐                                  │
│  PENDING_APPROVAL  │                                  │
└─────────┬──────────┘                                  │
          ├─────────────────────┐                       │
          │ Click "Apply"       │ Click "Discard"       │
          ▼                     ▼                       ▼
┌────────────────────┐   ┌──────────────┐   ┌────────────────────┐
│   STATE_APPLIED    │   │ RESET_TO_SEED│<──┤  RE-SOLVE_ATTEMPT  │
└────────────────────┘   └──────────────┘   └────────────────────┘
```

---

## 4. Fault Tolerance & Fallback Protocols

1. **LLM Downtime / High Latency:**
   - If local Gemma inference takes $> 3$ seconds or fails to respond, the UI automatically activates the **Structured Preset Panel** without crashing.
2. **Deterministic Fallback Labeling:**
   - The UI displays an explicit badge: `Live Gemma Inference` or `Structured Mode Active`. The system never misrepresents preset fallback parsing as live model execution.
3. **Optimality Timeout:**
   - If Z3 optimization takes $> 2$ seconds, the solver halts and returns the best-known feasible candidate, labeling it *Satisfiable (Greedy)* rather than claiming mathematical optimality.
4. **State Isolation:**
   - Proposed repairs are computed strictly on isolated copies of memory. The baseline active timetable remains immutable until the coordinator explicitly presses **Apply Repair**.
