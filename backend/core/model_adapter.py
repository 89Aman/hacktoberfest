import os
import re
import json
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

try:
    from dotenv import load_dotenv
    base_dir = Path(__file__).resolve().parent.parent
    load_dotenv(base_dir / ".env")
    load_dotenv(base_dir.parent / ".env")
    load_dotenv()
except ImportError:
    pass

from .schemas import (
    DisruptionEnvelope, CloseRoomOp, ChangeAttendanceOp, DelaySupervisorOp, ProtectEventOp,
    BookingRequestCreate
)

# Prompt template for Gemma 4 Disruption Parsing
SYSTEM_PROMPT = """You are a formal campus disruption parser for Campus Rescue.
Your job is to translate the user's natural-language disruption or adjustment into an allowlisted JSON payload.

Available Room IDs: ['lab_a', 'lab_b', 'seminar_c', 'lab_d']
Available Event IDs: ['robotics', 'coding_assessment', 'club_meeting', 'maker_intro', 'project_review', 'design_session']
Available Supervisor IDs: ['rao', 'mehta', 'singh', 'das']

Allowed Operations:
1. close_room: {"type": "close_room", "room_id": "<id>", "start_slot": <int>, "end_slot": <int>}
2. change_attendance: {"type": "change_attendance", "event_id": "<id>", "new_attendance": <int>}
3. delay_supervisor: {"type": "delay_supervisor", "supervisor_id": "<id>", "available_after_slot": <int>}
4. protect_event: {"type": "protect_event", "event_id": "<id>"}

Time Slot Mapping (30-min intervals, 09:00–18:00):
- 0 = 09:00, 2 = 10:00, 4 = 11:00, 6 = 12:00, 8 = 13:00, 10 = 14:00, 12 = 15:00, 14 = 16:00, 16 = 17:00, 18 = 18:00.
- If user mentions times like "2 PM" or "14:00", map to slot 10.
- If user mentions times like "3 PM" or "15:00", map to slot 12.

Output JSON Envelope Schema:
{
  "status": "ready" | "needs_clarification" | "unsupported",
  "operations": [ ...list of operations... ],
  "clarification_question": string or null
}

If information is missing, ambiguous, or refers to unknown rooms/people, return "status": "needs_clarification" with a concise question.
Never invent rooms or supervisors. Output JSON ONLY, with NO extra text or markdown fences.
"""

BOOKING_PROMPT = """You are a campus event request parser for Campus Rescue.
Your job is to translate the user's natural-language room request into a JSON object conforming to:
{
  "requested_by": string,
  "event_name": string,
  "event_type": "class" | "lab" | "workshop" | "hackathon" | "cultural_event" | "exam",
  "date": "2026-10-10",
  "attendance": int,
  "duration_slots": int,
  "setup_buffer_slots": int,
  "cleanup_buffer_slots": int,
  "preferred_start_slot": int or null,
  "allow_time_suggestion": true,
  "required_equipment": [ ...strings: "electronics_kits", "computers", "projector"... ],
  "priority": "low" | "medium" | "high",
  "accessibility_needed": false
}

Time Slot Mapping (30-min intervals, 09:00–18:00):
- 0 = 09:00, 2 = 10:00, 4 = 11:00, 6 = 12:00, 8 = 13:00, 10 = 14:00, 12 = 15:00, 14 = 16:00, 16 = 17:00, 18 = 18:00.
1 hour = 2 slots, 2 hours = 4 slots, 3 hours = 6 slots.

Output JSON ONLY with NO markdown fences.
"""

class GemmaModelAdapter:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemma-4-26b-a4b-it"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMMA_MODEL_NAME", model_name)
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Warning: Failed to initialize Google GenAI Client: {e}")
                self.client = None

    def parse_disruption(self, user_text: str) -> Tuple[DisruptionEnvelope, str]:
        """
        Parses natural language disruption text using Gemma 4 API.
        Falls back to rule-based parser if API is not configured or fails.
        Returns: (envelope, mode_used: 'Live Gemma 4' | 'Structured Fallback')
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=f"{SYSTEM_PROMPT}\n\nUser request: \"{user_text}\"",
                    config={
                        "temperature": 0.0,
                        "response_mime_type": "application/json"
                    }
                )
                raw_json = response.text.strip()
                # Clean up any unexpected markdown formatting
                if raw_json.startswith("```json"):
                    raw_json = raw_json[7:]
                if raw_json.endswith("```"):
                    raw_json = raw_json[:-3]
                
                parsed_dict = json.loads(raw_json.strip())
                envelope = DisruptionEnvelope.model_validate(parsed_dict)
                return envelope, f"Live Gemma 4 ({self.model_name})"
            except Exception as e:
                print(f"Gemma 4 generation failed, falling back: {e}")

        # Fallback heuristic parser
        return self._heuristic_fallback_parse(user_text), "Structured Fallback Mode"

    def _heuristic_fallback_parse(self, text: str) -> DisruptionEnvelope:
        text_lower = text.lower()

        # Preset 1: Lab A closure after 2 PM + protect assessment
        if "lab a" in text_lower and ("close" in text_lower or "leak" in text_lower or "shut" in text_lower):
            ops = [
                CloseRoomOp(room_id="lab_a", start_slot=10, end_slot=18)
            ]
            if "coding" in text_lower or "assessment" in text_lower or "protect" in text_lower:
                ops.append(ProtectEventOp(event_id="coding_assessment"))
            return DisruptionEnvelope(status="ready", operations=ops)

        # Preset 2: Attendance increase
        if "attend" in text_lower and ("robotics" in text_lower or "workshop" in text_lower):
            # Extract number
            words = text_lower.split()
            count = 38
            for w in words:
                if w.isdigit():
                    count = int(w)
                    break
            ops = [ChangeAttendanceOp(event_id="robotics", new_attendance=count)]
            if "lab a" in text_lower and "close" in text_lower:
                ops.append(CloseRoomOp(room_id="lab_a", start_slot=10, end_slot=18))
            return DisruptionEnvelope(status="ready", operations=ops)

        # Preset 3: Supervisor delay
        if "rao" in text_lower and ("delay" in text_lower or "late" in text_lower or "after" in text_lower):
            return DisruptionEnvelope(
                status="ready",
                operations=[DelaySupervisorOp(supervisor_id="rao", available_after_slot=12)]
            )

        # Protect event standalone
        if "protect" in text_lower and "coding" in text_lower:
            return DisruptionEnvelope(
                status="ready",
                operations=[ProtectEventOp(event_id="coding_assessment")]
            )

        return DisruptionEnvelope(
            status="needs_clarification",
            clarification_question="Could not safely parse disruption. Please specify which room, event, or supervisor is affected and the time window."
        )

    def parse_booking_request(self, user_text: str, requested_by: str = "Student Organizer") -> Tuple[BookingRequestCreate, str]:
        """
        Parses natural language booking request into BookingRequestCreate using Gemma 4.
        Falls back to rule-based heuristic extraction if API is unavailable.
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=f"{BOOKING_PROMPT}\n\nUser request: \"{user_text}\"",
                    config={
                        "temperature": 0.0,
                        "response_mime_type": "application/json"
                    }
                )
                raw_json = response.text.strip()
                if raw_json.startswith("```json"):
                    raw_json = raw_json[7:]
                if raw_json.endswith("```"):
                    raw_json = raw_json[:-3]
                parsed_dict = json.loads(raw_json.strip())
                if "requested_by" not in parsed_dict or not parsed_dict["requested_by"]:
                    parsed_dict["requested_by"] = requested_by
                if "date" not in parsed_dict or not parsed_dict["date"]:
                    parsed_dict["date"] = "2026-10-10"
                if "required_equipment" in parsed_dict and isinstance(parsed_dict["required_equipment"], list):
                    parsed_dict["required_equipment"] = set(parsed_dict["required_equipment"])
                req = BookingRequestCreate.model_validate(parsed_dict)
                return req, f"Live Gemma 4 ({self.model_name})"
            except Exception as e:
                print(f"Gemma 4 booking parsing failed, falling back: {e}")

        return self._heuristic_fallback_parse_booking(user_text, requested_by), "Structured Fallback Mode"

    def _heuristic_fallback_parse_booking(self, text: str, requested_by: str = "Student Organizer") -> BookingRequestCreate:
        text_lower = text.lower()

        # 1. Attendance extraction
        attendance = 30
        att_match = re.search(r'(\d+)\s*(?:people|students|attendees|participants|pax|seats)?', text_lower)
        if att_match:
            val = int(att_match.group(1))
            if 0 < val <= 200:
                attendance = val

        # 2. Duration extraction (each slot is 30 mins)
        duration_slots = 4  # default 2h
        if "30 min" in text_lower or "half hour" in text_lower:
            duration_slots = 1
        elif "1 hour" in text_lower or "1-hour" in text_lower or "60 min" in text_lower:
            duration_slots = 2
        elif "1.5 hour" in text_lower or "90 min" in text_lower:
            duration_slots = 3
        elif "2 hour" in text_lower or "2-hour" in text_lower or "120 min" in text_lower:
            duration_slots = 4
        elif "3 hour" in text_lower or "3-hour" in text_lower:
            duration_slots = 6
        elif "4 hour" in text_lower or "4-hour" in text_lower:
            duration_slots = 8

        # 3. Equipment extraction
        equipment = set()
        if any(w in text_lower for w in ["electronic", "kit", "hardware", "robot", "soldering"]):
            equipment.add("electronics_kits")
        if any(w in text_lower for w in ["computer", "pc", "laptop", "workstation", "coding"]):
            equipment.add("computers")
        if any(w in text_lower for w in ["projector", "screen", "slides", "display"]):
            equipment.add("projector")

        # 4. Preferred Start Slot extraction
        pref_slot = None
        time_map = {
            "9:00": 0, "9 am": 0, "9am": 0,
            "9:30": 1,
            "10:00": 2, "10 am": 2, "10am": 2,
            "10:30": 3,
            "11:00": 4, "11 am": 4, "11am": 4,
            "11:30": 5,
            "12:00": 6, "12 pm": 6, "12pm": 6, "noon": 6,
            "12:30": 7,
            "13:00": 8, "1 pm": 8, "1pm": 8,
            "13:30": 9, "1:30": 9,
            "14:00": 10, "2 pm": 10, "2pm": 10,
            "14:30": 11, "2:30": 11,
            "15:00": 12, "3 pm": 12, "3pm": 12,
            "15:30": 13, "3:30": 13,
            "16:00": 14, "4 pm": 14, "4pm": 14,
            "16:30": 15, "4:30": 15,
            "17:00": 16, "5 pm": 16, "5pm": 16,
        }
        for pattern, slot in time_map.items():
            if pattern in text_lower:
                pref_slot = slot
                break

        # 5. Event Type
        event_type = "workshop"
        if "exam" in text_lower or "test" in text_lower:
            event_type = "exam"
        elif "hackathon" in text_lower:
            event_type = "hackathon"
        elif "class" in text_lower or "lecture" in text_lower:
            event_type = "class"
        elif "lab" in text_lower:
            event_type = "lab"

        # 6. Event Name
        name_clean = text.strip()
        if len(name_clean) > 40:
            name_clean = name_clean[:37] + "..."

        return BookingRequestCreate(
            requested_by=requested_by,
            event_name=name_clean,
            event_type=event_type,
            date="2026-10-10",
            attendance=attendance,
            duration_slots=duration_slots,
            preferred_start_slot=pref_slot,
            required_equipment=equipment
        )
