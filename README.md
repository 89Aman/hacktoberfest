# Campus Rescue — Neuro-Symbolic Campus Scheduling & Disruption Repair

[![Model](https://img.shields.io/badge/Model-Google_Gemma_4-4285F4?style=flat&logo=google)](https://ai.google.dev/gemma)
[![Solver](https://img.shields.io/badge/Solver-Z3_SMT_Engine-blue?style=flat)](https://github.com/Z3Prover/z3)
[![UI](https://img.shields.io/badge/Frontend-Streamlit-FF4B4B?style=flat&logo=streamlit)](https://streamlit.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Campus Rescue** allows students and faculty to request event rooms in natural language, uses Google Gemma 4 and the Z3 SMT solver to find and mathematically prove valid, collision-free allocations, and enables administrators to repair schedules when unexpected disruptions occur. If an administrator does not review a request within **2 hours**, the system automatically commits the optimal verified slot and alerts all affected parties.

---

## 🚀 Key Features

1. **Natural Language Room Requests:** Submit requests in conversational English (e.g., *"Need a room for 35 people for a 2-hour Robotics workshop with electronics kits"*). Gemma 4 extracts equipment, duration, and capacity constraints into structured JSON.
2. **Deterministic Mathematical Proof:** Z3 SMT solver guarantees room capacity, equipment availability, 30-minute slot boundaries, and zero double-bookings.
3. **"Why This Slot?" Explanation Cards:** Plain-language, truthful justifications generated from solver facts.
4. **2-Hour Auto-Approval SLA Daemon:** Automatic fallback assigns the verified optimal slot if an administrator does not act within 2 hours, preventing scheduling gridlocks.
5. **Minimal Disruption Emergency Repair:** When rooms close or attendance spikes, the engine lexicographically minimizes the number of displaced events and time drift.
6. **Unsat Core Conflict Diagnostics:** Zero hallucinations on impossible requests. Isolates the exact conflicting constraints and explains why permission to relax a rule is needed.

---

## 📐 System Architecture

```
User Request / Disruption
           │
           ▼
Google Gemma 4 (gemma-4-26b-a4b-it)
  └─ Semantic Compiler: Extracts Pydantic JSON AST
           │
           ▼
Z3 SMT Constraint Engine (z3-solver)
  ├─ SAT ──> Lexicographic Optimizer ──> Pure-Python Zero-Trust Gate ──> Streamlit UI Diff
  └─ UNSAT ─> Unsat Core Extractor ───> Conflict Explanation (No Hallucinations)
           │
           ▼
Admin Review Gate (2-Hour SLA Timer)
  ├─ Approved within 2h ──> Published
  └─ 2h Timeout Reached ──> Auto-Approved & Broadcast
```

---

## 🛠️ Quickstart & Setup

### Prerequisites
- Python 3.10+
- (Optional) Google GenAI API Key for Gemma 4 (or use built-in Structured Fallback Mode)

### 1. Clone & Set Up Virtual Environment
```bash
git clone https://github.com/89Aman/hacktoberfest.git
cd hacktoberfest
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy the template and supply your Google GenAI API key:
```bash
cp .env.example .env
```
*(If no API key is provided, the application runs seamlessly in **Structured Fallback Mode**).*

### 4. Run the Streamlit Application
```bash
streamlit run app.py
```

---

## 📖 Complete Documentation Index

All detailed specifications are located in the [`docs/`](docs/) directory:

- **[Product Requirements Document (PRD)](docs/PRD.md)** — Detailed problem statement, personas, functional requirements, and 2-hour SLA policy.
- **[Technical Requirements Document (TRD)](docs/TRD.md)** — Gemma 4 prompts, Z3 mathematical formulation, 30-minute time grid standard, and testing specifications.
- **[Database Schema (DB Schema)](docs/SCHEMA_DB.md)** — Relational ERD, SQL DDL tables (`booking_requests`, `events`, `rooms`, `schedules`), and indexes.
- **[Application Flow (App Flow)](docs/APP_FLOW.md)** — UX wireframes and user interaction flows across the 3 main application tabs.
- **[2-Minute Demo Script](docs/DEMO_SCRIPT.md)** — Rehearsed script for judging presentations with seeded SAT and UNSAT scenarios.
- **[System Architecture](docs/SYSTEM_ARCHITECTURE.md)** — End-to-end neuro-symbolic pipeline and sequence diagrams.
- **[User Personas & Roles](docs/USER_PERSONAS_AND_ROLES.md)** — RBAC matrix and workflows for Students, Faculty, and Super Admins.
- **[Landing Page Spec](docs/LANDING_PAGE_SPEC.md)** — Landing page copy, hero layout, and comparison matrix.

---

## ⚖️ License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
