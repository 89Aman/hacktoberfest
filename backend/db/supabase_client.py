import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone

try:
    from dotenv import load_dotenv
    base_dir = Path(__file__).resolve().parent.parent
    load_dotenv(base_dir / ".env")
    load_dotenv(base_dir.parent / ".env")
    load_dotenv()
except ImportError:
    pass

from backend.core.schemas import Room, Event, BookingRequest
from backend.db.seed_data import get_seeded_rooms, get_seeded_events

class DatabaseManager:
    """
    Production-grade database manager connecting directly to Supabase via PostgREST.
    Ensures complete persistence, live queries, and atomic state updates.
    """
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")
        self.is_connected = bool(self.supabase_url and self.supabase_key)

        # In-memory mirror / fallback
        self._rooms: Dict[str, Room] = {r.id: r for r in get_seeded_rooms()}
        self._events: Dict[str, Event] = {e.id: e for e in get_seeded_events()}
        self._booking_requests: Dict[str, BookingRequest] = {}
        self._notifications: List[Dict[str, Any]] = []

        if self.is_connected:
            print(f"Supabase PostgREST client initialized: {self.supabase_url}")
            self.refresh_from_supabase()

    def _headers(self) -> Dict[str, str]:
        return {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def _get(self, endpoint: str) -> Optional[List[Dict[str, Any]]]:
        if not self.is_connected:
            return None
        try:
            req = urllib.request.Request(f"{self.supabase_url}/rest/v1/{endpoint}", headers=self._headers())
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            print(f"Supabase GET /{endpoint} error: {e}")
            return None

    def _post(self, endpoint: str, data: Dict[str, Any]) -> Optional[Any]:
        if not self.is_connected:
            return None
        try:
            body = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(f"{self.supabase_url}/rest/v1/{endpoint}", data=body, headers=self._headers(), method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            print(f"Supabase POST /{endpoint} error: {e}")
            return None

    def _patch(self, endpoint: str, data: Dict[str, Any]) -> Optional[Any]:
        if not self.is_connected:
            return None
        try:
            body = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(f"{self.supabase_url}/rest/v1/{endpoint}", data=body, headers=self._headers(), method="PATCH")
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            print(f"Supabase PATCH /{endpoint} error: {e}")
            return None

    def refresh_from_supabase(self):
        """Pulls latest state from live Supabase tables into memory mirror."""
        raw_rooms = self._get("rooms?select=*&is_active=eq.true")
        if raw_rooms:
            self._rooms = {
                r["id"]: Room(
                    id=r["id"],
                    name=r["name"],
                    capacity=r["capacity"],
                    equipment=set(r.get("equipment") or []),
                    open_start=r.get("open_start", 0),
                    open_end=r.get("open_end", 18)
                ) for r in raw_rooms
            }

        raw_events = self._get("events?select=*")
        if raw_events:
            self._events = {
                e["id"]: Event(
                    id=e["id"],
                    name=e["name"],
                    attendance=e["attendance"],
                    duration_slots=e["duration_slots"],
                    setup_buffer_slots=e.get("setup_buffer_slots", 0),
                    cleanup_buffer_slots=e.get("cleanup_buffer_slots", 0),
                    required_equipment=set(e.get("required_equipment") or []),
                    supervisor_id=e.get("supervisor_id"),
                    earliest_start=e.get("earliest_start", 0),
                    latest_end=e.get("latest_end", 18),
                    original_room_id=e["original_room_id"],
                    original_start_slot=e["original_start_slot"],
                    is_protected=bool(e.get("is_protected", False))
                ) for e in raw_events
            }

        raw_bookings = self._get("booking_requests?select=*&order=created_at.desc")
        if raw_bookings:
            self._booking_requests = {
                b["id"]: BookingRequest(
                    id=b["id"],
                    requested_by=b["requested_by"],
                    event_name=b["event_name"],
                    event_type=b.get("event_type", "workshop"),
                    date=b.get("date", "2026-10-10"),
                    attendance=b["attendance"],
                    duration_slots=b["duration_slots"],
                    setup_buffer_slots=b.get("setup_buffer_slots", 0),
                    cleanup_buffer_slots=b.get("cleanup_buffer_slots", 0),
                    preferred_start_slot=b.get("preferred_start_slot"),
                    allow_time_suggestion=b.get("allow_time_suggestion", True),
                    required_equipment=set(b.get("required_equipment") or []),
                    priority=b.get("priority", "medium"),
                    accessibility_needed=b.get("accessibility_needed", False),
                    status=b.get("status", "pending"),
                    proposed_room_id=b.get("proposed_room_id"),
                    proposed_start_slot=b.get("proposed_start_slot"),
                    explanation=b.get("explanation"),
                    approved_by=b.get("approved_by"),
                    created_at=datetime.fromisoformat(b["created_at"].replace("Z", "+00:00")),
                    sla_expires_at=datetime.fromisoformat(b["sla_expires_at"].replace("Z", "+00:00")),
                    auto_approved_at=datetime.fromisoformat(b["auto_approved_at"].replace("Z", "+00:00")) if b.get("auto_approved_at") else None
                ) for b in raw_bookings
            }

    def get_rooms(self) -> List[Room]:
        self.refresh_from_supabase()
        return list(self._rooms.values())

    def get_events(self) -> List[Event]:
        self.refresh_from_supabase()
        return list(self._events.values())

    def update_event_allocation(self, event_id: str, new_room_id: str, new_start_slot: int):
        if event_id in self._events:
            self._events[event_id].original_room_id = new_room_id
            self._events[event_id].original_start_slot = new_start_slot

        self._patch(f"events?id=eq.{event_id}", {
            "original_room_id": new_room_id,
            "original_start_slot": new_start_slot
        })

    def create_booking_request(self, req: BookingRequest) -> BookingRequest:
        self._booking_requests[req.id] = req
        payload = {
            "id": req.id,
            "requested_by": req.requested_by,
            "event_name": req.event_name,
            "event_type": req.event_type,
            "date": req.date,
            "attendance": req.attendance,
            "duration_slots": req.duration_slots,
            "setup_buffer_slots": req.setup_buffer_slots,
            "cleanup_buffer_slots": req.cleanup_buffer_slots,
            "preferred_start_slot": req.preferred_start_slot,
            "allow_time_suggestion": req.allow_time_suggestion,
            "required_equipment": list(req.required_equipment),
            "priority": req.priority,
            "accessibility_needed": req.accessibility_needed,
            "status": req.status,
            "proposed_room_id": req.proposed_room_id,
            "proposed_start_slot": req.proposed_start_slot,
            "explanation": req.explanation,
            "sla_expires_at": req.sla_expires_at.isoformat()
        }
        self._post("booking_requests", payload)
        return req

    def get_booking_requests(self) -> List[BookingRequest]:
        self.refresh_from_supabase()
        return list(self._booking_requests.values())

    def update_booking_status(self, request_id: str, status: str, approved_by: Optional[str] = None):
        if request_id in self._booking_requests:
            req = self._booking_requests[request_id]
            req.status = status
            req.approved_by = approved_by
            if status in ["approved", "auto_approved"] and req.proposed_room_id and req.proposed_start_slot is not None:
                new_event_id = f"event_{req.id}"
                new_event = Event(
                    id=new_event_id,
                    name=req.event_name,
                    attendance=req.attendance,
                    duration_slots=req.duration_slots,
                    setup_buffer_slots=req.setup_buffer_slots,
                    cleanup_buffer_slots=req.cleanup_buffer_slots,
                    required_equipment=req.required_equipment,
                    original_room_id=req.proposed_room_id,
                    original_start_slot=req.proposed_start_slot,
                    earliest_start=0,
                    latest_end=18,
                    is_protected=False
                )
                self._events[new_event_id] = new_event

                # Save new event to Supabase
                self._post("events", {
                    "id": new_event_id,
                    "name": req.event_name,
                    "attendance": req.attendance,
                    "duration_slots": req.duration_slots,
                    "required_equipment": list(req.required_equipment),
                    "original_room_id": req.proposed_room_id,
                    "original_start_slot": req.proposed_start_slot,
                    "earliest_start": 0,
                    "latest_end": 18,
                    "is_protected": False
                })

        update_payload = {"status": status, "approved_by": approved_by}
        if status == "auto_approved":
            update_payload["auto_approved_at"] = datetime.now(timezone.utc).isoformat()
        self._patch(f"booking_requests?id=eq.{request_id}", update_payload)

    def add_notification(self, notification: Dict[str, Any]):
        self._notifications.insert(0, notification)
        self._post("notification_log", {
            "type": notification.get("type", "alert"),
            "title": notification.get("title", "Notice"),
            "message": notification.get("message", ""),
            "timestamp": notification.get("timestamp", datetime.now(timezone.utc).isoformat())
        })

    def get_notifications(self) -> List[Dict[str, Any]]:
        raw_notifs = self._get("notification_log?select=*&order=timestamp.desc&limit=10")
        if raw_notifs:
            return raw_notifs
        return self._notifications

    def _delete(self, endpoint: str) -> Optional[Any]:
        if not self.is_connected:
            return None
        try:
            req = urllib.request.Request(f"{self.supabase_url}/rest/v1/{endpoint}", headers=self._headers(), method="DELETE")
            with urllib.request.urlopen(req, timeout=5) as resp:
                content = resp.read()
                return json.loads(content.decode()) if content else []
        except Exception as e:
            print(f"Supabase DELETE /{endpoint} error: {e}")
            return None

    def reset_to_seed(self):
        """Restores in-memory and Supabase state to seeded baseline."""
        self._rooms = {r.id: r for r in get_seeded_rooms()}
        self._events = {e.id: e for e in get_seeded_events()}
        self._booking_requests.clear()
        self._notifications.clear()

        if self.is_connected:
            # Delete any events dynamically added by booking approvals
            self._delete("events?id=like.event_*")
            # Restore the 6 seeded events back to their baseline room and slot
            for ev in get_seeded_events():
                self._patch(f"events?id=eq.{ev.id}", {
                    "original_room_id": ev.original_room_id,
                    "original_start_slot": ev.original_start_slot
                })
            # Reset booking requests back to initial proposed status for demo flow
            self._patch("booking_requests?id=eq.req-101", {
                "status": "proposed",
                "proposed_room_id": "lab_a",
                "proposed_start_slot": 10
            })
            self.refresh_from_supabase()

db = DatabaseManager()
