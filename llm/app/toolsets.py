"""Tool surfaces exposed to Needle 3.

Design follows the Cactus guide for tool design:
one tool per action, names a user would say, argument formats spelled
out in descriptions, closed sets as enums, bounded numbers.
"""


def _tool(name, description, properties, required):
    return {
        "name": name,
        "description": description,
        "parameters": {
            "type": "object",
            "properties": properties,
            "required": required,
        },
    }


TOOLSETS = {
    "smart_home": {
        "label": "Smart home",
        "description": "Lights, thermostat, door locks, robot vacuum, security panel.",
        "tools": [
            _tool(
                "set_lights",
                "Turn the lights in a room on or off, optionally setting brightness as a percentage.",
                {
                    "room": {"type": "string", "description": "Room name, e.g. kitchen, bedroom, living room"},
                    "on": {"type": "boolean", "description": "True to turn the lights on, false to turn them off"},
                    "brightness": {"type": "integer", "minimum": 0, "maximum": 100,
                                   "description": "Brightness in percent, only when the user names a level"},
                },
                ["room", "on"],
            ),
            _tool(
                "set_thermostat",
                "Set the target temperature of the thermostat.",
                {
                    "temperature": {"type": "integer", "minimum": 10, "maximum": 32,
                                    "description": "Target temperature in degrees Celsius"},
                    "mode": {"type": "string", "enum": ["heat", "cool", "auto"],
                             "description": "Thermostat mode, only when the user names one"},
                },
                ["temperature"],
            ),
            _tool(
                "lock_door",
                "Lock or unlock a door.",
                {
                    "door": {"type": "string", "description": "Door name, e.g. front door, garage"},
                    "lock": {"type": "boolean", "description": "True to lock, false to unlock"},
                },
                ["door", "lock"],
            ),
            _tool(
                "start_cleaning",
                "Start the robot vacuum cleaning a room.",
                {
                    "room": {"type": "string", "description": "Room to clean, e.g. kitchen"},
                },
                ["room"],
            ),
            _tool(
                "arm_security",
                "Arm or disarm the security system.",
                {
                    "armed": {"type": "boolean", "description": "True to arm, false to disarm"},
                    "mode": {"type": "string", "enum": ["home", "away"],
                             "description": "Arming mode, only when the user names one"},
                },
                ["armed"],
            ),
        ],
    },
    "media_player": {
        "label": "Media player",
        "description": "Playback of music and video, volume, playlists.",
        "tools": [
            _tool(
                "play_media",
                "Play a song, album or video by title.",
                {
                    "title": {"type": "string", "description": "Title of the song, album or video"},
                    "artist": {"type": "string", "description": "Artist or channel name, only when stated"},
                    "service": {"type": "string", "enum": ["spotify", "youtube", "radio"],
                                "description": "Service to play on, only when the user names one"},
                },
                ["title"],
            ),
            _tool(
                "control_playback",
                "Control playback: play, pause, stop, or skip to the next or previous track.",
                {
                    "action": {"type": "string", "enum": ["play", "pause", "stop", "next", "previous"],
                               "description": "The playback action"},
                },
                ["action"],
            ),
            _tool(
                "set_volume",
                "Set the playback volume.",
                {
                    "level": {"type": "integer", "minimum": 0, "maximum": 100,
                              "description": "Volume in percent"},
                },
                ["level"],
            ),
            _tool(
                "add_to_playlist",
                "Add a track to a named playlist.",
                {
                    "playlist": {"type": "string", "description": "Playlist name"},
                    "title": {"type": "string", "description": "Track title to add"},
                },
                ["playlist", "title"],
            ),
        ],
    },
    "productivity": {
        "label": "Productivity",
        "description": "Calendar, tasks, reminders, notes, e-mail.",
        "tools": [
            _tool(
                "schedule_meeting",
                "Schedule a meeting on the calendar.",
                {
                    "title": {"type": "string", "description": "Meeting title"},
                    "date": {"type": "string", "format": "date",
                             "description": "Meeting date in YYYY-MM-DD format"},
                    "time": {"type": "string", "format": "time",
                             "description": "Start time in HH:MM 24-hour format"},
                    "duration_minutes": {"type": "integer", "minimum": 5, "maximum": 480,
                                         "description": "Duration in minutes, only when stated"},
                    "attendees": {"type": "array", "items": {"type": "string"},
                                  "description": "Attendee names or e-mails, only when stated"},
                },
                ["title", "date", "time"],
            ),
            _tool(
                "send_email",
                "Send an e-mail.",
                {
                    "to": {"type": "string", "description": "Recipient e-mail address"},
                    "subject": {"type": "string", "description": "Subject line"},
                    "body": {"type": "string", "description": "Message body text"},
                },
                ["to", "subject", "body"],
            ),
            _tool(
                "create_task",
                "Create a task on the to-do list.",
                {
                    "title": {"type": "string", "description": "Task title"},
                    "due_date": {"type": "string", "format": "date",
                                 "description": "Due date in YYYY-MM-DD format, only when stated"},
                },
                ["title"],
            ),
            _tool(
                "set_reminder",
                "Set a reminder at a given time.",
                {
                    "text": {"type": "string", "description": "What to remind about"},
                    "time": {"type": "string", "format": "time",
                             "description": "Reminder time in HH:MM 24-hour format"},
                },
                ["text", "time"],
            ),
            _tool(
                "search_notes",
                "Search the user's personal notes.",
                {
                    "query": {"type": "string", "description": "Search query text"},
                },
                ["query"],
            ),
        ],
    },
    "messaging": {
        "label": "Messaging & payments",
        "description": "Messages, money transfers, taxi ordering.",
        "tools": [
            _tool(
                "send_message",
                "Send a text message to a contact.",
                {
                    "contact": {"type": "string", "description": "Contact name"},
                    "message": {"type": "string", "description": "Message text"},
                    "platform": {"type": "string", "enum": ["telegram", "whatsapp", "sms"],
                                 "description": "Messaging platform, only when the user names one"},
                },
                ["contact", "message"],
            ),
            _tool(
                "send_money",
                "Send money to a person by handle.",
                {
                    "amount": {"type": "number", "minimum": 1, "maximum": 10000,
                               "description": "Amount to send"},
                    "to": {"type": "string", "description": "Recipient handle, e.g. @maria"},
                },
                ["amount", "to"],
            ),
            _tool(
                "book_ride",
                "Book a taxi ride.",
                {
                    "pickup": {"type": "string", "description": "Pickup address"},
                    "destination": {"type": "string", "description": "Destination address"},
                    "ride_type": {"type": "string", "enum": ["economy", "comfort", "xl"],
                                  "description": "Ride class, only when the user names one"},
                },
                ["pickup", "destination"],
            ),
        ],
    },
}
