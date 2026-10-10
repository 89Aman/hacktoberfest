import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path="Campus_Rescue_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    BG_DARK = RGBColor(11, 19, 43)        # #0B132B Deep Slate
    CARD_BG = RGBColor(26, 38, 57)        # #1A2639 Card Surface
    CARD_BORDER = RGBColor(45, 62, 80)    # #2D3E50 Card Outline
    ACCENT_BLUE = RGBColor(66, 133, 244)  # Google Blue #4285F4
    ACCENT_CYAN = RGBColor(56, 189, 248)  # Cyan #38BDF8
    ACCENT_GREEN = RGBColor(16, 185, 129) # Emerald #10B981
    ACCENT_PURPLE = RGBColor(168, 85, 247)# Violet #A855F7
    ACCENT_AMBER = RGBColor(245, 158, 11) # Amber #F59E0B
    ACCENT_RED = RGBColor(239, 68, 68)    # Coral Red #EF4444
    TEXT_WHITE = RGBColor(248, 250, 252)  # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184)  # #94A3B8
    TEXT_DIM = RGBColor(100, 116, 139)    # #64748B

    def set_slide_bg(slide, color=BG_DARK):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, title, category="CAMPUS RESCUE", subtitle=None):
        # Category Badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(2.2), Inches(0.32))
        badge.fill.solid()
        badge.fill.fore_color.rgb = RGBColor(30, 41, 59)
        badge.line.color.rgb = ACCENT_BLUE
        badge.line.width = Pt(1)
        tf = badge.text_frame
        tf.word_wrap = False
        p = tf.paragraphs[0]
        p.text = category.upper()
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN

        # Title
        t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.8))
        tf_t = t_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.name = "Segoe UI"
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE

        if subtitle:
            p_sub = tf_t.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.name = "Segoe UI"
            p_sub.font.size = Pt(12)
            p_sub.font.color.rgb = TEXT_MUTED
            p_sub.space_before = Pt(4)

        # Footer
        f_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.7), Inches(0.3))
        tf_f = f_box.text_frame
        tf_f.margin_left = tf_f.margin_top = tf_f.margin_right = tf_f.margin_bottom = 0
        p_f = tf_f.paragraphs[0]
        p_f.text = "Campus Rescue • Hacktoberfest IIT Bombay • Google Gemma 4 + Z3 SMT Engine"
        p_f.font.name = "Segoe UI"
        p_f.font.size = Pt(9)
        p_f.font.color.rgb = TEXT_DIM

    def add_card(slide, left, top, width, height, title=None, border_color=CARD_BORDER, bg_color=CARD_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)
        if title:
            tf = card.text_frame
            tf.word_wrap = True
            tf.margin_left = Inches(0.2)
            tf.margin_top = Inches(0.18)
            p = tf.paragraphs[0]
            p.text = title
            p.font.name = "Segoe UI"
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = TEXT_WHITE
        return card

    # =========================================================================
    # SLIDE 1: Title Slide (Hero Pitch)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1)

    # Accent glow banner on top
    glow = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.1))
    glow.fill.solid()
    glow.fill.fore_color.rgb = ACCENT_BLUE
    glow.line.fill.background()

    # Hackathon Tag
    tag = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(1.3), Inches(3.6), Inches(0.4))
    tag.fill.solid()
    tag.fill.fore_color.rgb = RGBColor(20, 32, 55)
    tag.line.color.rgb = ACCENT_BLUE
    tag.line.width = Pt(1)
    tf_tag = tag.text_frame
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = "🏆 HACKTOBERFEST IIT BOMBAY 2026"
    p_tag.alignment = PP_ALIGN.CENTER
    p_tag.font.name = "Segoe UI"
    p_tag.font.size = Pt(11)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_CYAN

    # Title box
    tbox = s1.shapes.add_textbox(Inches(0.9), Inches(1.9), Inches(11.5), Inches(2.2))
    tf = tbox.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "CAMPUS RESCUE"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE

    p2 = tf.add_paragraph()
    p2.text = "Neuro-Symbolic Campus Scheduling & Autonomous Disruption Repair"
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(20)
    p2.font.color.rgb = ACCENT_CYAN
    p2.space_before = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = "Bridging Google Gemma 4 Semantic Understanding with Z3 SMT Deterministic Proofs"
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(13)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(6)

    # 3 Stat / Capability Badges
    b_data = [
        ("Google Gemma 4", "Natural language constraint compiler & AST extractor", ACCENT_BLUE),
        ("Z3 SMT Solver", "Deterministic 0-conflict proof & lexicographic repair", ACCENT_GREEN),
        ("2-Hour SLA Daemon", "Zero administrative bottlenecks via autonomous fallback", ACCENT_AMBER),
    ]
    for i, (head, desc, col) in enumerate(b_data):
        bx = Inches(0.9 + i * 3.9)
        card = add_card(s1, 0.9 + i * 3.9, 4.5, 3.65, 1.9, border_color=col)
        tf_c = card.text_frame
        tf_c.margin_left = Inches(0.25)
        tf_c.margin_top = Inches(0.25)
        tf_c.margin_right = Inches(0.25)
        p = tf_c.paragraphs[0]
        p.text = head
        p.font.name = "Segoe UI"
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = col
        
        p_d = tf_c.add_paragraph()
        p_d.text = desc
        p_d.font.name = "Segoe UI"
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(8)

    # Footer note
    f_box = s1.shapes.add_textbox(Inches(0.9), Inches(6.8), Inches(11.5), Inches(0.4))
    tf_f = f_box.text_frame
    p_f = tf_f.paragraphs[0]
    p_f.text = "Live Demo • Production Architecture • Zero Hallucinations Guarantee"
    p_f.font.name = "Segoe UI"
    p_f.font.size = Pt(10)
    p_f.font.color.rgb = TEXT_DIM

    # =========================================================================
    # SLIDE 2: The Campus Dilemma & The Chatbot Fallacy
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2)
    add_header(s2, "The Problem: Why Traditional & AI Scheduling Fails", "CAMPUS FRICTION", "Real campuses face chaotic schedule disruptions, slow approvals, and unreliable AI chatbots")

    # Column 1: The Campus Reality
    c1 = add_card(s2, 0.8, 1.8, 3.65, 4.9, "1. Campus Scheduling Reality", border_color=ACCENT_RED)
    tf1 = c1.text_frame
    tf1.margin_left = tf1.margin_right = Inches(0.25)
    tf1.margin_top = Inches(0.6)
    pts1 = [
        ("Manual Bureaucracy:", "Paper forms, WhatsApp groups, and spreadsheets cause multi-day delays."),
        ("Equipment Clashes:", "Rooms booked without required projectors, lab kits, or computer setups."),
        ("Fragile Timetables:", "One pipe leak or timetable delay triggers cascading room collisions across the institute."),
        ("Admin Overload:", "Coordinators drown in approval backlogs while students wait in limbo.")
    ]
    for bold_txt, norm_txt in pts1:
        p = tf1.add_paragraph()
        p.space_before = Pt(10)
        run_b = p.add_run()
        run_b.text = bold_txt + " "
        run_b.font.bold = True
        run_b.font.size = Pt(11)
        run_b.font.color.rgb = RGBColor(252, 165, 165)
        run_n = p.add_run()
        run_n.text = norm_txt
        run_n.font.size = Pt(10.5)
        run_n.font.color.rgb = TEXT_MUTED

    # Column 2: The Chatbot Fallacy
    c2 = add_card(s2, 4.8, 1.8, 3.65, 4.9, "2. The 'Chatbot Trap'", border_color=ACCENT_AMBER)
    tf2 = c2.text_frame
    tf2.margin_left = tf2.margin_right = Inches(0.25)
    tf2.margin_top = Inches(0.6)
    pts2 = [
        ("Probabilistic Guessing:", "LLMs predict tokens, not formal discrete mathematical truths."),
        ("Phantom Rooms:", "Generative models hallucinate non-existent rooms or double-book occupied slots."),
        ("Silent Constraint Drift:", "Chatbots casually ignore 30-min slot limits, capacity ceilings, and teacher overlaps."),
        ("Catastrophic Ripple:", "A single hallucinated room swap breaks 10 subsequent university lectures.")
    ]
    for bold_txt, norm_txt in pts2:
        p = tf2.add_paragraph()
        p.space_before = Pt(10)
        run_b = p.add_run()
        run_b.text = bold_txt + " "
        run_b.font.bold = True
        run_b.font.size = Pt(11)
        run_b.font.color.rgb = RGBColor(253, 230, 138)
        run_n = p.add_run()
        run_n.text = norm_txt
        run_n.font.size = Pt(10.5)
        run_n.font.color.rgb = TEXT_MUTED

    # Column 3: The Campus Rescue Standard
    c3 = add_card(s2, 8.8, 1.8, 3.65, 4.9, "3. The Campus Rescue Standard", border_color=ACCENT_GREEN)
    tf3 = c3.text_frame
    tf3.margin_left = tf3.margin_right = Inches(0.25)
    tf3.margin_top = Inches(0.6)
    pts3 = [
        ("Neuro-Symbolic Split:", "Gemma 4 parses intent; SMT Z3 proves mathematical truth."),
        ("0 Double-Bookings:", "Satisfiability Modulo Theories guarantees mathematical collision freedom."),
        ("2-Hour SLA Guarantee:", "Auto-approves optimal slot if admin is unresponsive, eliminating stalled queues."),
        ("Truthful Unsat Cores:", "Refuses to hallucinate on impossible demands; explains exact constraint blockers.")
    ]
    for bold_txt, norm_txt in pts3:
        p = tf3.add_paragraph()
        p.space_before = Pt(10)
        run_b = p.add_run()
        run_b.text = bold_txt + " "
        run_b.font.bold = True
        run_b.font.size = Pt(11)
        run_b.font.color.rgb = RGBColor(110, 231, 183)
        run_n = p.add_run()
        run_n.text = norm_txt
        run_n.font.size = Pt(10.5)
        run_n.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 3: Neuro-Symbolic Architecture
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3)
    add_header(s3, "Architecture: Neuro-Symbolic Separation of Concerns", "CORE INNOVATION", "Decoupling probabilistic natural language understanding from deterministic mathematical proof")

    # Left: Gemma 4 Box
    g_card = add_card(s3, 0.8, 1.8, 5.6, 3.4, "🧠 Semantic Translation: Google Gemma 4", border_color=ACCENT_BLUE)
    tfg = g_card.text_frame
    tfg.margin_left = tfg.margin_right = Inches(0.25)
    tfg.margin_top = Inches(0.65)
    g_pts = [
        "Ingests conversational student/admin requests in free-form English.",
        "Role-restricted as a semantic compiler (strictly prohibited from guessing allocations).",
        "Extracts typed Pydantic V2 AST: equipment flags, attendance, duration, slot bounds.",
        "If ambiguous, triggers a single targeted clarification question instead of guessing."
    ]
    for pt in g_pts:
        p = tfg.add_paragraph()
        p.space_before = Pt(6)
        p.text = "• " + pt
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MUTED

    # Right: Z3 SMT Engine Box
    z_card = add_card(s3, 6.8, 1.8, 5.6, 3.4, "⚙️ Deterministic Proof: Z3 SMT Engine", border_color=ACCENT_PURPLE)
    tfz = z_card.text_frame
    tfz.margin_left = tfz.margin_right = Inches(0.25)
    tfz.margin_top = Inches(0.65)
    z_pts = [
        "Discrete 30-min integer time grid across campus (18 slots/day, 09:00 - 18:00).",
        "Formulates room capacity, supervisor schedules, and equipment as hard constraints.",
        "Lexicographic multi-objective optimization (Min displaced events ➔ Min time drift).",
        "Zero-Trust pure-Python gate independently validates all 8 invariants before commit."
    ]
    for pt in z_pts:
        p = tfz.add_paragraph()
        p.space_before = Pt(6)
        p.text = "• " + pt
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MUTED

    # Bottom Banner: The Unified Interface
    b_banner = add_card(s3, 0.8, 5.4, 11.6, 1.4, border_color=ACCENT_CYAN, bg_color=RGBColor(15, 23, 42))
    tfb = b_banner.text_frame
    tfb.margin_left = tfb.margin_right = Inches(0.3)
    tfb.margin_top = Inches(0.2)
    pb1 = tfb.paragraphs[0]
    pb1.text = "THE NEURO-SYMBOLIC GUARANTEE"
    pb1.font.bold = True
    pb1.font.size = Pt(12)
    pb1.font.color.rgb = ACCENT_CYAN

    pb2 = tfb.add_paragraph()
    pb2.text = "Gemma provides zero-friction human accessibility; Z3 provides mathematical immutability. No LLM hallucination can ever book an occupied room or bypass equipment checks."
    pb2.font.size = Pt(11)
    pb2.font.color.rgb = TEXT_WHITE
    pb2.space_before = Pt(4)

    # =========================================================================
    # SLIDE 4: End-to-End System Control Flow
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4)
    add_header(s4, "End-to-End Control Loop: From Request to Verified Calendar", "WORKFLOW", "Structured data pipeline with multi-gate validation and automated SLA fallback")

    steps = [
        ("Step 1", "Intake Request", "User submits natural language or structured form with needs.", ACCENT_BLUE),
        ("Step 2", "Gemma 4 Parse", "Extracts AST: attendance, equipment, duration, preferences.", ACCENT_CYAN),
        ("Step 3", "Z3 SMT Solver", "Evaluates all campus slots; computes SAT solution or UNSAT core.", ACCENT_PURPLE),
        ("Step 4", "Zero-Trust Gate", "Pure-Python engine audits 8 invariant rules independently.", ACCENT_GREEN),
        ("Step 5", "Admin / SLA Gate", "Coordinator reviews with 2-hr timer; auto-commits if expired.", ACCENT_AMBER)
    ]
    for i, (num, title, desc, col) in enumerate(steps):
        left_pos = 0.8 + i * 2.38
        scard = add_card(s4, left_pos, 1.8, 2.2, 4.0, border_color=col)
        tfs = scard.text_frame
        tfs.margin_left = tfs.margin_right = Inches(0.18)
        tfs.margin_top = Inches(0.25)
        
        p_num = tfs.paragraphs[0]
        p_num.text = num.upper()
        p_num.font.bold = True
        p_num.font.size = Pt(10)
        p_num.font.color.rgb = col
        
        p_t = tfs.add_paragraph()
        p_t.text = title
        p_t.font.bold = True
        p_t.font.size = Pt(13)
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(4)
        
        p_d = tfs.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(8)

    # Bottom summary callout
    bot = add_card(s4, 0.8, 6.0, 11.6, 0.85, border_color=CARD_BORDER, bg_color=RGBColor(18, 27, 47))
    tfbot = bot.text_frame
    tfbot.margin_left = Inches(0.3)
    tfbot.margin_top = Inches(0.18)
    p_bot = tfbot.paragraphs[0]
    p_bot.text = "⚡ System Latency: Gemma 4 parsing (~800ms) + Z3 SMT solve (<50ms) + Zero-Trust audit (<5ms) = Instant UI feedback."
    p_bot.font.size = Pt(11)
    p_bot.font.bold = True
    p_bot.font.color.rgb = ACCENT_GREEN

    # =========================================================================
    # SLIDE 5: Deterministic SMT Constraint Engine
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5)
    add_header(s5, "The SMT Engine: Mathematical Rigor & Multi-Objective Optimization", "CONSTRAINT FORMULATION", "Formal constraints eliminate double-bookings and ensure optimal schedule repair")

    # Card 1: Hard Constraints
    c_hard = add_card(s5, 0.8, 1.8, 5.6, 4.9, "🔒 Hard Constraints (Non-Negotiable Proofs)", border_color=ACCENT_RED)
    tf_h = c_hard.text_frame
    tf_h.margin_left = tf_h.margin_right = Inches(0.25)
    tf_h.margin_top = Inches(0.55)
    h_items = [
        ("Capacity Invariant:", "Capacity(Room) ≥ Attendance for all events."),
        ("Equipment Prerequisite:", "Required_Equipment ⊆ Equipment(Room)."),
        ("Discrete Slot Boundaries:", "Events occupy integer chunks in [0, 18) slots (09:00 - 18:00)."),
        ("Zero Overlaps (Rooms):", "Non-overlapping intervals for distinct events in the same room."),
        ("Zero Overlaps (Supervisors):", "Instructors cannot supervise multiple parallel sessions."),
        ("Buffer Windows:", "Workshops enforce mandatory 30-min setup & cleanup slots."),
        ("Protected Events:", "High-stakes exams marked 'PROTECTED' are immutable in room & time.")
    ]
    for b_txt, n_txt in h_items:
        p = tf_h.add_paragraph()
        p.space_before = Pt(6)
        r1 = p.add_run()
        r1.text = "• " + b_txt + " "
        r1.font.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = TEXT_WHITE
        r2 = p.add_run()
        r2.text = n_txt
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

    # Card 2: Lexicographic Optimization
    c_opt = add_card(s5, 6.8, 1.8, 5.6, 4.9, "⚖️ Lexicographic Multi-Objective Optimization", border_color=ACCENT_GREEN)
    tf_o = c_opt.text_frame
    tf_o.margin_left = tf_o.margin_right = Inches(0.25)
    tf_o.margin_top = Inches(0.55)
    o_items = [
        ("Priority 1: Minimize Displacement", "Minimize total existing events moved during emergency repairs: min ∑ I[event_changed]."),
        ("Priority 2: Minimize Time Drift", "Keep events as close to original requested time as mathematically possible: min |start - preferred_start|."),
        ("Priority 3: Room Preference", "Keep events in their original or requested room before searching across buildings."),
        ("Deterministic Reproducibility", "Given identical timetable inputs, Z3 returns the identical proven schedule every single run.")
    ]
    for b_txt, n_txt in o_items:
        p = tf_o.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = "• " + b_txt + " "
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(110, 231, 183)
        r2 = p.add_run()
        r2.text = "\n  " + n_txt
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 6: Autonomous Governance & 2-Hour Auto-Approval SLA
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6)
    add_header(s6, "Autonomous Governance: The 2-Hour Auto-Approval SLA", "OPERATIONAL VELOCITY", "Eliminating bureaucratic bottlenecks while preserving complete administrator oversight")

    # Left: The State Machine
    sla_card = add_card(s6, 0.8, 1.8, 6.6, 4.9, "⏱️ SLA State Machine & Expiry Logic", border_color=ACCENT_AMBER)
    tf_sla = sla_card.text_frame
    tf_sla.margin_left = tf_sla.margin_right = Inches(0.3)
    tf_sla.margin_top = Inches(0.6)
    
    sla_steps = [
        ("1. Instant Proposal:", "Request received ➔ Z3 immediately verifies highest-ranked feasible slot ➔ Status becomes 'proposed'."),
        ("2. 2-Hour SLA Timer Attached:", "Real-time countdown starts visible to requester and admin console."),
        ("3. Manual Action Window:", "Coordinator has 120 minutes to approve, reject, or manually override the room/slot."),
        ("4. Autonomous Commit on Expiry:", "If timer hits zero with no action: status transitions to 'auto_approved', slot is locked into active calendar."),
        ("5. Multi-Party Audit Notification:", "Instant audit alert sent to requester, department coordinator, and facility manager.")
    ]
    for st, sd in sla_steps:
        p = tf_sla.add_paragraph()
        p.space_before = Pt(8)
        r1 = p.add_run()
        r1.text = st + " "
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(253, 230, 138)
        r2 = p.add_run()
        r2.text = sd
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = TEXT_MUTED

    # Right: Why This Matters (Stats)
    stat1 = add_card(s6, 7.8, 1.8, 4.6, 2.3, border_color=ACCENT_CYAN)
    tf_s1 = stat1.text_frame
    tf_s1.margin_left = tf_s1.margin_right = Inches(0.25)
    tf_s1.margin_top = Inches(0.2)
    ps1 = tf_s1.paragraphs[0]
    ps1.text = "0 Hours"
    ps1.font.size = Pt(36)
    ps1.font.bold = True
    ps1.font.color.rgb = ACCENT_CYAN
    ps1_sub = tf_s1.add_paragraph()
    ps1_sub.text = "Unattended Scheduling Delay"
    ps1_sub.font.bold = True
    ps1_sub.font.size = Pt(13)
    ps1_sub.font.color.rgb = TEXT_WHITE
    ps1_desc = tf_s1.add_paragraph()
    ps1_desc.text = "No booking request is ever trapped in admin purgatory. Verified slots go live automatically."
    ps1_desc.font.size = Pt(10)
    ps1_desc.font.color.rgb = TEXT_MUTED
    ps1_desc.space_before = Pt(4)

    stat2 = add_card(s6, 7.8, 4.4, 4.6, 2.3, border_color=ACCENT_GREEN)
    tf_s2 = stat2.text_frame
    tf_s2.margin_left = tf_s2.margin_right = Inches(0.25)
    tf_s2.margin_top = Inches(0.2)
    ps2 = tf_s2.paragraphs[0]
    ps2.text = "100% Safe"
    ps2.font.size = Pt(36)
    ps2.font.bold = True
    ps2.font.color.rgb = ACCENT_GREEN
    ps2_sub = tf_s2.add_paragraph()
    ps2_sub.text = "Mathematically Pre-Verified"
    ps2_sub.font.bold = True
    ps2_sub.font.size = Pt(13)
    ps2_sub.font.color.rgb = TEXT_WHITE
    ps2_desc = tf_s2.add_paragraph()
    ps2_desc.text = "Auto-approvals are never unverified guesses. Z3 already proved zero-conflicts before the timer started."
    ps2_desc.font.size = Pt(10)
    ps2_desc.font.color.rgb = TEXT_MUTED
    ps2_desc.space_before = Pt(4)

    # =========================================================================
    # SLIDE 7: Truthful Justifications & Zero-Trust Validator
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7)
    add_header(s7, "Explainability: 'Why This Slot?' & Zero-Trust Validation", "TRANSPARENCY & AUDITING", "Every recommendation is accompanied by human-readable proof and audited by an independent gate")

    # Left Card: Why This Slot?
    card_why = add_card(s7, 0.8, 1.8, 5.6, 4.9, "💡 'Why This Slot?' Explanation Cards", border_color=ACCENT_CYAN)
    tf_w = card_why.text_frame
    tf_w.margin_left = tf_w.margin_right = Inches(0.25)
    tf_w.margin_top = Inches(0.6)
    w_pts = [
        ("Derived Strictly from Solver Truth:", "Unlike generative LLMs that fabricate reasons, explanations are synthesized directly from Z3 model assignments."),
        ("Multi-Factor Justification:", "Details capacity headroom, equipment match, supervisor availability, and clash avoidance."),
        ("Example Real Output:", "'Recommended Maker Lab D at 14:00 because it seats 35 (request: 30), includes electronics kits, has no supervisor conflicts, and displaces 0 existing events.'"),
        ("Student & Admin Confidence:", "Users immediately see why an alternative was picked over their original preference.")
    ]
    for b_t, n_t in w_pts:
        p = tf_w.add_paragraph()
        p.space_before = Pt(8)
        r1 = p.add_run()
        r1.text = "• " + b_t + " "
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = TEXT_WHITE
        r2 = p.add_run()
        r2.text = n_t
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

    # Right Card: Zero-Trust Validator
    card_val = add_card(s7, 6.8, 1.8, 5.6, 4.9, "🛡️ Independent Zero-Trust Validator", border_color=ACCENT_GREEN)
    tf_v = card_val.text_frame
    tf_v.margin_left = tf_v.margin_right = Inches(0.25)
    tf_v.margin_top = Inches(0.6)
    v_pts = [
        ("Independent Python Engine:", "Runs in validator.py, completely separated from Z3 solver execution."),
        ("8 Mandatory Audit Checks:", "Must pass 8/8 invariants before schedule rendering:"),
        ("1. Event List Completeness", "No dropped or unmapped events."),
        ("2. Valid Slot Range [0, 18)", "All bookings adhere strictly to operational hours."),
        ("3. Capacity & Equipment", "Room size and hardware requirements guaranteed."),
        ("4. Zero Room & Supervisor Overlaps", "Double-booking prevention verified in discrete time."),
        ("5. Closure Windows & Protected Immutability", "Never schedules in closed rooms; exams untouched.")
    ]
    for i, item in enumerate(v_pts):
        p = tf_v.add_paragraph()
        p.space_before = Pt(4 if i > 1 else 8)
        if isinstance(item, tuple):
            r1 = p.add_run()
            r1.text = "• " + item[0] + " "
            r1.font.bold = True
            r1.font.size = Pt(10.5)
            r1.font.color.rgb = RGBColor(110, 231, 183)
            r2 = p.add_run()
            r2.text = item[1]
            r2.font.size = Pt(10)
            r2.font.color.rgb = TEXT_MUTED
        else:
            p.text = "  ✓ " + item
            p.font.size = Pt(9.5)
            p.font.color.rgb = RGBColor(167, 243, 208)

    # =========================================================================
    # SLIDE 8: Edge Cases & Unsat Core Diagnostics
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8)
    add_header(s8, "Edge Cases: Mathematical Unsat Core Diagnostics", "ZERO-HALLUCINATION ROBUSTNESS", "When a request is impossible, the system proves infeasibility and isolates exact mathematical blockers")

    # Left: The Conflict Scenario
    c_scen = add_card(s8, 0.8, 1.8, 5.6, 4.9, "⚠️ The Impossible Request Scenario", border_color=ACCENT_RED)
    tf_sc = c_scen.text_frame
    tf_sc.margin_left = tf_sc.margin_right = Inches(0.25)
    tf_sc.margin_top = Inches(0.6)
    sc_items = [
        ("User Command:", "'Book Robotics workshop for 45 students with electronics kits after 2 PM.'"),
        ("Physical Reality:", "Maker Lab D seats 35 (has kits). Robotics Lab A seats 50 (closed due to water leak)."),
        ("Chatbot Reaction (Wrong):", "Hallucinates: books 45 students into Lab D anyway, or invents a non-existent room."),
        ("Campus Rescue Reaction (Correct):", "Z3 evaluates all possibilities and proves UNSAT (Infeasible) in <20ms.")
    ]
    for b_t, n_t in sc_items:
        p = tf_sc.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = b_t + "\n"
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(252, 165, 165)
        r2 = p.add_run()
        r2.text = n_t
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = TEXT_MUTED

    # Right: Unsat Core Extraction
    c_core = add_card(s8, 6.8, 1.8, 5.6, 4.9, "🔍 Mathematical Unsat Core Diagnosis", border_color=ACCENT_PURPLE)
    tf_co = c_core.text_frame
    tf_co.margin_left = tf_co.margin_right = Inches(0.25)
    tf_co.margin_top = Inches(0.6)
    co_items = [
        ("Constraint Tracking:", "Every constraint is asserted with tracking tags: z3.assert_and_track()."),
        ("Conflicting Subset Extraction:", "Solver computes solver.unsat_core() to pinpoint the exact minimal contradiction."),
        ("Honest Plain-Language Explanation:", "'Cannot schedule: Robotics Lab A is closed after 14:00, and Maker Lab D has maximum capacity 35 (requested 45).'"),
        ("Actionable Admin Options:", "1. Relax attendance limit\n2. Split into 2 sections\n3. Waive electronics kit requirement")
    ]
    for b_t, n_t in co_items:
        p = tf_co.add_paragraph()
        p.space_before = Pt(8)
        r1 = p.add_run()
        r1.text = "• " + b_t + " "
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(216, 180, 254)
        r2 = p.add_run()
        r2.text = "\n  " + n_t
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 9: UX & Three-Role Interface
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9)
    add_header(s9, "User Experience: Tailored Workflows for Campus Personas", "APPLICATION WORKFLOWS", "Role-based views designed for fast decision making and zero administrative friction")

    roles = [
        ("Student & Club Leads", "Tab 1: Request a Room", [
            "Plain-English natural language booking bar.",
            "Instant verified slot recommendation card.",
            "'Why this slot?' transparent explanation.",
            "Live 2-Hour Auto-Approval countdown badge.",
            "One-click calendar export (.ics)."
        ], ACCENT_BLUE),
        ("Super Admins & Coordinators", "Tab 2: Admin Queue & SLA", [
            "Real-time pending request approvals queue.",
            "One-click Approve / Modify / Reject buttons.",
            "Fast-forward 2-Hour SLA simulation button.",
            "Audit trail log of all auto-approved slots.",
            "Emergency room closure toggle interface."
        ], ACCENT_AMBER),
        ("Disruption Response Team", "Tab 3: Emergency Repair", [
            "Emergency disruption simulator (pipe leaks, delays).",
            "Lexicographic minimal-disruption SMT repair.",
            "Side-by-side Before/After diff schedule matrix.",
            "Zero-Trust 8/8 invariant audit confirmation.",
            "Single-click 'Apply Repair' commit button."
        ], ACCENT_GREEN)
    ]
    for i, (r_name, tab_name, bullets, col) in enumerate(roles):
        left_pos = 0.8 + i * 3.9
        rcard = add_card(s9, left_pos, 1.8, 3.65, 4.9, border_color=col)
        tfr = rcard.text_frame
        tfr.margin_left = tfr.margin_right = Inches(0.2)
        tfr.margin_top = Inches(0.25)
        
        pr_name = tfr.paragraphs[0]
        pr_name.text = r_name
        pr_name.font.bold = True
        pr_name.font.size = Pt(14)
        pr_name.font.color.rgb = col
        
        ptab = tfr.add_paragraph()
        ptab.text = tab_name
        ptab.font.size = Pt(11)
        ptab.font.bold = True
        ptab.font.color.rgb = TEXT_WHITE
        ptab.space_before = Pt(4)
        
        for b in bullets:
            pb = tfr.add_paragraph()
            pb.space_before = Pt(6)
            pb.text = "• " + b
            pb.font.size = Pt(10)
            pb.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 10: Tech Stack & Architecture Deep Dive
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s10)
    add_header(s10, "Technology Stack & Production Engineering", "SYSTEM IMPLEMENTATION", "Production-grade stack built with Google Cloud AI, formal logic, and modern web frameworks")

    tech_cards = [
        ("Google Gemma 4", "gemma-4-26b-a4b-it", "Semantic compiler & AST extractor. Translates messy user text into typed Pydantic payloads with structured fallback.", ACCENT_BLUE),
        ("Z3 SMT Solver", "z3-solver v4.13+", "High-performance SMT engine for theorem proving, lexicographic optimization, and Unsat core extraction in <50ms.", ACCENT_PURPLE),
        ("Backend & Schemas", "FastAPI + Pydantic V2", "Type-safe data contracts, 30-min discrete time representations, and RESTful schedule dispatch.", ACCENT_CYAN),
        ("Database & Persistence", "Supabase PostgreSQL", "Relational persistence for rooms, bookings, schedules, and complete immutable audit logs.", ACCENT_GREEN),
        ("Frontend & UI", "Streamlit Dashboard", "Responsive interface featuring live timetable grids, SLA countdown badges, and interactive diff visualizers.", ACCENT_AMBER),
        ("Independent Auditor", "validator.py (Pure Python)", "Zero-trust verification gate checking 8 invariants with 0 dependencies before any calendar update commits.", ACCENT_RED),
    ]
    for i, (title, subtitle, desc, col) in enumerate(tech_cards):
        row = i // 3
        col_idx = i % 3
        x = 0.8 + col_idx * 3.9
        y = 1.8 + row * 2.5
        c = add_card(s10, x, y, 3.65, 2.3, border_color=col)
        tfc = c.text_frame
        tfc.margin_left = tfc.margin_right = Inches(0.2)
        tfc.margin_top = Inches(0.18)
        
        p1 = tfc.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(13)
        p1.font.color.rgb = col
        
        p2 = tfc.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        p2.space_before = Pt(2)
        
        p3 = tfc.add_paragraph()
        p3.text = desc
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = TEXT_MUTED
        p3.space_before = Pt(4)

    # =========================================================================
    # SLIDE 11: 2-Minute Judging Demo Script
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s11)
    add_header(s11, "Live Demo Plan: The 2-Minute Judging Chronology", "DEMO REHEARSAL", "Structured pitch sequence demonstrating every core breakthrough within 120 seconds")

    acts = [
        ("0:00 – 0:25", "Act I: Natural Language & Justification", "Open Tab 1. Enter: 'Need room for 30 students for 2-hour Robotics workshop with kits'. Show Gemma 4 parse + Z3 solve (<50ms). Highlight 'Why this slot?' explanation & 2-hr SLA timer.", ACCENT_BLUE),
        ("0:25 – 0:50", "Act II: 2-Hour SLA Auto-Approval", "Switch to Tab 2. Demonstrate pending proposal in queue. Click 'Fast-Forward 2 Hours'. System automatically commits slot to active calendar and fires multi-party notification.", ACCENT_AMBER),
        ("0:50 – 1:25", "Act III: Emergency Disruption Repair", "Trigger Preset 1: 'Lab A pipe leak after 2 PM. Keep exam untouched'. Click solver. SMT shifts 1 single workshop, leaves exam protected, displaces 0 total minutes. Show 8/8 Zero-Trust badge.", ACCENT_GREEN),
        ("1:25 – 1:45", "Act IV: Mathematical Unsat Core", "Trigger Preset 3: 45 attendees + Lab A closed. Run solver ➔ System returns UNSAT. Highlight refusal to hallucinate; show exact conflicting constraints (Lab A closed, Lab D seats 35).", ACCENT_PURPLE),
        ("1:45 – 2:00", "Act V: Conclusion & Value Pitch", "Deliver final punchline: 'Most campus tools generate static tables that break on day one. Campus Rescue bridges natural language with mathematical verification for resilient campus operations.'", ACCENT_CYAN)
    ]
    for i, (time_slot, act_title, script, col) in enumerate(acts):
        y_pos = 1.75 + i * 1.0
        c_act = add_card(s11, 0.8, y_pos, 11.6, 0.9, border_color=col, bg_color=RGBColor(20, 30, 48))
        tfa = c_act.text_frame
        tfa.margin_left = Inches(0.25)
        tfa.margin_top = Inches(0.12)
        
        p = tfa.paragraphs[0]
        r_time = p.add_run()
        r_time.text = time_slot + "  •  "
        r_time.font.bold = True
        r_time.font.size = Pt(11)
        r_time.font.color.rgb = col
        
        r_title = p.add_run()
        r_title.text = act_title + ": "
        r_title.font.bold = True
        r_title.font.size = Pt(11)
        r_title.font.color.rgb = TEXT_WHITE
        
        r_body = p.add_run()
        r_body.text = script
        r_body.font.size = Pt(9.5)
        r_body.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 12: Impact, Scalability & Roadmap
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s12)
    add_header(s12, "Impact, Campus Scalability & Future Roadmap", "VISION & VIABILITY", "Transforming university operations from fragile manual registers to resilient autonomous infrastructure")

    # Column 1: Immediate Impact
    i1 = add_card(s12, 0.8, 1.8, 3.65, 4.9, "📈 Immediate Campus Value", border_color=ACCENT_GREEN)
    tfi1 = i1.text_frame
    tfi1.margin_left = tfi1.margin_right = Inches(0.25)
    tfi1.margin_top = Inches(0.6)
    pts_i1 = [
        ("0 Double-Bookings:", "Formal mathematical guarantee eliminates room clashes entirely."),
        ("90% Faster Bookings:", "Reduces average approval cycle from 48 hours to instant proposal or 2-hour SLA."),
        ("100% Conflict Transparency:", "Zero frustration from unexplained rejections; users get mathematical facts."),
        ("Autonomous Resiliency:", "Weather delays and pipe leaks resolved in under 1 second without panic.")
    ]
    for b_t, n_t in pts_i1:
        p = tfi1.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = b_t + " "
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(110, 231, 183)
        r2 = p.add_run()
        r2.text = n_t
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

    # Column 2: Technical Scalability
    i2 = add_card(s12, 4.8, 1.8, 3.65, 4.9, "⚡ Technical Scalability", border_color=ACCENT_CYAN)
    tfi2 = i2.text_frame
    tfi2.margin_left = tfi2.margin_right = Inches(0.25)
    tfi2.margin_top = Inches(0.6)
    pts_i2 = [
        ("<50ms Solver Speed:", "Discrete integer formulation handles 50+ rooms and 300+ events per day effortlessly."),
        ("Edge & Local Weights:", "Gemma 4 runs locally or via API, ensuring low operating cost and data privacy."),
        ("Stateless Microservice:", "Z3 solver runs as an isolated stateless worker scalable across serverless containers."),
        ("Strict Schema Safety:", "Pydantic V2 guarantees no malformed AST can ever touch the constraint solver.")
    ]
    for b_t, n_t in pts_i2:
        p = tfi2.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = b_t + " "
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(186, 230, 253)
        r2 = p.add_run()
        r2.text = n_t
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

    # Column 3: Future Roadmap
    i3 = add_card(s12, 8.8, 1.8, 3.65, 4.9, "🚀 Future Roadmap", border_color=ACCENT_PURPLE)
    tfi3 = i3.text_frame
    tfi3.margin_left = tfi3.margin_right = Inches(0.25)
    tfi3.margin_top = Inches(0.6)
    pts_i3 = [
        ("Multi-Campus Federated Mesh:", "Coordinate shared auditoriums and inter-department facilities across institutes."),
        ("Energy-Aware HVAC Routing:", "Cluster events in adjacent rooms to reduce campus AC and lighting power consumption."),
        ("Two-Way Google/Outlook Sync:", "Bi-directional calendar syncing with real-time push notifications."),
        ("Multi-Modal QR Check-in:", "Auto-release rooms if no attendee checks in within 15 minutes of event start.")
    ]
    for b_t, n_t in pts_i3:
        p = tfi3.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = b_t + " "
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(216, 180, 254)
        r2 = p.add_run()
        r2.text = n_t
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

    # Save presentation
    prs.save(output_path)
    print(f"Presentation saved successfully to {output_path}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "Campus_Rescue_Presentation.pptx"
    create_deck(out)
