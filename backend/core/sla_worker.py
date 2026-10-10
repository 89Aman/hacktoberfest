from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from .schemas import BookingRequest, Event

def process_sla_auto_approvals(
    requests: List[BookingRequest],
    events: List[Event],
    current_time: datetime = None
) -> Tuple[List[BookingRequest], List[Dict[str, Any]]]:
    """
    Evaluates 2-Hour SLA expirations for proposed booking requests.
    Automatically assigns the best verified slot if administrator hasn't reviewed in 2 hours.
    Returns: (updated_requests, notifications_to_dispatch)
    """
    current_time = current_time or datetime.now(timezone.utc)
    notifications = []
    
    for req in requests:
        if req.status == "proposed":
            # Check if 2-hour SLA expired
            if current_time >= req.sla_expires_at:
                req.status = "auto_approved"
                req.auto_approved_at = current_time
                
                # Create notification payload
                notification = {
                    "request_id": req.id,
                    "event_name": req.event_name,
                    "assigned_room_id": req.proposed_room_id,
                    "assigned_start_slot": req.proposed_start_slot,
                    "requester": req.requested_by,
                    "type": "booking_auto_approved",
                    "title": f"Auto-Approved: '{req.event_name}'",
                    "message": (
                        f"Booking request for '{req.event_name}' was automatically approved and assigned to "
                        f"{req.proposed_room_id} at slot {req.proposed_start_slot} because the 2-hour admin SLA expired."
                    ),
                    "timestamp": current_time.isoformat()
                }
                notifications.append(notification)

    return requests, notifications
