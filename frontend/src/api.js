const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchSchedule() {
  const res = await fetch(`${API_BASE}/schedule`);
  return res.json();
}

export async function fetchRooms() {
  const res = await fetch(`${API_BASE}/rooms`);
  return res.json();
}

export async function requestBooking({ requested_by, prompt, structured }) {
  const res = await fetch(`${API_BASE}/bookings/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requested_by, prompt, structured })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Booking request failed');
  }
  return res.json();
}

export async function fetchBookings() {
  const res = await fetch(`${API_BASE}/bookings`);
  return res.json();
}

export async function approveBooking(id) {
  const res = await fetch(`${API_BASE}/bookings/${id}/approve`, { method: 'POST' });
  return res.json();
}

export async function rejectBooking(id) {
  const res = await fetch(`${API_BASE}/bookings/${id}/reject`, { method: 'POST' });
  return res.json();
}

export async function runSlaCheck(fastForwardHours = 0) {
  const res = await fetch(`${API_BASE}/admin/sla-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fast_forward_hours: fastForwardHours })
  });
  return res.json();
}

export async function repairDisruption({ natural_language_prompt, operations }) {
  const res = await fetch(`${API_BASE}/disruptions/repair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ natural_language_prompt, operations })
  });
  return res.json();
}

export async function applyRepair(allocations) {
  const res = await fetch(`${API_BASE}/disruptions/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allocations })
  });
  return res.json();
}

export async function resetSchedule() {
  const res = await fetch(`${API_BASE}/admin/reset`, { method: 'POST' });
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`);
  return res.json();
}
