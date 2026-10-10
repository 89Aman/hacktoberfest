import os
import json
from typing import Optional, Dict, Any, List, Tuple
from .schemas import DisruptionEnvelope, CloseRoomOp, ChangeAttendanceOp, DelaySupervisorOp, ProtectEventOp

# Prompt template for Gemma 4
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
