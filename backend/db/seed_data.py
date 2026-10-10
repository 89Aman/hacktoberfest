from typing import List
from backend.core.schemas import Room, Event

def get_seeded_rooms() -> List[Room]:
    return [
        Room(
            id="lab_a",
            name="Robotics Lab A",
            capacity=40,
            equipment={"electronics_kits", "projector"},
            open_start=0,
            open_end=18
        ),
        Room(
            id="lab_b",
            name="Computer Lab B",
            capacity=45,
            equipment={"computers", "projector"},
            open_start=0,
            open_end=18
        ),
        Room(
            id="seminar_c",
            name="Seminar Room C",
            capacity=60,
            equipment={"projector"},
            open_start=0,
            open_end=18
        ),
        Room(
            id="lab_d",
            name="Maker Lab D",
            capacity=35,
            equipment={"electronics_kits", "projector"},
            open_start=0,
            open_end=18
        )
    ]

def get_seeded_events() -> List[Event]:
    return [
        Event(
            id="design_session",
            name="Design Session",
            attendance=20,
            duration_slots=2,  # 1 hour: 10:00–11:00
            required_equipment={"electronics_kits"},
            supervisor_id="rao",
            earliest_start=0,   # 09:00
            latest_end=6,       # 12:00
            original_room_id="lab_a",
            original_start_slot=2,  # 10:00
            is_protected=False
        ),
        Event(
            id="maker_intro",
            name="Maker Introduction",
            attendance=25,
            duration_slots=2,  # 1 hour: 13:00–14:00
            required_equipment={"electronics_kits"},
            supervisor_id="singh",
            earliest_start=8,   # 13:00
            latest_end=12,      # 15:00
            original_room_id="lab_d",
            original_start_slot=8,  # 13:00
            is_protected=False
        ),
        Event(
            id="robotics",
            name="Robotics Workshop",
            attendance=30,
            duration_slots=4,  # 2 hours: 14:00–16:00
            required_equipment={"electronics_kits"},
            supervisor_id="rao",
            earliest_start=8,   # 13:00
            latest_end=16,      # 17:00
            original_room_id="lab_a",
            original_start_slot=10, # 14:00
            is_protected=False
        ),
        Event(
            id="coding_assessment",
            name="Coding Assessment",
            attendance=40,
            duration_slots=4,  # 2 hours: 14:00–16:00
            required_equipment={"computers"},
            supervisor_id="mehta",
            earliest_start=10,  # 14:00
            latest_end=14,      # 16:00
            original_room_id="lab_b",
            original_start_slot=10, # 14:00
            is_protected=True
        ),
        Event(
            id="club_meeting",
            name="Club Planning Meeting",
            attendance=20,
            duration_slots=2,  # 1 hour: 14:00–15:00
            required_equipment=set(),
            supervisor_id=None,
            earliest_start=8,   # 13:00
            latest_end=16,      # 17:00
            original_room_id="seminar_c",
            original_start_slot=10, # 14:00
            is_protected=False
        ),
        Event(
            id="project_review",
            name="Project Review",
            attendance=25,
            duration_slots=2,  # 1 hour: 15:00–16:00
            required_equipment={"projector"},
            supervisor_id="das",
            earliest_start=10,  # 14:00
            latest_end=16,      # 17:00
            original_room_id="seminar_c",
            original_start_slot=12, # 15:00
            is_protected=False
        )
    ]
