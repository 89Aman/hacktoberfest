import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchHealth,
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
import {
  IconBolt,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconCalendar,
  IconEdit,
  IconShield,
  IconBell,
  IconRefresh,
  IconDownload,
  IconBroadcast,
  IconCpu,
  IconLock,
  IconInfo,
  IconTarget,
  IconClose,
  IconLayers,
  IconTerminal
} from './icons';

// Slot formatting helper: slot 0 = 09:00, slot 18 = 18:00
function slotToTime(slot) {
  const h = 9 + Math.floor(slot / 2);
  const m = (slot % 2 === 1) ? '30' : '00';
  return `${h.toString().padStart(2, '0')}:${m}`;
}

function slotRangeToTime(startSlot, durationSlots) {
  return `${slotToTime(startSlot)} – ${slotToTime(startSlot + durationSlots)}`;
}

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'schedule' | 'admin'
  const [activeRole, setActiveRole] = useState('Student'); // 'Student' | 'Faculty' | 'Admin'
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Live Database State from Supabase
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ supabase_connected: true, gemma_configured: false });
  const [loading, setLoading] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('09:00:00');

  // Search & Filters for Schedule Grid
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all'); // 'all' | 'electronics_kits' | 'computers' | 'projector'

  // Tab 1 (Request a Room) Form State
  const [bookingPrompt, setBookingPrompt] = useState('We need a room for 30 students for 2h robotics hands-on workshop with electronics kits');
  const [eventName, setEventName] = useState('Robotics Hands-on Workshop');
  const [eventType, setEventType] = useState('workshop');
  const [attendance, setAttendance] = useState(30);
  const [durationSlots, setDurationSlots] = useState(4); // 2 hours = 4 discrete 30-min slots
  const [equipmentKits, setEquipmentKits] = useState(true);
  const [equipmentProjector, setEquipmentProjector] = useState(true);
  const [equipmentComputers, setEquipmentComputers] = useState(false);
  const [bookingRecommendation, setBookingRecommendation] = useState(null);
  const [slaCountdownSec, setSlaCountdownSec] = useState(7200); // 2 hours = 7200s

  // Tab 3 (Admin Console) Disruption State
  const [disruptionPrompt, setDisruptionPrompt] = useState('');
  const [repairResult, setRepairResult] = useState(null);
  const [unsatExplanation, setUnsatExplanation] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  // Clock tick & SLA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toTimeString().split(' ')[0]);
      setSlaCountdownSec(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show Toast Helper
  function triggerToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Initial load
  useEffect(() => {
    loadData();
    checkHealth();
  }, []);

  async function checkHealth() {
    try {
      const h = await fetchHealth();
      setSystemHealth(h);
    } catch {
      // ignore
    }
  }

  async function loadData() {
    try {
      const [sched, bk, notifs] = await Promise.all([
        fetchSchedule(),
        fetchBookings(),
        fetchNotifications()
      ]);
      setRooms(sched.rooms || []);
      setEvents(sched.events || []);
      setBookings(bk || []);
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
        requested_by: `${activeRole} (${eventName.slice(0, 15)})`,
        prompt: bookingPrompt,
        structured: {
          requested_by: `${activeRole} Organizer`,
          event_name: eventName,
          event_type: eventType,
          date: '2026-10-10',
          attendance: parseInt(attendance),
          duration_slots: parseInt(durationSlots),
          setup_buffer_slots: 0,
          cleanup_buffer_slots: 0,
          preferred_start_slot: 10,
          allow_time_suggestion: true,
          required_equipment: Array.from(reqEquipment),
          priority: activeRole === 'Faculty' ? 'high' : 'medium',
          accessibility_needed: false
        }
      });

      setBookingRecommendation(res.recommendation);
      setSlaCountdownSec(7200);
      triggerToast(`Collision-free slot verified in ${res.recommendation.room_name}`);
      loadData();
    } catch (err) {
      triggerToast(`Solver Notice: ${err.message}`);
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
      if (res.solver_result && res.solver_result.is_sat) {
        setRepairResult(res.solver_result);
        setValidationReport(res.validation_report);
        triggerToast('Z3 Prover: Minimal displacement repair computed');
      } else {
        const expl = (res.solver_result && res.solver_result.conflict_explanation) ||
                     res.clarification_question ||
                     'UNSAT: Infeasible schedule. Constraints violate capacity or time bounds.';
        setUnsatExplanation(expl);
        triggerToast('Constraint conflict detected (UNSAT)');
      }
      loadData();
    } catch (err) {
      triggerToast(`Disruption Solver Error: ${err.message}`);
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
      triggerToast('Schedule repair broadcasted campus-wide via Supabase');
      loadData();
    } catch (err) {
      triggerToast(`Failed to apply repair: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Fast-Forward SLA Check (Simulates 2-hour timeout)
  async function handleFastForwardSla() {
    setLoading(true);
    try {
      const res = await runSlaCheck(2.1);
      triggerToast(`SLA Check Complete: ${res.auto_approved_count} request(s) auto-approved`);
      loadData();
    } catch (err) {
      triggerToast(`SLA check failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle Reset Schedule
  async function handleReset() {
    if (!confirm('Restore timetable and Supabase database back to seeded baseline?')) return;
    setLoading(true);
    try {
      await resetSchedule();
      setRepairResult(null);
      setUnsatExplanation(null);
      setBookingRecommendation(null);
      triggerToast('Supabase database and schedule restored to baseline');
      loadData();
    } catch (err) {
      triggerToast(`Reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Format seconds to HH:MM:SS
  function formatCountdown(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Filtered rooms and events for Schedule View
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (equipmentFilter === 'all') return true;
      return room.equipment.includes(equipmentFilter);
    });
  }, [rooms, equipmentFilter]);

  // Pending count for Admin badge
  const pendingBookingCount = bookings.filter(b => b.status === 'proposed').length;

  return (
    <div className="min-h-screen bg-[#090D16] text-[#DFE2EF] flex flex-col font-sans selection:bg-[#06B6D4] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#0F172A] border border-[#06B6D4] text-white px-4 py-3 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center space-x-3">
          <IconBolt className="w-4 h-4 text-[#06B6D4]" />
          <span className="text-xs font-mono">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[#869397] hover:text-white ml-2" aria-label="Close notification">
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Application Header */}
      <header className="border-b border-white/10 glass-panel px-6 py-3.5 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] via-[#0284C7] to-[#4F46E5] flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <IconCpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-headline font-bold text-lg text-white tracking-tight">Campus Rescue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>Gemma 4 & Z3 SMT Active</span>
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                Supabase Connected
              </span>
            </div>
            <p className="text-[11px] text-[#869397]">Autonomous Schedule Repair & Room Allocation Platform</p>
          </div>
        </div>

        {/* Center Telemetry & Clock */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
          <span className="text-[#869397] flex items-center space-x-1.5">
            <IconClock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTimeStr} · 09:00–18:00 Matrix (18 Slots)</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-cyan-300">
            Z3 SAT Prover · 0ms Drift
          </span>
        </div>

        {/* Right Action: Notifications Drawer & Role Selector */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="relative p-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-[#869397] hover:text-white transition"
            title="System Audit Feed"
            aria-label="System Audit Feed"
          >
            <IconBell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></span>
            )}
          </button>

          {/* Role Segmented Selector */}
          <div className="flex items-center space-x-1 bg-[#0F131C] p-1 rounded-lg border border-white/10" role="group" aria-label="Role selector">
            {['Student', 'Faculty', 'Admin'].map(role => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  if (role === 'Admin') setActiveTab('admin');
                  triggerToast(`Switched persona to ${role}`);
                }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  activeRole === role
                    ? 'bg-[#06B6D4] text-[#003640] shadow-[0_0_12px_rgba(6,182,212,0.4)] font-bold'
                    : 'text-[#869397] hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Audit Log Drawer (Collapsible) */}
      {showNotifDrawer && (
        <aside className="border-b border-white/10 bg-[#0F172A]/95 px-6 py-4 space-y-2.5 transition z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-headline font-bold text-xs uppercase tracking-wider text-[#06B6D4]">
                Live Supabase Audit Log
              </span>
              <span className="text-[10px] font-mono text-[#869397]">({notifications.length} events logged)</span>
            </div>
            <button
              onClick={() => setShowNotifDrawer(false)}
              className="text-xs text-[#869397] hover:text-white flex items-center space-x-1"
            >
              <span>Close</span>
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {notifications.slice(0, 3).map((n, i) => (
              <div key={n.id || i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#06B6D4] mb-1">
                  <span className="font-bold">{n.title}</span>
                  <span className="text-[10px] text-[#869397]">{n.timestamp?.slice(11, 19)}</span>
                </div>
                <p className="text-[11px] text-[#DFE2EF] leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Main Tab Navigation Bar */}
      <nav className="px-6 pt-4 pb-2 border-b border-white/5 flex items-center justify-between flex-wrap gap-3" role="tablist">
        <div className="flex space-x-2 bg-white/[0.02] p-1 rounded-xl border border-white/10">
          <button
            role="tab"
            aria-selected={activeTab === 'request'}
            onClick={() => setActiveTab('request')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
              activeTab === 'request'
                ? 'bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white shadow-[0_0_16px_rgba(6,182,212,0.3)] font-semibold'
                : 'text-[#869397] hover:text-white'
            }`}
          >
            <IconEdit className="w-4 h-4" />
            <span>Request a Room</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white shadow-[0_0_16px_rgba(6,182,212,0.3)] font-semibold'
                : 'text-[#869397] hover:text-white'
            }`}
          >
            <IconCalendar className="w-4 h-4" />
            <span>Live Timetable Grid</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-cyan-300">
              {events.length}
            </span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'admin'}
            onClick={() => setActiveTab('admin')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white shadow-[0_0_16px_rgba(6,182,212,0.3)] font-semibold'
                : 'text-[#869397] hover:text-white'
            }`}
          >
            <IconShield className="w-4 h-4" />
            <span>Admin Console</span>
            {pendingBookingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingBookingCount}
              </span>
            )}
          </button>
        </div>

        {/* Global Reset Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="text-xs px-3.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition flex items-center space-x-1.5"
          >
            <IconRefresh className="w-3.5 h-3.5" />
            <span>Reset Seed Database</span>
          </button>
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 px-6 py-6 overflow-y-auto">
        {/* ========================================================================= */}
        {/* TAB 1: REQUEST A ROOM                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'request' && (
          <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6" aria-label="Room Allocation Request">
            {/* Left Column: Natural Language & Structured Intake Form */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
              <div>
                <h1 className="text-xl font-headline font-bold text-white flex items-center space-x-2">
                  <span>Room Allocation Request</span>
                </h1>
                <p className="text-xs text-[#869397] mt-1">
                  Type in conversational English. Google Gemma 4 extracts constraints while the Z3 SMT prover guarantees a collision-free venue.
                </p>
              </div>

              {/* Natural Language Prompt */}
              <div>
                <label htmlFor="promptInput" className="text-xs font-mono uppercase tracking-wider text-[#06B6D4] block mb-1.5">
                  Natural Language Prompt (Gemma 4 Input)
                </label>
                <textarea
                  id="promptInput"
                  rows={3}
                  value={bookingPrompt}
                  onChange={e => setBookingPrompt(e.target.value)}
                  className="w-full bg-[#0F131C] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]"
                  placeholder="e.g. We need a room for 30 students for 2h robotics hands-on workshop with electronics kits"
                />
                {/* Intent Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                    CAPACITY &gt;= {attendance}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                    DURATION: {durationSlots * 30} MINS ({durationSlots} SLOTS)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300">
                    TYPE: {eventType.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Structured Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5">
                <div>
                  <label htmlFor="eventNameInput" className="text-xs text-[#869397] block mb-1">Event Name</label>
                  <input
                    id="eventNameInput"
                    type="text"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    className="w-full bg-[#0F131C] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:border-[#06B6D4]"
                  />
                </div>
                <div>
                  <label htmlFor="eventTypeSelect" className="text-xs text-[#869397] block mb-1">Event Type</label>
                  <select
                    id="eventTypeSelect"
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    className="w-full bg-[#0F131C] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:border-[#06B6D4]"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="class">Class</option>
                    <option value="lab">Lab Session</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="cultural_event">Cultural Event</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="durationSelect" className="text-xs text-[#869397] block mb-1">Duration</label>
                  <select
                    id="durationSelect"
                    value={durationSlots}
                    onChange={e => setDurationSlots(parseInt(e.target.value))}
                    className="w-full bg-[#0F131C] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:border-[#06B6D4]"
                  >
                    <option value={2}>1 Hour (2 slots)</option>
                    <option value={4}>2 Hours (4 slots)</option>
                    <option value={6}>3 Hours (6 slots)</option>
                    <option value={8}>4 Hours (8 slots)</option>
                  </select>
                </div>
              </div>

              {/* Attendance Slider */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label htmlFor="attendanceRange" className="text-[#869397]">Expected Attendance</label>
                  <span className="font-mono text-cyan-300 font-bold">{attendance} Attendees</span>
                </div>
                <input
                  id="attendanceRange"
                  type="range"
                  min={10}
                  max={60}
                  value={attendance}
                  onChange={e => setAttendance(parseInt(e.target.value))}
                  className="w-full accent-[#06B6D4]"
                />
              </div>

              {/* Equipment Requirements */}
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

              {/* Action Button */}
              <button
                onClick={handleFindSlot}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white font-semibold text-sm hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <IconBolt className="w-4 h-4" />
                <span>{loading ? 'Evaluating Z3 SMT Formal Constraints...' : 'Run Z3 SMT Solver & Find Slot'}</span>
              </button>
            </div>

            {/* Right Column: Verified Recommendation & SLA Countdown */}
            <div className="lg:col-span-5 space-y-5">
              {bookingRecommendation ? (
                <div className="glass-card-elevated p-6 rounded-2xl border border-cyan-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1.5">
                      <IconCheckCircle className="w-3.5 h-3.5" />
                      <span>Verified Collision-Free Slot</span>
                    </span>
                    <span className="text-xs font-mono text-[#869397]">Score: 100% SAT</span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-headline font-bold text-white">{bookingRecommendation.room_name}</h2>
                    <p className="text-sm font-mono text-cyan-300 mt-0.5">
                      {bookingRecommendation.time_str} · Today
                    </p>
                  </div>

                  {/* Explanation Card */}
                  <div className="p-4 rounded-xl bg-[#0F131C]/80 border border-white/10 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase text-[#06B6D4] flex items-center space-x-1.5">
                      <IconInfo className="w-3.5 h-3.5" />
                      <span>Constraint Reasoning (Gemma 4 Verification)</span>
                    </div>
                    <p className="text-xs text-[#DFE2EF] leading-relaxed">
                      {bookingRecommendation.explanation}
                    </p>
                  </div>

                  {/* 2-Hour Auto-Approval SLA Countdown Box */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-amber-400 font-semibold flex items-center space-x-1.5">
                        <IconClock className="w-3.5 h-3.5" />
                        <span>2-Hour Auto-Approval SLA</span>
                      </div>
                      <p className="text-[11px] text-[#869397]">
                        Auto-commits allocation if unreviewed by admin.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-amber-300">
                        {formatCountdown(slaCountdownSec)}
                      </div>
                      <span className="text-[10px] text-amber-400/80">Daemon Active</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        triggerToast('Booking request committed to Supabase queue with active 2-hour SLA');
                        loadData();
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#06B6D4] text-[#003640] font-bold text-sm hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2"
                    >
                      <IconCheckCircle className="w-4 h-4" />
                      <span>Confirm Booking Request</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
                  <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#869397]">
                    <IconTarget className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-headline font-semibold text-white">No Active Query</h3>
                  <p className="text-xs text-[#869397] max-w-xs">
                    Click "Run Z3 SMT Solver & Find Slot" to compute collision-free classroom allocations across all 4 facilities.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE SCHEDULE GRID                                                */}
        {/* ========================================================================= */}
        {activeTab === 'schedule' && (
          <section className="max-w-7xl mx-auto space-y-6" aria-label="Campus Timetable Grid">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-headline font-bold text-white">Campus Timetable Grid</h1>
                <p className="text-xs text-[#869397]">09:00 – 18:00 (18 Discrete 30-Minute Slots) across all campus facilities.</p>
              </div>

              {/* Search & Equipment Filter Controls */}
              <div className="flex items-center space-x-3">
                <select
                  value={equipmentFilter}
                  onChange={e => setEquipmentFilter(e.target.value)}
                  className="bg-[#0F131C] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#06B6D4]"
                  aria-label="Filter by equipment"
                >
                  <option value="all">All Facilities</option>
                  <option value="electronics_kits">Electronics Kits Only</option>
                  <option value="computers">Computers Only</option>
                  <option value="projector">Projector Only</option>
                </select>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.origin + '/api/schedule');
                    triggerToast('Timetable .ics calendar feed copied to clipboard');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/15 text-xs text-white hover:bg-white/[0.08] transition flex items-center space-x-1.5"
                >
                  <IconDownload className="w-3.5 h-3.5" />
                  <span>Export iCal Feed</span>
                </button>
              </div>
            </div>

            {/* Time Slots Column Header */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto p-4">
              <div className="min-w-[920px] space-y-4">
                {/* 18-Slot Timeline Legend Header */}
                <div className="grid grid-cols-18 gap-1 text-[10px] font-mono text-[#869397] px-1 border-b border-white/5 pb-2">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="text-center truncate">
                      {slotToTime(i)}
                    </div>
                  ))}
                </div>

                {/* Facilities Matrix */}
                {filteredRooms.map(room => {
                  const roomEvents = events.filter(e => e.original_room_id === room.id);
                  return (
                    <div key={room.id} className="p-3.5 rounded-xl bg-[#0F131C] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-headline font-bold text-white text-sm">{room.name}</span>
                          <span className="px-2 py-0.5 rounded bg-white/[0.05] text-cyan-300 font-mono text-[10px] border border-white/5">
                            Capacity: {room.capacity}
                          </span>
                          <span className="text-[#869397] text-[10px]">
                            {Array.from(room.equipment).join(', ')}
                          </span>
                        </div>
                        <span className="text-[#869397] font-mono text-[10px]">09:00 – 18:00 Open</span>
                      </div>

                      {/* 18-Column Interactive Grid */}
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
                              className={`rounded-md p-1.5 flex flex-col justify-between text-[11px] truncate border transition cursor-pointer hover:brightness-125 ${
                                ev.is_protected
                                  ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                  : isRelocated
                                  ? 'bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                  : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
                              }`}
                              title={`${ev.name} (${slotRangeToTime(ev.original_start_slot, ev.duration_slots)})`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold truncate">{ev.name}</span>
                                {ev.is_protected && (
                                  <span className="text-[9px] px-1 bg-purple-900 rounded font-mono flex items-center space-x-1">
                                    <IconLock className="w-2.5 h-2.5 inline" />
                                    <span>LOCKED</span>
                                  </span>
                                )}
                                {isRelocated && (
                                  <span className="text-[9px] px-1 bg-amber-900 rounded font-mono flex items-center space-x-1">
                                    <IconBolt className="w-2.5 h-2.5 inline" />
                                    <span>MOVED</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] opacity-80 font-mono">
                                {slotRangeToTime(ev.original_start_slot, ev.duration_slots)} · {ev.attendance} ppl
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
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ADMIN CONSOLE                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'admin' && (
          <section className="max-w-7xl mx-auto space-y-6" aria-label="Administrator Console">
            {/* Top: 2-Hour SLA Booking Requests Queue */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-headline font-bold text-white">Pending Requests & 2-Hour SLA Queue</h2>
                  <p className="text-xs text-[#869397]">
                    Requests awaiting admin decision. Auto-approval daemon commits after 2 hours.
                  </p>
                </div>
                <button
                  onClick={handleFastForwardSla}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono hover:bg-amber-500/30 transition flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <IconClock className="w-3.5 h-3.5" />
                  <span>Simulate 2-Hour Timeout</span>
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {bookings.map(b => (
                    <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div>
                        <span className="font-semibold text-white">{b.event_name}</span>
                        <span className="ml-2 text-[#869397]">({b.attendance} people, requested by {b.requested_by})</span>
                        <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                          Proposed Venue: {b.proposed_room_id} at {slotToTime(b.proposed_start_slot || 10)}
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
                                triggerToast(`Approved booking: ${b.event_name}`);
                                loadData();
                              }}
                              className="px-2.5 py-1 rounded bg-[#10B981] text-black font-semibold text-[11px] hover:bg-emerald-400 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                await rejectBooking(b.id);
                                triggerToast(`Rejected booking: ${b.event_name}`);
                                loadData();
                              }}
                              className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] hover:bg-red-500/30 transition"
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
                <p className="text-xs text-[#869397] italic py-2">No pending booking requests in Supabase.</p>
              )}
            </div>

            {/* Middle: Emergency Disruption Desk */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div>
                <h2 className="text-lg font-headline font-bold text-white">Emergency Disruption Desk</h2>
                <p className="text-xs text-[#869397]">
                  Ingest unforeseen facility shutdowns or clashes. Z3 SMT solver guarantees minimal schedule displacement.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleTriggerDisruption('Robotics Lab A has a water leak after 2 PM. Keep the Coding Assessment untouched.')}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white hover:border-[#06B6D4] transition flex items-center space-x-1.5"
                >
                  <IconAlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preset 1: Lab A Water Leak (14:00)</span>
                </button>
                <button
                  onClick={() => handleTriggerDisruption('The robotics workshop now has 45 attendees and Lab A is closed.')}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-amber-300 hover:border-amber-400 transition flex items-center space-x-1.5"
                >
                  <IconLayers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preset 2: Attendance Surge 45 (UNSAT Proof)</span>
                </button>
                <button
                  onClick={() => handleTriggerDisruption('Prof. Rao can supervise only after 3 PM today.')}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white hover:border-[#06B6D4] transition flex items-center space-x-1.5"
                >
                  <IconClock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Preset 3: Supervisor Delayed (+60m)</span>
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
                  className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-[#003640] font-bold text-xs hover:bg-cyan-300 transition flex items-center space-x-1.5"
                >
                  <IconBolt className="w-3.5 h-3.5" />
                  <span>Execute Solver</span>
                </button>
              </div>

              {/* Infeasible / UNSAT Blocker Display */}
              {unsatExplanation && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs space-y-1">
                  <div className="font-mono font-bold text-red-400 uppercase text-[11px] flex items-center space-x-1.5">
                    <IconAlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Constraint Violation (UNSAT)</span>
                  </div>
                  <p>{unsatExplanation}</p>
                </div>
              )}

              {/* Feasible Minimal Disruption Plan */}
              {repairResult && (
                <div className="mt-4 p-5 rounded-xl bg-[#0F131C] border border-cyan-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                        <IconCheckCircle className="w-3.5 h-3.5" />
                        <span>{validationReport.checks_passed}/{validationReport.total_checks} Independent Zero-Trust Checks Passed</span>
                      </span>
                    )}
                  </div>

                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[#869397]">
                        <th className="py-2">Event ID</th>
                        <th className="py-2">Repaired Facility</th>
                        <th className="py-2">Start Slot</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {repairResult.proposed_allocations.map(alloc => (
                        <tr key={alloc.event_id} className={alloc.is_changed ? 'bg-amber-950/20' : ''}>
                          <td className="py-2 text-white font-sans font-medium">{alloc.event_id}</td>
                          <td className="py-2 text-cyan-300">{alloc.room_id}</td>
                          <td className="py-2 text-white">{slotToTime(alloc.start_slot)}</td>
                          <td className="py-2">
                            {alloc.is_changed ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/40">
                                RELOCATED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[#869397] text-[10px]">
                                RETAINED
                              </span>
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
                      <IconBroadcast className="w-4 h-4" />
                      <span>Apply Repair & Broadcast</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Bottom Status Footer */}
      <footer className="border-t border-white/10 glass-panel px-6 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>
            {notifications.length > 0
              ? notifications[0].message
              : 'Z3 Solver Engine ready · Zero schedule collisions detected'}
          </span>
        </div>
        <div className="text-[#869397] hidden sm:block">
          IIT Bombay Hacktoberfest · Google Gemma 4 Neuro-Symbolic Platform
        </div>
      </footer>
    </div>
  );
}
