import os
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from backend.core.schemas import Room, Event, BookingRequest
from backend.db.seed_data import get_seeded_rooms, get_seeded_events

class DatabaseManager:
    """
    Manages persistence with Supabase when configured,
    or falls back to an in-memory database initialized with seeded demo records.
    """
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.client = None

        if self.supabase_url and self.supabase_key:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                print("Connected to Supabase database.")
            except Exception as e:
                print(f"Failed to connect to Supabase: {e}. Using in-memory fallback.")
                self.client = None

        # In-memory store
        self._rooms: Dict[str, Room] = {r.id: r for r in get_seeded_rooms()}
        self._events: Dict[str, Event] = {e.id: e for e in get_seeded_events()}
        self._booking_requests: Dict[str, BookingRequest] = {}
        self._notifications: List[Dict[str, Any]] = []

    def get_rooms(self) -> List[Room]:
        if self.client:
            try:
                res = self.client.table("rooms").select("*").execute()
                if res.data:
                    return [Room(**r) for r in res.data]
            except Exception as e:
                print(f"Supabase fetch rooms failed: {e}")
        return list(self._rooms.values())

    def get_events(self) -> List[Event]:
        if self.client:
            try:
                res = self.client.table("events").select("*").execute()
                if res.data:
                    return [Event(**e) for e in res.data]
            except Exception as e:
                print(f"Supabase fetch events failed: {e}")
        return list(self._events.values())

    def update_event_allocation(self, event_id: str, new_room_id: str, new_start_slot: int):
        if event_id in self._events:
            self._events[event_id].original_room_id = new_room_id
            self._events[event_id].original_start_slot = new_start_slot

        if self.client:
            try:
                self.client.table("events").update({
                    "original_room_id": new_room_id,
                    "original_start_slot": new_start_slot
                }).eq("id", event_id).execute()
            except Exception as e:
                print(f"Supabase update event failed: {e}")

    def create_booking_request(self, req: BookingRequest) -> BookingRequest:
        self._booking_requests[req.id] = req
        if self.client:
            try:
                self.client.table("booking_requests").insert(req.model_dump(mode="json")).execute()
            except Exception as e:
                print(f"Supabase insert booking failed: {e}")
        return req

    def get_booking_requests(self) -> List[BookingRequest]:
        if self.client:
            try:
                res = self.client.table("booking_requests").select("*").execute()
                if res.data:
                    return [BookingRequest(**r) for r in res.data]
            except Exception as e:
                print(f"Supabase fetch bookings failed: {e}")
        return list(self._booking_requests.values())

    def update_booking_status(self, request_id: str, status: str, approved_by: Optional[str] = None):
        if request_id in self._booking_requests:
            req = self._booking_requests[request_id]
            req.status = status
            req.approved_by = approved_by
            if status in ["approved", "auto_approved"] and req.proposed_room_id and req.proposed_start_slot is not None:
                # Add committed event to active schedule
                new_event = Event(
                    id=f"event_{req.id}",
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
                self._events[new_event.id] = new_event

        if self.client:
            try:
                self.client.table("booking_requests").update({
                    "status": status,
                    "approved_by": approved_by
                }).eq("id", request_id).execute()
            except Exception as e:
                print(f"Supabase update booking failed: {e}")

    def add_notification(self, notification: Dict[str, Any]):
        self._notifications.insert(0, notification)
        if self.client:
            try:
                self.client.table("notification_log").insert(notification).execute()
            except Exception as e:
                print(f"Supabase insert notification failed: {e}")

    def get_notifications(self) -> List[Dict[str, Any]]:
        return self._notifications

    def reset_to_seed(self):
        """Restores in-memory state to seeded baseline."""
        self._rooms = {r.id: r for r in get_seeded_rooms()}
        self._events = {e.id: e for e in get_seeded_events()}
        self._booking_requests.clear()
        self._notifications.clear()

db = DatabaseManager()
