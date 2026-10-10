/**
 * CAMPUS RESCUE — CORE APPLICATION SCRIPT
 * Single-Page Reactive Engine (Frontend-only, zero dependencies)
 */

// Global Configuration
const GITHUB_REPO_URL = "https://github.com/campus-rescue/engine";

// Scenario Definitions
const SCENARIOS = {
  room_closure: {
    id: "room_closure",
    tabName: "Tab 1: Room Closure",
    inputPrompt: "Robotics Lab A has an AC water leak after 2 PM. Protect the Coding Assessment.",
    status: "feasible",
    proofId: "CR-8820-Z3",
    solveTimeMs: 42,
    clausesEvaluated: 1482,
    metrics: {
      movedCount: 1,
      displacedMin: 0,
      checksPassed: "8/8"
    },
    gemmaJson: {
      type: "close_room",
      room_id: "lab_a",
      start_slot: 1400,
      end_slot: 1700,
      reason: "ac_water_leak",
      protect_events: ["coding_assessment_cs101"]
    },
    smtPredicate: `(assert (not (exists ((r Room)) (and (= (room r) LabA) (>= (start_time r) 1400)))))\n(check-sat-using (then simplify solve-eqs smt)) => sat`,
    ledgerRows: [
      {
        course: "Robotics Workshop",
        code: "CS-480 · 32 Students",
        before: "Lab A (14:00–16:00)",
        after: "Maker Lab D (14:00–16:00)",
        status: "RELOCATED",
        statusType: "relocated",
        highlight: true
      },
      {
        course: "Coding Assessment",
        code: "CS-101 · 60 Students",
        before: "Lab B (14:00–15:30)",
        after: "Lab B (14:00–15:30)",
        status: "PROTECTED",
        statusType: "protected",
        highlight: false
      },
      {
        course: "Data Structures Lab",
        code: "CS-201 · 24 Students",
        before: "Seminar C (14:00–15:30)",
        after: "Seminar C (14:00–15:30)",
        status: "RETAINED",
        statusType: "retained",
        highlight: false
      }
    ],
    gridModifications: {
      closedRoom: "lab_a",
      closedTimeStart: "14:00",
      closedTimeEnd: "17:00",
      moves: [
        { course: "Robotics Workshop", fromRoom: "lab_a", toRoom: "maker_d", time: "14:00" }
      ],
      protected: ["lab_b_1400"]
    }
  },

  attendance_surge: {
    id: "attendance_surge",
    tabName: "Tab 2: Attendance Surge",
    inputPrompt: "CS-101 attendance surged to 85 students due to guest lecture. Move to Turing Hall.",
    status: "feasible",
    proofId: "CR-9104-Z3",
    solveTimeMs: 38,
    clausesEvaluated: 1620,
    metrics: {
      movedCount: 1,
      displacedMin: 0,
      checksPassed: "8/8"
    },
    gemmaJson: {
      type: "capacity_surge",
      event_id: "cs101_lecture",
      target_enrollment: 85,
      preferred_hall: "turing_hall_204",
      protect_events: ["math_seminar"]
    },
    smtPredicate: `(assert (>= (capacity (assigned_room cs101)) 85))\n(minimize (displacement_penalty)) => sat`,
    ledgerRows: [
      {
        course: "CS-101 Guest Lecture",
        code: "CS-101 · 85 Students (Surge)",
        before: "Lab B (10:00–12:00)",
        after: "Turing Hall 204 (10:00–12:00)",
        status: "RELOCATED",
        statusType: "relocated",
        highlight: true
      },
      {
        course: "Math Seminar",
        code: "MATH-302 · 28 Students",
        before: "Seminar C (10:00–11:30)",
        after: "Seminar C (10:00–11:30)",
        status: "PROTECTED",
        statusType: "protected",
        highlight: false
      },
      {
        course: "Robotics CAD Prep",
        code: "ME-210 · 30 Students",
        before: "Maker Lab D (10:00–12:00)",
        after: "Maker Lab D (10:00–12:00)",
        status: "RETAINED",
        statusType: "retained",
        highlight: false
      }
    ],
    gridModifications: {
      closedRoom: null,
      moves: [
        { course: "CS-101 Lecture", fromRoom: "lab_b", toRoom: "turing_204", time: "10:00" }
      ],
      protected: ["seminar_c_1000"]
    }
  },

  professor_delay: {
    id: "professor_delay",
    tabName: "Tab 3: Professor Delay",
    inputPrompt: "Prof. Sharma is delayed in traffic until 3:15 PM. Push CS-301 start time and protect ME-210.",
    status: "feasible",
    proofId: "CR-7741-Z3",
    solveTimeMs: 44,
    clausesEvaluated: 1390,
    metrics: {
      movedCount: 1,
      displacedMin: 75,
      checksPassed: "8/8"
    },
    gemmaJson: {
      type: "instructor_delay",
      instructor: "prof_sharma",
      earliest_start: 1515,
      affected_course: "cs301_algorithms",
      protect_events: ["me210_workshop"]
    },
    smtPredicate: `(assert (>= (start_time cs301) 1515))\n(assert (= (assigned_room me210) annex_b)) => sat`,
    ledgerRows: [
      {
        course: "CS-301: Algorithms",
        code: "CS-301 · 45 Students",
        before: "Lab A (14:00–15:30)",
        after: "Lab A (15:30–17:00)",
        status: "DELAYED",
        statusType: "relocated",
        highlight: true
      },
      {
        course: "ME-210: CAD Workshop",
        code: "ME-210 · 35 Students",
        before: "Maker Lab D (14:00–16:00)",
        after: "Maker Lab D (14:00–16:00)",
        status: "PROTECTED",
        statusType: "protected",
        highlight: false
      },
      {
        course: "Intro Python Lab",
        code: "CS-105 · 40 Students",
        before: "Lab B (15:00–16:30)",
        after: "Lab B (15:00–16:30)",
        status: "RETAINED",
        statusType: "retained",
        highlight: false
      }
    ],
    gridModifications: {
      closedRoom: null,
      moves: [
        { course: "CS-301 Algorithms", fromRoom: "lab_a", toRoom: "lab_a", time: "15:30" }
      ],
      protected: ["maker_d_1400"]
    }
  },

  impossible_request: {
    id: "impossible_request",
    tabName: "Tab 4: Impossible Request",
    inputPrompt: "Move Robotics Workshop (45 students) into Maker Lab D after 2 PM with zero split.",
    status: "infeasible",
    proofId: "CR-UNSAT-004",
    solveTimeMs: 14,
    clausesEvaluated: 1120,
    metrics: {
      movedCount: 0,
      displacedMin: 0,
      checksPassed: "UNSAT CORE"
    },
    gemmaJson: {
      type: "reassign_event",
      event: "robotics_workshop",
      attendees: 45,
      target_room: "maker_lab_d",
      allow_split: false
    },
    smtPredicate: `(assert (= (capacity maker_lab_d) 35))\n(assert (= (enrolled robotics) 45))\n(assert (<= (enrolled robotics) (capacity maker_lab_d))) => unsat`,
    explanation: "Cannot place 45 students in Maker Lab D — physical capacity is 35 seats",
    conflictChips: [
      "[ClassSize = 45]",
      "[RoomCap = 35]",
      "[NoSplitRule = TRUE]"
    ],
    relaxations: [
      {
        label: "Authorize 2-Section Split (23 + 22)",
        actionScenario: "attendance_surge"
      },
      {
        label: "Move to Turing Hall (Capacity 70)",
        actionScenario: "room_closure"
      }
    ]
  }
};

// Documentation Modal Database
const DOC_DOSSIERS = {
  prd: {
    id: "prd",
    title: "Product Requirement Document (PRD)",
    docId: "PRD-2025-V1 • 34pp",
    badge: "REGISTRAR SPECIFICATION",
    summary: `Campus Rescue is a mission-critical schedule repair system designed for academic institutions, research facilities, and multi-departmental campuses facing inevitable day-of logistical disruptions.`,
    sections: [
      {
        heading: "1. Core Problem & User Burden",
        content: "Traditional academic management tools operate on semester-long compilation cycles. When pipe bursts, faculty delays, or attendance surges occur, coordinators revert to unstructured WhatsApp threads, uncoordinated spreadsheet overwrites, and manual guesswork. This introduces catastrophic schedule collisions, locked-door walkouts, and student disorientation."
      },
      {
        heading: "2. The Minimum Perturbation Objective",
        content: "Unlike global recalculation engines that reschedule entire student cohorts, Campus Rescue solves for delta minimization: moving strictly the minimum number of affected courses while preserving all unaffected faculty and student bookings."
      },
      {
        heading: "3. User Personas & Permissions",
        content: "Enforces three distinct operational roles: Students (view-only live calendar sync and .ics export), Faculty (natural language delay injection and exam immutability locks), and Registrars (full root repair dispatch and constraint relaxation authority)."
      }
    ]
  },

  trd: {
    id: "trd",
    title: "Technical Reference Document (TRD)",
    docId: "TRD-SMT-ENG • Active",
    badge: "SMT & DETERMINISM",
    summary: `Comprehensive engineering specification detailing the formal decoupling of probabilistic language processing and discrete combinatorial theorem proving.`,
    sections: [
      {
        heading: "1. Neuro-Symbolic Architecture Separation",
        content: "Google Gemma 2 (2B-IT / 9B-IT) functions strictly as a bounded AST natural language parser. It translates colloquial dispatch messages into validated JSON schemas. Crucially, Gemma holds zero scheduling decision authority; discrete satisfiability is proven by the Z3 SMT solver."
      },
      {
        heading: "2. Z3 SMT-LIB2 Formulation",
        content: "The operational state is encoded into first-order quantifier-free bit-vectors and linear integer arithmetic. Clauses enforce non-overlap across temporal intervals, equipment inventory containment, and maximum seating capacities."
      },
      {
        heading: "3. Minimal Unsatisfiable Core (MUS) Extraction",
        content: "When an infeasible request is submitted, Z3 extracts the Boolean Unsatisfiable Core, pinpointing the exact conflicting constraints (e.g., student enrollment exceeding room fire code) and suggesting mathematical relaxations."
      }
    ]
  },

  architecture: {
    id: "architecture",
    title: "Neuro-Symbolic System Architecture",
    docId: "ARCH-HYBRID-Z3 • 48pp",
    badge: "PIPELINE TOPOLOGY",
    summary: `Five-stage deterministic execution pipeline running 100% on-premises without commercial cloud telemetry.`,
    sections: [
      {
        heading: "Stage 01: Unstructured Incident Ingestion",
        content: "Captures natural-language incident notifications from campus dispatchers, department chairs, or facilities staff via web console, SMS, or audio transcripts."
      },
      {
        heading: "Stage 02: Constrained Grammar Translation",
        content: "Locally hosted Gemma open-weight models apply logit masks and GBNF grammars to ensure the generated JSON strictly validates against Pydantic models."
      },
      {
        heading: "Stage 03: SMT Solver Core",
        content: "Z3 processes the synthesized assertions, executing Pareto-optimal branch-and-bound search to determine a bit-exact minimal displacement model."
      },
      {
        heading: "Stage 04: Pure-Python Validation Gate",
        content: "An independent, zero-trust deterministic Python module verifies the generated solution against eight physical invariants prior to broadcast."
      },
      {
        heading: "Stage 05: Verified Dispatch & iCalendar Sync",
        content: "Emits cryptographically signed RFC-5545 VCALENDAR feeds to Google Calendar, Apple Calendar, and Microsoft Outlook clients."
      }
    ]
  },

  schema: {
    id: "schema",
    title: "Relational DB & SMT Schema",
    docId: "DDL-POSTGRES-Z3 • 19pp",
    badge: "DATA SPECIFICATION",
    summary: `Database DDL schema and mathematical variable mapping for campus rooms, equipment, instructors, and enrollments.`,
    sections: [
      {
        heading: "1. Room & Facility Inventory",
        content: "Schema includes room_id (UUID), building_code (VARCHAR), max_capacity (INT), equipment_flags (BITMASK including GPU, soldering, AV, fume_hood), and ada_compliant (BOOLEAN)."
      },
      {
        heading: "2. Course Session & Constraint Ledger",
        content: "Maps course_id, section_id, instructor_id, enrollment_count, locked_flag (BOOLEAN), and timeslot_start/timeslot_end."
      },
      {
        heading: "3. SMT Predicate Formalism",
        content: "Formal clause representation: Assigned(c, r) => (c.enrollment <= r.capacity) AND (c.required_hardware subset_of r.inventory)."
      }
    ]
  },

  app_flow: {
    id: "app_flow",
    title: "Registrar Dispatch App Flow",
    docId: "UX-INCIDENT-FLOW • 14pp",
    badge: "INTERACTION DESIGN",
    summary: `Step-by-step operator journey during high-stress campus emergency timetable restructuring.`,
    sections: [
      {
        heading: "1. Triage & Incident Input",
        content: "Dispatcher inputs raw emergency notification. Real-time token parsing provides immediate feedback on detected clauses, affected rooms, and protected events."
      },
      {
        heading: "2. Feasibility Evaluation",
        content: "If feasible, the interface displays a ledger diff highlighting affected courses in gold, protected courses in green, and retained schedules in neutral tones."
      },
      {
        heading: "3. Confirmation & Rollout",
        content: "Super admin reviews displacement metrics, verifies zero double-bookings, and clicks 'Apply Repair' to update active databases and emit .ics pushes."
      }
    ]
  },

  personas: {
    id: "personas",
    title: "Campus Role Personas & Access Control",
    docId: "SEC-RBAC-MATRIX • 12pp",
    badge: "SECURITY & ACL",
    summary: `Role-based access control guidelines matching institutional organizational hierarchies.`,
    sections: [
      {
        heading: "1. Student (Level 0 - Read Only)",
        content: "Permitted to view active personal schedules, subscribe to live .ics feeds, and filter by building facilities. Cannot modify bookings or inject delays."
      },
      {
        heading: "2. Faculty & Mentor (Level 1 - Protected Mutability)",
        content: "Authorized to declare delays for their own assigned sessions and lock examinations as immutable. Cannot reassign other faculty members' classrooms."
      },
      {
        heading: "3. Super Admin & Registrar (Level 2 - Root Ledger)",
        content: "Complete authority to close buildings, execute SMT repair computations, approve cross-departmental relocations, and relax soft constraints."
      }
    ]
  }
};

// Initial Day Grid State
const INITIAL_GRID_EVENTS = [
  { id: "e1", course: "Robotics Workshop", room: "lab_a", time: "14:00", duration: 2, status: "normal" },
  { id: "e2", course: "Coding Assessment", room: "lab_b", time: "14:00", duration: 1.5, status: "locked" },
  { id: "e3", course: "Data Structures", room: "seminar_c", time: "14:00", duration: 1.5, status: "normal" },
  { id: "e4", course: "CAD Modeling", room: "maker_d", time: "09:30", duration: 2, status: "normal" },
  { id: "e5", course: "Embedded Systems", room: "lab_a", time: "10:00", duration: 2, status: "normal" },
  { id: "e6", course: "Network Security", room: "lab_b", time: "10:00", duration: 2, status: "normal" },
  { id: "e7", course: "Algorithm Viva", room: "seminar_c", time: "11:30", duration: 1.5, status: "normal" }
];

let currentGridState = JSON.parse(JSON.stringify(INITIAL_GRID_EVENTS));
let activeScenarioId = "room_closure";
let isGridRepaired = false;

// 8 Validator Checks Checklist
const VALIDATOR_CHECKS = [
  "No room double-bookings detected",
  "Room capacity strictly accommodates enrollment",
  "Hardware & equipment parity guaranteed (GPU/Power)",
  "No instructor overlapping supervisory commitments",
  "Protected & locked examinations remain unmoved",
  "ADA step-free accessibility verified",
  "Transit walking time between consecutive classes < 10min",
  "Pareto minimal-change objective mathematically optimal"
];

// Document Ready Initialization
document.addEventListener("DOMContentLoaded", () => {
  initNavbarScrollSpy();
  initStoryThread();
  initSimulator();
  initHowItWorksAccordion();
  initMetricCounters();
  initDocsModal();
  initQuickStartCopy();
  initHeroSandbox();
  initRolePicker();
});

/* ==========================================================================
   1. NAVBAR & SCROLL-SPY BEHAVIOR
   ========================================================================== */

function initNavbarScrollSpy() {
  const navbar = document.getElementById("site-navbar");
  const progressBar = document.getElementById("navbar-progress");
  const navHighlighter = document.getElementById("nav-highlighter");
  const navLinks = document.querySelectorAll(".nav-link");
  const navCtaBtn = document.getElementById("nav-cta-btn");
  const navStampNodes = document.querySelectorAll(".nav-stamp-node");

  // Section IDs in strict order
  const sectionIds = ["hero", "problem", "features", "how-it-works", "simulator", "why-us", "docs", "final-cta", "footer"];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  // Button label mappings per section
  const ctaConfigs = {
    hero: { label: "Simulate a Disruption", target: "#simulator", isRun: false },
    problem: { label: "Simulate a Disruption", target: "#simulator", isRun: false },
    features: { label: "Pick Your Role", target: "#final-cta", isRun: false },
    "how-it-works": { label: "See the Simulator", target: "#simulator", isRun: false },
    simulator: { label: "Run the Demo", target: null, isRun: true },
    "why-us": { label: "Read the Docs", target: "#docs", isRun: false },
    docs: { label: "Launch Demo", target: "#final-cta", isRun: false },
    "final-cta": { label: "Simulate Disruption", target: "#simulator", isRun: false },
    footer: { label: "Back to Top", target: "#hero", isRun: false }
  };

  // Stamp index mapping: Problem=1, Features=2, How It Works=3, Simulator=4, Why Us=5
  const stampSectionMap = {
    problem: 1,
    features: 2,
    "how-it-works": 3,
    simulator: 4,
    "why-us": 5,
    docs: 5,
    "final-cta": 5,
    footer: 5
  };

  let isTicking = false;

  function updateNavbar() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;

    // Progress bar width
    if (progressBar) {
      progressBar.style.width = `${scrollPercent}%`;
    }

    // Navbar height and styling state
    if (scrollY > 40) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    // Footer inversion check
    const footerElem = document.getElementById("footer");
    if (footerElem) {
      const footerRect = footerElem.getBoundingClientRect();
      if (footerRect.top <= 80) {
        navbar.classList.add("inverted");
      } else {
        navbar.classList.remove("inverted");
      }
    }

    isTicking = false;
  }

  window.addEventListener("scroll", () => {
    if (!isTicking) {
      window.requestAnimationFrame(updateNavbar);
      isTicking = true;
    }
  }, { passive: true });

  // Initial update
  updateNavbar();

  // IntersectionObserver for active section tracking
  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0
  };

  let currentActiveSectionId = "hero";

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        currentActiveSectionId = entry.target.id;
        applySectionState(currentActiveSectionId);
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  function applySectionState(sectionId) {
    // 1. Update active nav link & sliding gold highlighter
    let activeLink = null;
    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (href === `#${sectionId}`) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
        activeLink = link;
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });

    if (activeLink && navHighlighter && window.scrollY > 40) {
      const linkRect = activeLink.getBoundingClientRect();
      const parentRect = activeLink.parentElement.parentElement.getBoundingClientRect();
      navHighlighter.style.width = `${linkRect.width}px`;
      navHighlighter.style.left = `${activeLink.offsetLeft}px`;
      navHighlighter.style.opacity = "1";
    } else if (navHighlighter) {
      navHighlighter.style.opacity = "0";
    }

    // 2. Update Navbar CTA Button Label & Behavior
    const config = ctaConfigs[sectionId] || ctaConfigs.hero;
    if (navCtaBtn) {
      const labelSpan = navCtaBtn.querySelector(".btn-label-text");
      if (labelSpan) labelSpan.textContent = config.label;

      navCtaBtn.onclick = (e) => {
        if (config.isRun) {
          e.preventDefault();
          const runBtn = document.getElementById("run-solver-btn");
          if (runBtn) {
            runBtn.scrollIntoView({ behavior: "smooth", block: "center" });
            runBtn.click();
          }
        } else if (config.target) {
          e.preventDefault();
          const targetElem = document.querySelector(config.target);
          if (targetElem) {
            targetElem.scrollIntoView({ behavior: "smooth" });
          }
        }
      };
    }

    // 3. Update 5 Story Stamps in Navbar
    const currentStampStep = stampSectionMap[sectionId] || 0;
    navStampNodes.forEach((node, idx) => {
      const stepNum = idx + 1;
      node.classList.remove("passed", "active", "upcoming");
      if (stepNum < currentStampStep) {
        node.classList.add("passed");
        node.textContent = "✓";
      } else if (stepNum === currentStampStep) {
        node.classList.add("active");
        node.textContent = stepNum;
      } else {
        node.classList.add("upcoming");
        node.textContent = stepNum;
      }
    });

    // 4. Update Left-Margin Story Thread Nodes
    updateStoryThreadActive(sectionId);
  }

  // Smooth-scroll click handlers on nav links
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Stamp click in navbar smooth-scrolls to mapped section
  const stampNavTargets = ["#problem", "#features", "#how-it-works", "#simulator", "#why-us"];
  navStampNodes.forEach((node, idx) => {
    node.addEventListener("click", () => {
      const target = document.querySelector(stampNavTargets[idx]);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Logo smooth scroll to top
  const brandLogos = document.querySelectorAll(".brand-logo-scroll-top");
  brandLogos.forEach(logo => {
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* ==========================================================================
   2. STORY THREAD ALONG LEFT MARGIN
   ========================================================================== */

function initStoryThread() {
  const threadProgress = document.getElementById("story-thread-progress");
  const threadNodes = document.querySelectorAll(".story-thread-node");

  window.addEventListener("scroll", () => {
    if (!threadProgress) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    threadProgress.style.height = `${pct}%`;
  }, { passive: true });

  threadNodes.forEach(node => {
    node.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSelector = node.getAttribute("href");
      const target = document.querySelector(targetSelector);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function updateStoryThreadActive(sectionId) {
  const threadNodes = document.querySelectorAll(".story-thread-node");
  const order = ["problem", "features", "how-it-works", "simulator", "why-us", "docs", "final-cta"];
  const currentIdx = order.indexOf(sectionId);

  threadNodes.forEach((node, idx) => {
    node.classList.remove("passed", "active", "upcoming");
    if (currentIdx !== -1) {
      if (idx < currentIdx) {
        node.classList.add("passed");
      } else if (idx === currentIdx) {
        node.classList.add("active");
      } else {
        node.classList.add("upcoming");
      }
    } else {
      node.classList.add("upcoming");
    }
  });
}

/* ==========================================================================
   3. INTERACTIVE SIMULATOR (SECTION 04)
   ========================================================================== */

function initSimulator() {
  const tabs = document.querySelectorAll(".sim-tab-btn");
  const incidentInput = document.getElementById("sim-incident-input");
  const runBtn = document.getElementById("run-solver-btn");
  const loadingOverlay = document.getElementById("solver-loading-overlay");
  const feasibleResultBox = document.getElementById("sim-result-feasible");
  const infeasibleResultBox = document.getElementById("sim-result-infeasible");
  const clarificationBox = document.getElementById("sim-result-clarification");
  const applyRepairBtn = document.getElementById("apply-repair-btn");
  const discardRepairBtn = document.getElementById("discard-repair-btn");
  const resetGridBtn = document.getElementById("reset-grid-btn");
  const downloadIcsBtn = document.getElementById("download-ics-btn");

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const scenarioId = tab.dataset.scenario;
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeScenarioId = scenarioId;

      const scenario = SCENARIOS[scenarioId];
      if (scenario && incidentInput) {
        incidentInput.value = scenario.inputPrompt;
      }
    });
  });

  // Run Solver Action
  if (runBtn) {
    runBtn.addEventListener("click", () => {
      runSolverSimulation();
    });
  }

  function runSolverSimulation(forcedScenarioId = null) {
    let scenarioKey = forcedScenarioId || activeScenarioId;

    // Keyword detection for free-typed text
    const text = (incidentInput ? incidentInput.value : "").toLowerCase().trim();
    if (!forcedScenarioId) {
      if (text.includes("closed") || text.includes("leak") || text.includes("water") || text.includes("flood") || text.includes("ac")) {
        scenarioKey = "room_closure";
      } else if (text.includes("surge") || text.includes("students") || text.includes("attendance") || text.includes("85")) {
        scenarioKey = "attendance_surge";
      } else if (text.includes("delay") || text.includes("traffic") || text.includes("late") || text.includes("sharma") || text.includes("after 3")) {
        scenarioKey = "professor_delay";
      } else if (text.includes("impossible") || text.includes("45") || text.includes("no split") || text.includes("maker lab d")) {
        scenarioKey = "impossible_request";
      } else if (text.length > 5 && !SCENARIOS[scenarioKey]) {
        scenarioKey = "needs_clarification";
      }
    }

    // Play staged loading animation
    if (loadingOverlay) {
      loadingOverlay.classList.add("active");
      if (feasibleResultBox) feasibleResultBox.style.display = "none";
      if (infeasibleResultBox) infeasibleResultBox.style.display = "none";
      if (clarificationBox) clarificationBox.style.display = "none";

      const step1 = document.getElementById("stage-step-1");
      const step2 = document.getElementById("stage-step-2");
      const step3 = document.getElementById("stage-step-3");

      if (step1) { step1.className = "staged-step-item current"; }
      if (step2) { step2.className = "staged-step-item"; }
      if (step3) { step3.className = "staged-step-item"; }

      setTimeout(() => {
        if (step1) step1.className = "staged-step-item done";
        if (step2) step2.className = "staged-step-item current";
      }, 450);

      setTimeout(() => {
        if (step2) step2.className = "staged-step-item done";
        if (step3) step3.className = "staged-step-item current";
      }, 950);

      setTimeout(() => {
        if (step3) step3.className = "staged-step-item done";
        loadingOverlay.classList.remove("active");
        renderSolverResults(scenarioKey);
      }, 1400);
    } else {
      renderSolverResults(scenarioKey);
    }
  }

  function renderSolverResults(scenarioKey) {
    if (scenarioKey === "needs_clarification") {
      if (feasibleResultBox) feasibleResultBox.style.display = "none";
      if (infeasibleResultBox) infeasibleResultBox.style.display = "none";
      if (clarificationBox) clarificationBox.style.display = "block";
      return;
    }

    const scenario = SCENARIOS[scenarioKey] || SCENARIOS.room_closure;
    activeScenarioId = scenario.id;

    if (scenario.status === "infeasible") {
      if (feasibleResultBox) feasibleResultBox.style.display = "none";
      if (clarificationBox) clarificationBox.style.display = "none";
      if (infeasibleResultBox) {
        infeasibleResultBox.style.display = "block";
        infeasibleResultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } else {
      if (infeasibleResultBox) infeasibleResultBox.style.display = "none";
      if (clarificationBox) clarificationBox.style.display = "none";
      if (feasibleResultBox) {
        feasibleResultBox.style.display = "block";
        populateFeasibleResult(scenario);
      }
    }
  }

  function populateFeasibleResult(scenario) {
    // 1. Parsed JSON Box
    const jsonPre = document.getElementById("sim-gemma-json");
    if (jsonPre) {
      jsonPre.textContent = JSON.stringify(scenario.gemmaJson, null, 2);
    }

    // 2. Metrics
    const movedEl = document.getElementById("sim-metric-moved");
    const displEl = document.getElementById("sim-metric-displaced");
    const checksEl = document.getElementById("sim-metric-checks");
    const timeEl = document.getElementById("sim-metric-time");
    if (movedEl) movedEl.textContent = `${scenario.metrics.movedCount} event moved`;
    if (displEl) displEl.textContent = `${scenario.metrics.displacedMin} min displaced`;
    if (checksEl) checksEl.textContent = `${scenario.metrics.checksPassed} checks`;
    if (timeEl) timeEl.textContent = `solved in ${scenario.solveTimeMs}ms`;

    // 3. Diff Ledger Table Rows
    const tbody = document.getElementById("sim-ledger-tbody");
    if (tbody) {
      tbody.innerHTML = scenario.ledgerRows.map(row => `
        <tr class="${row.highlight ? 'bg-[#FFE79A]/20' : ''}">
          <td style="padding: 10px; border-right: 1px solid rgba(31,42,68,0.2); font-weight: 700;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="material-symbols-outlined text-[16px] ${row.statusType === 'relocated' ? 'text-[#785900]' : row.statusType === 'protected' ? 'text-[#5E8C61]' : 'text-[#6B6A63]'}">
                ${row.statusType === 'relocated' ? 'swap_horiz' : row.statusType === 'protected' ? 'lock' : 'keep'}
              </span>
              <span>${row.course}</span>
            </div>
            <span style="font-size:11px; font-weight:400; color:#6B6A63; display:block;">${row.code}</span>
          </td>
          <td style="padding: 10px; border-right: 1px solid rgba(31,42,68,0.2); ${row.statusType === 'relocated' ? 'text-decoration: line-through; color:#C8553D;' : ''}">
            ${row.before}
          </td>
          <td style="padding: 10px; border-right: 1px solid rgba(31,42,68,0.2); ${row.statusType === 'relocated' ? 'background: rgba(233,185,73,0.3); font-weight:700;' : ''}">
            ${row.after}
          </td>
          <td style="padding: 10px; text-align: center;">
            <span class="rubber-stamp ${row.statusType === 'relocated' ? 'stamp-relocated' : row.statusType === 'protected' ? 'stamp-protected' : 'stamp-retained'}">
              ${row.status}
            </span>
          </td>
        </tr>
      `).join("");
    }

    // 4. Staggered ticking green for 8 validator checks
    const checksContainer = document.getElementById("sim-validator-checks");
    if (checksContainer) {
      checksContainer.innerHTML = VALIDATOR_CHECKS.map((check, idx) => `
        <div class="validator-check-item" id="val-check-${idx}">
          <span class="material-symbols-outlined text-[14px]">check_circle</span>
          <span>${check}</span>
        </div>
      `).join("");

      VALIDATOR_CHECKS.forEach((_, idx) => {
        setTimeout(() => {
          const item = document.getElementById(`val-check-${idx}`);
          if (item) item.classList.add("passed");
        }, (idx + 1) * 80);
      });
    }

    // 5. Thump verified stamp
    const stampEl = document.getElementById("sim-verified-stamp");
    if (stampEl) {
      stampEl.classList.remove("stamp-thump-anim");
      void stampEl.offsetWidth; // Trigger reflow
      stampEl.classList.add("stamp-thump-anim");
    }
  }

  // Clickable relaxation suggestions in Impossible Request
  const relaxBtn1 = document.getElementById("relax-btn-split");
  const relaxBtn2 = document.getElementById("relax-btn-turing");
  if (relaxBtn1) {
    relaxBtn1.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      const tab2 = document.querySelector('[data-scenario="attendance_surge"]');
      if (tab2) tab2.classList.add("active");
      if (incidentInput) incidentInput.value = "Authorize 2-Section split (23 + 22 students) for Robotics Workshop in Maker Lab D and Seminar C.";
      runSolverSimulation("attendance_surge");
    });
  }
  if (relaxBtn2) {
    relaxBtn2.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      const tab1 = document.querySelector('[data-scenario="room_closure"]');
      if (tab1) tab1.classList.add("active");
      if (incidentInput) incidentInput.value = "Move Robotics Workshop (45 students) into Turing Hall 204 (Capacity 70 seats).";
      runSolverSimulation("room_closure");
    });
  }

  // Clarification quick buttons
  document.querySelectorAll(".clarify-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;
      if (choice) {
        tabs.forEach(t => t.classList.remove("active"));
        const targetTab = document.querySelector(`[data-scenario="${choice}"]`);
        if (targetTab) targetTab.classList.add("active");
        if (incidentInput && SCENARIOS[choice]) incidentInput.value = SCENARIOS[choice].inputPrompt;
        runSolverSimulation(choice);
      }
    });
  });

  // Grid Controls
  if (applyRepairBtn) {
    applyRepairBtn.addEventListener("click", () => {
      applyGridRepair();
    });
  }
  if (discardRepairBtn) {
    discardRepairBtn.addEventListener("click", () => {
      resetGrid();
    });
  }
  if (resetGridBtn) {
    resetGridBtn.addEventListener("click", () => {
      resetGrid();
    });
  }
  if (downloadIcsBtn) {
    downloadIcsBtn.addEventListener("click", () => {
      downloadIcsCalendar();
    });
  }

  // Render initial grid
  renderScheduleGrid();
}

/* ==========================================================================
   4. SCHEDULE GRID MATRIX (4 ROOMS x 16 SLOTS)
   ========================================================================== */

function renderScheduleGrid() {
  const gridContainer = document.getElementById("schedule-grid-container");
  if (!gridContainer) return;

  const rooms = [
    { id: "lab_a", name: "Robotics Lab A", cap: "Cap 40 · GPU" },
    { id: "lab_b", name: "Science Lab B", cap: "Cap 60 · AV Tier 2" },
    { id: "maker_d", name: "Maker Lab D", cap: "Cap 35 · 3D Fab" },
    { id: "seminar_c", name: "Seminar Room C", cap: "Cap 30 · Projection" }
  ];

  // 16 30-min slots: 09:00 to 16:30
  const slots = [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30"
  ];

  let html = `
    <table class="schedule-grid-table">
      <thead>
        <tr>
          <th class="room-col-header">Facility / Room</th>
          ${slots.map(s => `<th>${s}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
  `;

  rooms.forEach(room => {
    html += `<tr><td class="room-col-header">${room.name}<br><span style="font-size:9px; color:#6B6A63; font-weight:normal;">${room.cap}</span></td>`;

    slots.forEach(slot => {
      const isLabAClosed = isGridRepaired && room.id === "lab_a" && (slot >= "14:00" && slot <= "16:30");
      if (isLabAClosed) {
        html += `<td class="slot-hatched-closed" title="CLOSED - WATER LEAK">CLOSED</td>`;
        return;
      }

      // Check matching event
      const event = currentGridState.find(e => e.room === room.id && e.time === slot);
      if (event) {
        let eventClass = "event-normal";
        if (event.status === "moved") eventClass = "event-moved";
        else if (event.status === "locked") eventClass = "event-protected";
        else if (event.status === "retained") eventClass = "event-retained";

        html += `
          <td>
            <div class="slot-event ${eventClass}" title="${event.course}">
              <span>${event.course.split(" ")[0]}</span>
              ${event.status === "locked" ? '<span class="material-symbols-outlined text-[11px]">lock</span>' : ''}
              ${event.status === "moved" ? '<span class="material-symbols-outlined text-[11px]">swap_horiz</span>' : ''}
            </div>
          </td>
        `;
      } else {
        html += `<td style="color:#6B6A63; opacity:0.3;">·</td>`;
      }
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;
  gridContainer.innerHTML = html;
}

function applyGridRepair() {
  isGridRepaired = true;
  // Update state for default repair scenario: Robotics Workshop moved from Lab A to Maker Lab D at 14:00
  currentGridState = currentGridState.map(event => {
    if (event.course === "Robotics Workshop") {
      return { ...event, room: "maker_d", time: "14:00", status: "moved" };
    }
    if (event.course === "Coding Assessment") {
      return { ...event, status: "locked" };
    }
    return event;
  });

  renderScheduleGrid();

  // Visual toast feedback
  const toast = document.getElementById("grid-status-toast");
  if (toast) {
    toast.textContent = "✓ SMT Schedule Repair Applied to Active Grid";
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
  }
}

function resetGrid() {
  isGridRepaired = false;
  currentGridState = JSON.parse(JSON.stringify(INITIAL_GRID_EVENTS));
  renderScheduleGrid();

  const toast = document.getElementById("grid-status-toast");
  if (toast) {
    toast.textContent = "Original Schedule Restored";
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 2500);
  }
}

/* ==========================================================================
   5. DOWNLOAD RFC-5545 .ICS CALENDAR
   ========================================================================== */

function downloadIcsCalendar() {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  
  let icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Campus Rescue//Academic Atelier Schedule Repair Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Campus Rescue Repaired Timetable",
    "X-WR-TIMEZONE:America/New_York"
  ];

  currentGridState.forEach((ev, i) => {
    const roomName = ev.room === "maker_d" ? "Maker Lab D" : ev.room === "lab_a" ? "Robotics Lab A" : ev.room === "lab_b" ? "Science Lab B" : "Seminar Room C";
    const statusNote = ev.status === "moved" ? "[RELOCATED VIA Z3 SOLVER]" : ev.status === "locked" ? "[PROTECTED SESSION]" : "[CONFIRMED]";
    
    // Create RFC timestamps
    const [hh, mm] = ev.time.split(":");
    const startStr = `20251010T${hh}${mm}00`;
    const endH = parseInt(hh, 10) + Math.floor(ev.duration);
    const endM = (parseInt(mm, 10) + ((ev.duration % 1) * 60)) % 60;
    const endStr = `20251010T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:campus-rescue-${ev.id}-${i}@academic.atelier`);
    icsLines.push(`DTSTAMP:${now}`);
    icsLines.push(`DTSTART:${startStr}`);
    icsLines.push(`DTEND:${endStr}`);
    icsLines.push(`SUMMARY:${ev.course} ${statusNote}`);
    icsLines.push(`LOCATION:${roomName}`);
    icsLines.push(`DESCRIPTION:Mathematically verified timetable entry repaired with zero double-bookings via Z3 Theorem Prover.`);
    icsLines.push("STATUS:CONFIRMED");
    icsLines.push("END:VEVENT");
  });

  icsLines.push("END:VCALENDAR");

  const icsBlob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(icsBlob);
  const tempLink = document.createElement("a");
  tempLink.href = downloadUrl;
  tempLink.setAttribute("download", "campus_rescue_schedule.ics");
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(downloadUrl);
}

/* ==========================================================================
   6. HOW IT WORKS 5-TILE ACCORDION EXPANSION
   ========================================================================== */

function initHowItWorksAccordion() {
  const tiles = document.querySelectorAll(".pipeline-tile");
  tiles.forEach(tile => {
    tile.addEventListener("click", () => {
      const isAlreadyActive = tile.classList.contains("active-tile");
      tiles.forEach(t => t.classList.remove("active-tile"));
      if (!isAlreadyActive) {
        tile.classList.add("active-tile");
      }
    });
  });
}

/* ==========================================================================
   7. METRIC COUNT-UP ANIMATION (WHY US SECTION)
   ========================================================================== */

function initMetricCounters() {
  const metricCards = document.querySelectorAll(".metric-counter-card");
  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        animateAllCounters();
      }
    });
  }, { threshold: 0.3 });

  metricCards.forEach(card => observer.observe(card));

  function animateAllCounters() {
    animateValue("metric-counter-1", 0, 100, 1200, "%");
    animateValue("metric-counter-2", 0, 500, 1400, " ms", "< ");
    animateValue("metric-counter-3", 0, 85, 1200, "%");
  }

  function animateValue(id, start, end, duration, suffix = "", prefix = "") {
    const el = document.getElementById(id);
    if (!el) return;
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      const current = Math.floor(easeProgress * (end - start) + start);
      el.textContent = `${prefix}${current}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = `${prefix}${end}${suffix}`;
      }
    };
    window.requestAnimationFrame(step);
  }
}

/* ==========================================================================
   8. DOCUMENTATION MODAL
   ========================================================================== */

function initDocsModal() {
  const backdrop = document.getElementById("doc-modal-backdrop");
  const titleEl = document.getElementById("doc-modal-title");
  const docIdEl = document.getElementById("doc-modal-docid");
  const badgeEl = document.getElementById("doc-modal-badge");
  const summaryEl = document.getElementById("doc-modal-summary");
  const contentEl = document.getElementById("doc-modal-content");
  const closeBtn = document.getElementById("doc-modal-close-btn");

  // Open modal handlers
  document.querySelectorAll("[data-doc-trigger]").forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const docKey = trigger.dataset.docTrigger;
      openDocModal(docKey);
    });
  });

  function openDocModal(docKey) {
    const dossier = DOC_DOSSIERS[docKey] || DOC_DOSSIERS.prd;
    if (titleEl) titleEl.textContent = dossier.title;
    if (docIdEl) docIdEl.textContent = dossier.docId;
    if (badgeEl) badgeEl.textContent = dossier.badge;
    if (summaryEl) summaryEl.textContent = dossier.summary;

    if (contentEl) {
      contentEl.innerHTML = dossier.sections.map(sec => `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: #1F2A44; margin-bottom: 0.4rem;">
            ${sec.heading}
          </h4>
          <p style="font-family: var(--font-sans); font-size: 14px; color: #434751; line-height: 1.6;">
            ${sec.content}
          </p>
        </div>
      `).join("");
    }

    if (backdrop) {
      backdrop.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  function closeDocModal() {
    if (backdrop) {
      backdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  if (closeBtn) closeBtn.addEventListener("click", closeDocModal);
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeDocModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop && backdrop.classList.contains("open")) {
      closeDocModal();
    }
  });
}

/* ==========================================================================
   9. QUICK-START CODE COPY & GITHUB BUTTON
   ========================================================================== */

function initQuickStartCopy() {
  const copyBtn = document.getElementById("quickstart-copy-btn");
  const codeEl = document.getElementById("quickstart-code-content");
  const githubBtns = document.querySelectorAll(".github-repo-link");

  if (copyBtn && codeEl) {
    copyBtn.addEventListener("click", async () => {
      const codeText = codeEl.innerText;
      try {
        await navigator.clipboard.writeText(codeText);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span class="material-symbols-outlined text-[14px]">check</span><span>Copied!</span>`;
        copyBtn.style.background = "#5E8C61";
        copyBtn.style.color = "#FFFFFF";

        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
          copyBtn.style.background = "";
          copyBtn.style.color = "";
        }, 2000);
      } catch {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = codeText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    });
  }

  githubBtns.forEach(btn => {
    btn.setAttribute("href", GITHUB_REPO_URL);
    btn.setAttribute("target", "_blank");
    btn.setAttribute("rel", "noopener noreferrer");
  });
}

/* ==========================================================================
   10. HERO SANDBOX LIVE REPLAY
   ========================================================================== */

function initHeroSandbox() {
  const heroCard = document.getElementById("hero-sandbox-card");
  const runHeroBtn = document.getElementById("hero-sandbox-run-btn");
  let autoPlayed = false;

  function runHeroSandboxAnimation() {
    const pulseEl = document.getElementById("hero-sandbox-pulse");
    const relocatedEl = document.getElementById("hero-sandbox-relocated");
    if (pulseEl) pulseEl.textContent = "SOLVING...";
    if (relocatedEl) relocatedEl.style.opacity = "0.5";

    setTimeout(() => {
      if (pulseEl) pulseEl.textContent = "SATISFIED";
      if (relocatedEl) {
        relocatedEl.style.opacity = "1";
        relocatedEl.classList.add("stamp-thump-anim");
      }
    }, 600);
  }

  if (runHeroBtn) {
    runHeroBtn.addEventListener("click", () => {
      runHeroSandboxAnimation();
    });
  }

  if (heroCard) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !autoPlayed) {
          autoPlayed = true;
          setTimeout(runHeroSandboxAnimation, 500);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(heroCard);
  }
}

/* ==========================================================================
   11. ROLE PICKER & CROSS-SECTION LINKING
   ========================================================================== */

function initRolePicker() {
  const roleCards = document.querySelectorAll(".final-cta-role-card");
  const triggerRoleBtns = document.querySelectorAll("[data-pick-role]");
  const startDemoBtn = document.getElementById("final-cta-start-demo");

  function selectRole(roleKey) {
    roleCards.forEach(card => {
      if (card.dataset.role === roleKey) {
        card.style.borderColor = "var(--color-blueprint)";
        card.style.boxShadow = "6px 6px 0px var(--color-blueprint)";
        card.classList.add("active-role-card");
      } else {
        card.style.borderColor = "";
        card.style.boxShadow = "";
        card.classList.remove("active-role-card");
      }
    });
  }

  triggerRoleBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const roleKey = btn.dataset.pickRole;
      const finalCta = document.getElementById("final-cta");
      if (finalCta) {
        finalCta.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => selectRole(roleKey), 400);
      }
    });
  });

  roleCards.forEach(card => {
    const enterBtn = card.querySelector(".role-enter-btn");
    if (enterBtn) {
      enterBtn.addEventListener("click", () => {
        selectRole(card.dataset.role);
        const toast = document.getElementById("role-selected-toast");
        if (toast) {
          toast.textContent = `Active Profile Switched: ${card.querySelector("h3").textContent}`;
          toast.style.display = "block";
          setTimeout(() => { toast.style.display = "none"; }, 3000);
        }
      });
    }
  });

  if (startDemoBtn) {
    startDemoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const simSection = document.getElementById("simulator");
      if (simSection) {
        simSection.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          const runBtn = document.getElementById("run-solver-btn");
          if (runBtn) runBtn.click();
        }, 600);
      }
    });
  }
}
