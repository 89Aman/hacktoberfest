# Campus Rescue — Documentation Index

Welcome to the comprehensive documentation suite for **Campus Rescue**, the neuro-symbolic campus schedule repair platform powered by Google Gemma and Z3 SMT constraint solving.

---

## Documentation Suite

1. **[Landing Page Specification](file:///c:/Users/shasa/Projects/Hacktoberfest-iitb/Hackathon/docs/LANDING_PAGE_SPEC.md)**
   - Complete page structure, hero section, interactive simulator preview.
   - Target audience value propositions for **Students**, **Faculty**, and **Super Admins**.
   - Technical comparison: Naive LLM vs. Campus Rescue.
   - UI component design tokens and responsive layout.

2. **[User Personas & Role-Based Workflows](file:///c:/Users/shasa/Projects/Hacktoberfest-iitb/Hackathon/docs/USER_PERSONAS_AND_ROLES.md)**
   - In-depth workflows for all three user types:
     - **Student:** Live room discovery, verified clash-free schedule, personalized calendar subscriptions.
     - **Faculty:** Natural-language delay reporting, protected exam flags, slot preference negotiation.
     - **Super Admin:** Emergency disruption console, constraint relaxation overrides, Z3 conflict core analysis, campus-wide broadcast.
   - Role-Based Access Control (RBAC) permission matrix.

3. **[System Architecture & Technical Specification](file:///c:/Users/shasa/Projects/Hacktoberfest-iitb/Hackathon/docs/SYSTEM_ARCHITECTURE.md)**
   - End-to-end technical pipeline: Natural language → Gemma AST → Z3 SMT solver → Independent validator → UI diff.
   - Formal mathematical formulation of hard constraints and lexicographic objectives.
   - Unsat core diagnostics for impossible disruptions.
   - API schema and data models.

---

## Core Product Thesis

Most campus software generates a static timetable at the start of a semester. **Campus Rescue fixes the day when unexpected reality hits**—without hallucinations, without double-bookings, and while changing the fewest possible events.
