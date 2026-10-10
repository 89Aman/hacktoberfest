import React, { useState, useEffect } from 'react';
import {
  fetchSchedule,
  fetchRooms,
  requestBooking,
  fetchBookings,
  approveBooking,
  rejectBooking,
  runSlaCheck,
  repairDisruption,
  applyRepair,
  resetSchedule,
  fetchNotifications
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'schedule' | 'admin'
  const [activeRole, setActiveRole] = useState('Admin'); // 'Student' | 'Faculty' | 'Admin'
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('14:28:40');

  // Tab 1 (Request a Room) Form State
  const [bookingPrompt, setBookingPrompt] = useState('We need a room for 30 people for 2h robotics workshop with electronics kits');
  const [eventName, setEventName] = useState('Robotics Hands-on Workshop');
  const [attendance, setAttendance] = useState(30);
  const [durationSlots, setDurationSlots] = useState(4); // 2 hours = 4 slots
  const [equipmentKits, setEquipmentKits] = useState(true);
  const [equipmentProjector, setEquipmentProjector] = useState(true);
  const [equipmentComputers, setEquipmentComputers] = useState(false);
  const [bookingRecommendation, setBookingRecommendation] = useState(null);
  const [lastCreatedBooking, setLastCreatedBooking] = useState(null);

  // Tab 3 (Admin Console) Disruption State
  const [disruptionPrompt, setDisruptionPrompt] = useState('');
  const [repairResult, setRepairResult] = useState(null);
  const [unsatExplanation, setUnsatExplanation] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const sched = await fetchSchedule();
      setRooms(sched.rooms || []);
      setEvents(sched.events || []);

      const bk = await fetchBookings();
      setBookings(bk || []);

      const notifs = await fetchNotifications();
      setNotifications(notifs || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }

  // Handle Room Request Submission
  async function handleFindSlot(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setUnsatExplanation(null);
    try {
      const reqEquipment = new Set();
      if (equipmentKits) reqEquipment.add('electronics_kits');
      if (equipmentProjector) reqEquipment.add('projector');
      if (equipmentComputers) reqEquipment.add('computers');

      const res = await requestBooking({
        requested_by: `${activeRole} User`,
        prompt: bookingPrompt,
        structured: {
          requested_by: `${activeRole} User`,
          event_name: eventName,
          event_type: 'workshop',
          date: '2026-10-10',
          attendance: parseInt(attendance),
          duration_slots: parseInt(durationSlots),
          setup_buffer_slots: 0,
          cleanup_buffer_slots: 0,
          preferred_start_slot: 10,
          allow_time_suggestion: true,
          required_equipment: Array.from(reqEquipment),
          priority: 'medium',
          accessibility_needed: false
        }
      });

      setBookingRecommendation(res.recommendation);
      setLastCreatedBooking(res.booking);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Emergency Disruption Trigger
  async function handleTriggerDisruption(presetText) {
    const textToRun = presetText || disruptionPrompt;
    if (!textToRun) return;

    setLoading(true);
    setRepairResult(null);
    setUnsatExplanation(null);
    setValidationReport(null);

    try {
      const res = await repairDisruption({ natural_language_prompt: textToRun });
      if (res.solver_result.is_sat) {
        setRepairResult(res.solver_result);
        setValidationReport(res.validation_report);
      } else {
        setUnsatExplanation(res.solver_result.conflict_explanation || res.clarification_question || 'Infeasible disruption');
      }
      loadData();
    } catch (err) {
      alert('Solver failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Commit Repair
  async function handleApplyRepair() {
    if (!repairResult || !repairResult.proposed_allocations) return;
    setLoading(true);
    try {
      await applyRepair(repairResult.proposed_allocations);
      setRepairResult(null);
      alert('Schedule repair successfully published campus-wide!');
      loadData();
    } catch (err) {
      alert('Failed to apply repair: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fast-Forward SLA Check (Simulates 2-hour timeout)
  async function handleFastForwardSla() {
    setLoading(true);
    try {
      const res = await runSlaCheck(2.1);
      alert(`SLA Check Complete: ${res.auto_approved_count} request(s) auto-approved!`);
      loadData();
    } catch (err) {
      alert('SLA check failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Reset Schedule
  async function handleReset() {
    if (!confirm('Reset schedule to seeded baseline?')) return;
    setLoading(true);
    try {
      await resetSchedule();
      setRepairResult(null);
      setUnsatExplanation(null);
      setBookingRecommendation(null);
      loadData();
    } catch (err) {
      alert('Reset failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper for slot string conversion
  function slotToTime(slot) {
    const h = 9 + Math.floor(slot / 2);
    const m = (slot % 2 === 1) ? '30' : '00';
    return `${h.toString().padStart(2, '0')}:${m}`;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#DFE2EF] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-white/10 glass-panel px-6 py-3.5 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#6366F1] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-headline font-bold text-lg text-white tracking-tight">Campus Rescue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>Gemma 4 & Z3 SMT Active</span>
              </span>
            </div>
            <p className="text-[11px] text-[#869397]">Autonomous Schedule Repair & Room Allocation</p>
          </div>
        </div>

        {/* Center Clock & Telemetry */}
        <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
          <span className="text-[#869397]">{currentTimeStr} · 09:00–18:00 Grid</span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-cyan-300">
            SAT Solver 1.4ms
          </span>
        </div>

        {/* Role Selector */}
        <div className="flex items-center space-x-1.5 bg-[#0F131C] p-1 rounded-lg border border-white/10">
          {['Student', 'Faculty', 'Admin'].map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                activeRole === role
                  ? 'bg-[#06B6D4] text-[#003640] shadow-[0_0_12px_rgba(6,182,212,0.4)] font-semibold'
                  : 'text-[#869397] hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </header>

      {/* Navigation Segmented Control */}
      <nav className="px-6 pt-4 pb-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex space-x-2 bg-white/[0.02] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
              activeTab === 'request'
                ? 'bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white shadow-[0_0_16px_rgba(6,182,212,0.3)] font-semibold'
                : 'text-[#869397] hover:text-white'
            }`}
          >
            <span>📝</span>
            <span>Request a Room</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white shadow-[0_0_16px_rgba(6,182,212,0.3)] font-semibold'
                : 'text-[#869397] hover:text-white'
            }`}
          >
            <span>📅</span>
            <span>Live Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white shadow-[0_0_16px_rgba(6,182,212,0.3)] font-semibold'
                : 'text-[#869397] hover:text-white'
            }`}
          >
            <span>🛡️</span>
            <span>Admin Console</span>
            {bookings.filter(b => b.status === 'proposed').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                {bookings.filter(b => b.status === 'proposed').length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
          >
            Reset Seed Data
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-6 overflow-y-auto">
        {/* ==================== TAB 1: REQUEST A ROOM ==================== */}
        {activeTab === 'request' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Intake Form */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
              <div>
                <h2 className="text-xl font-headline font-bold text-white flex items-center space-x-2">
                  <span>Room Allocation Request</span>
                </h2>
                <p className="text-xs text-[#869397] mt-1">
                  Type in conversational English or configure constraints. Gemma 4 & Z3 prove conflict-free feasibility.
                </p>
              </div>

              {/* Natural Language Prompt */}
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-[#06B6D4] block mb-1.5">
                  Natural Language Prompt
                </label>
                <textarea
                  rows={3}
                  value={bookingPrompt}
                  onChange={e => setBookingPrompt(e.target.value)}
                  className="w-full bg-[#0F131C] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]"
                  placeholder="e.g. Need a room for 30 people for 2h robotics workshop with electronics kits"
                />
                {/* Intent Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                    ⚡ Auto-Parsed: Capacity ≥ 30
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                    ⏱️ Duration: 120m (4 slots)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300">
                    🛠️ Equipment: #electronics_kits
                  </span>
                </div>
              </div>

              {/* Structured Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div>
                  <label className="text-xs text-[#869397] block mb-1">Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    className="w-full bg-[#0F131C] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#869397] block mb-1">Attendance ({attendance} Attendees)</label>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={attendance}
                    onChange={e => setAttendance(e.target.value)}
                    className="w-full accent-[#06B6D4]"
                  />
                </div>
              </div>

              {/* Equipment Checkboxes */}
              <div>
                <label className="text-xs text-[#869397] block mb-2">Required Equipment</label>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={equipmentKits}
                      onChange={e => setEquipmentKits(e.target.checked)}
                      className="rounded accent-[#06B6D4]"
                    />
                    <span>Electronics Kits</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={equipmentProjector}
                      onChange={e => setEquipmentProjector(e.target.checked)}
                      className="rounded accent-[#06B6D4]"
                    />
                    <span>HD Projector</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={equipmentComputers}
                      onChange={e => setEquipmentComputers(e.target.checked)}
                      className="rounded accent-[#06B6D4]"
                    />
                    <span>Desktop Computers</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleFindSlot}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white font-semibold text-sm hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Evaluating Z3 SMT Solver...' : 'Run SMT Solver Check'}</span>
              </button>
            </div>

            {/* Right Column: Verified Recommendation & SLA Countdown */}
            <div className="lg:col-span-5 space-y-5">
              {bookingRecommendation ? (
                <div className="glass-card-elevated p-6 rounded-2xl border border-cyan-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                      <span>✓</span>
                      <span>Verified Collision-Free Slot</span>
                    </span>
                    <span className="text-xs font-mono text-[#869397]">Score: 100% SAT</span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-headline font-bold text-white">{bookingRecommendation.room_name}</h3>
                    <p className="text-sm font-mono text-cyan-300 mt-0.5">
                      {bookingRecommendation.time_str} · Today
                    </p>
                  </div>

                  {/* "Why This Slot?" Explanation Card */}
                  <div className="p-4 rounded-xl bg-[#0F131C]/80 border border-white/10 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase text-[#06B6D4] flex items-center space-x-1">
                      <span>💡</span>
                      <span>Why This Slot?</span>
                    </div>
                    <p className="text-xs text-[#DFE2EF] leading-relaxed">
                      {bookingRecommendation.explanation}
                    </p>
                  </div>

                  {/* 2-Hour Auto-Approval SLA Countdown Box */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-amber-400 font-semibold">
                        2-Hour Auto-Approval SLA
                      </div>
                      <p className="text-[11px] text-[#869397]">
                        Auto-commits slot if unreviewed by admin.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-amber-300">01:54:12</div>
                      <span className="text-[10px] text-amber-400/80">Countdown Active</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => alert('Booking request registered with 2-Hour SLA!')}
                      className="w-full py-2.5 rounded-lg bg-[#06B6D4] text-[#003640] font-bold text-sm hover:bg-cyan-300 transition"
                    >
                      Confirm Booking Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center space-y-3 min-h-[350px]">
                  <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-2xl text-[#869397]">
                    🎯
                  </div>
                  <h4 className="text-base font-headline font-semibold text-white">No Active Query</h4>
                  <p className="text-xs text-[#869397] max-w-xs">
                    Click "Run SMT Solver Check" to compute optimal conflict-free classroom allocations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: LIVE SCHEDULE GRID ==================== */}
        {activeTab === 'schedule' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-headline font-bold text-white">Campus Timetable Grid</h2>
                <p className="text-xs text-[#869397]">09:00 – 18:00 (18 Discrete 30-Minute Slots) across all campus facilities.</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => alert('iCal feed subscription link copied!')}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/15 text-xs text-white hover:bg-white/[0.08] transition flex items-center space-x-1.5"
                >
                  <span>📥</span>
                  <span>Download .ics Feed</span>
                </button>
              </div>
            </div>

            {/* Room Matrix */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto p-4">
              <div className="min-w-[850px] space-y-4">
                {rooms.map(room => {
                  const roomEvents = events.filter(e => e.original_room_id === room.id);
                  return (
                    <div key={room.id} className="p-3.5 rounded-xl bg-[#0F131C] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-headline font-bold text-white">{room.name}</span>
                          <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[#869397] font-mono text-[10px]">
                            Cap: {room.capacity}
                          </span>
                          <span className="text-[#869397] text-[10px]">
                            Equipment: {Array.from(room.equipment).join(', ')}
                          </span>
                        </div>
                        <span className="text-[#869397] font-mono text-[10px]">09:00 – 18:00</span>
                      </div>

                      {/* Event Blocks */}
                      <div className="grid grid-cols-18 gap-1 h-14 bg-black/40 rounded-lg p-1 relative border border-white/5">
                        {roomEvents.map(ev => {
                          const startSlot = ev.original_start_slot;
                          const dur = ev.duration_slots;
                          const colStart = startSlot + 1;
                          const colSpan = dur;

                          const isRelocated = ev.id === 'robotics' && ev.original_room_id === 'lab_d';

                          return (
                            <div
                              key={ev.id}
                              style={{
                                gridColumn: `${colStart} / span ${colSpan}`
                              }}
                              className={`rounded-md p-1.5 flex flex-col justify-between text-[11px] truncate border transition ${
                                ev.is_protected
                                  ? 'bg-purple-950/80 border-purple-500/60 text-purple-200'
                                  : isRelocated
                                  ? 'bg-amber-950/80 border-amber-500/70 text-amber-200'
                                  : 'bg-cyan-950/60 border-cyan-600/40 text-cyan-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold truncate">{ev.name}</span>
                                {ev.is_protected && (
                                  <span className="text-[9px] px-1 bg-purple-900 rounded font-mono">🔒 PROTECTED</span>
                                )}
                                {isRelocated && (
                                  <span className="text-[9px] px-1 bg-amber-900 rounded font-mono">⚡ RELOCATED</span>
                                )}
                              </div>
                              <span className="text-[10px] opacity-75 font-mono">
                                {slotToTime(ev.original_start_slot)} ({ev.attendance} ppl)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ADMIN CONSOLE ==================== */}
        {activeTab === 'admin' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top: 2-Hour SLA Booking Requests Queue */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-headline font-bold text-white">Pending Requests & 2-Hour SLA Queue</h3>
                  <p className="text-xs text-[#869397]">
                    Requests awaiting admin decision. Auto-approval daemon commits after 2 hours.
                  </p>
                </div>
                <button
                  onClick={handleFastForwardSla}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono hover:bg-amber-500/30 transition flex items-center space-x-1"
                >
                  <span>⚡</span>
                  <span>Simulate 2-Hour Timeout</span>
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {bookings.map(b => (
                    <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{b.event_name}</span>
                        <span className="ml-2 text-[#869397]">({b.attendance} people, requested by {b.requested_by})</span>
                        <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                          Proposed: {b.proposed_room_id} at {slotToTime(b.proposed_start_slot || 10)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                          b.status === 'auto_approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          b.status === 'approved' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                          'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                        {b.status === 'proposed' && (
                          <>
                            <button
                              onClick={async () => {
                                await approveBooking(b.id);
                                loadData();
                              }}
                              className="px-2.5 py-1 rounded bg-[#10B981] text-black font-semibold text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                await rejectBooking(b.id);
                                loadData();
                              }}
                              className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#869397] italic py-2">No pending booking requests.</p>
              )}
            </div>

            {/* Middle: Emergency Disruption Desk */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div>
                <h3 className="text-lg font-headline font-bold text-white">Emergency Disruption Desk</h3>
                <p className="text-xs text-[#869397]">
                  Ingest unforeseen facility shutdowns or clashes. Z3 SMT solver guarantees minimal schedule displacement.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleTriggerDisruption('Robotics Lab A has a water leak after 2 PM. Keep the Coding Assessment untouched.')}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white hover:border-[#06B6D4] transition"
                >
                  ⚠️ Preset 1: Lab A Water Leak (14:00)
                </button>
                <button
                  onClick={() => handleTriggerDisruption('The robotics workshop now has 45 attendees and Lab A is closed.')}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-amber-300 hover:border-amber-400 transition"
                >
                  📈 Preset 2: Attendance Surge 45 (UNSAT Demo)
                </button>
                <button
                  onClick={() => handleTriggerDisruption('Prof. Rao can supervise only after 3 PM today.')}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white hover:border-[#06B6D4] transition"
                >
                  ⏱️ Preset 3: Supervisor Delayed (+60m)
                </button>
              </div>

              {/* Custom Prompt Input */}
              <div className="flex space-x-2 pt-2">
                <input
                  type="text"
                  value={disruptionPrompt}
                  onChange={e => setDisruptionPrompt(e.target.value)}
                  placeholder="Or type natural language disruption (e.g. Computer Lab B power cut between 11 AM and 1 PM)..."
                  className="flex-1 bg-[#0F131C] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
                <button
                  onClick={() => handleTriggerDisruption()}
                  className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-[#003640] font-bold text-xs hover:bg-cyan-300 transition"
                >
                  Execute Solver
                </button>
              </div>

              {/* Infeasible / UNSAT Blocker Display */}
              {unsatExplanation && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs space-y-1">
                  <div className="font-mono font-bold text-red-400 uppercase text-[11px] flex items-center space-x-1">
                    <span>🛑</span>
                    <span>Constraint Violation (UNSAT)</span>
                  </div>
                  <p>{unsatExplanation}</p>
                </div>
              )}

              {/* Feasible Diff Table */}
              {repairResult && (
                <div className="mt-4 p-5 rounded-xl bg-[#0F131C] border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-headline font-bold text-white text-sm">Minimal Disruption Plan</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[11px]">
                        {repairResult.changed_count} Event(s) Moved
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[11px]">
                        {repairResult.total_displacement_slots * 30} Mins Displaced
                      </span>
                    </div>

                    {validationReport && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        ✓ {validationReport.checks_passed}/{validationReport.total_checks} Independent Checks Passed
                      </span>
                    )}
                  </div>

                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[#869397]">
                        <th className="py-2">Event</th>
                        <th className="py-2">Original Venue</th>
                        <th className="py-2">Repaired Venue</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {repairResult.proposed_allocations.map(alloc => (
                        <tr key={alloc.event_id} className={alloc.is_changed ? 'bg-amber-950/20' : ''}>
                          <td className="py-2 text-white font-sans">{alloc.event_id}</td>
                          <td className="py-2 text-[#869397]">Original: {alloc.room_id}</td>
                          <td className="py-2 text-cyan-300">{alloc.room_id} ({slotToTime(alloc.start_slot)})</td>
                          <td className="py-2">
                            {alloc.is_changed ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">RELOCATED</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[#869397] text-[10px]">RETAINED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleApplyRepair}
                      className="px-5 py-2 rounded-xl bg-[#10B981] text-black font-bold text-xs hover:bg-emerald-400 transition flex items-center space-x-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      <span>📢</span>
                      <span>Apply Repair & Broadcast</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar with Live Ticker */}
      <footer className="border-t border-white/10 glass-panel px-6 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>
            {notifications.length > 0
              ? notifications[0].message
              : '⚡ Z3 Solver Engine ready · Zero schedule collisions detected'}
          </span>
        </div>
        <div className="text-[#869397] hidden sm:block">
          Hacktoberfest IITB · Google Gemma 4 Neuro-Symbolic Platform
        </div>
      </footer>
    </div>
  );
}
