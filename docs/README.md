# Campus Rescue — Documentation Index

**Campus Rescue:** Neuro-symbolic campus schedule repair and room request platform powered by Google Gemma 4 and Z3 SMT constraint solving.

---

## Documentation Index

### 1. Product & Architecture Core
- **[PRD.md](PRD.md)** — Product Requirements Document: Problem statement, unified booking + repair model, 2-hour auto-approval SLA, and functional requirements.
- **[TRD.md](TRD.md)** — Technical Requirements Document: Gemma 4 API / fallback integration, Z3 mathematical formulation, 30-minute standard grid, and testing specifications.
- **[SYSTEM_FLOW_AND_ARCHITECTURE.md](SYSTEM_FLOW_AND_ARCHITECTURE.md)** — Layered architecture, sequence diagrams, Finite State Machine, and failure fallback modes.
- **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** — SMT formulation details and independent zero-trust verification gate.

### 2. Database & Data Contracts
- **[SCHEMA_DB.md](SCHEMA_DB.md)** — Database Schema & SQL DDL: Relational ERD, `booking_requests`, `events`, `rooms`, `schedules`, and indexes.

### 3. User Experience & Flows
- **[APP_FLOW.md](APP_FLOW.md)** — Application Flow & Wireframes: 3-tab layout (`Request a Room`, `Live Schedule`, `Admin Console`), explanation card, and 2-hour SLA countdown.
- **[USER_PERSONAS_AND_ROLES.md](USER_PERSONAS_AND_ROLES.md)** — Role-Based Access Control (RBAC) matrix and persona workflows for Students, Faculty, and Super Admins.
- **[LANDING_PAGE_SPEC.md](LANDING_PAGE_SPEC.md)** — Complete landing page specification: Hero copy, interactive disruption simulator widget, and comparison matrix.
- **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)** — Exact 2-minute judging script with seeded SAT, 2-hour SLA auto-approval, and Unsat Core conflict scenarios.
