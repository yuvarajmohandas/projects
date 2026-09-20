"""Simple AI router stub for the travel assistant demo."""

from typing import Any, Dict, List, Optional


def parse_user_prompt(prompt: str, session_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Parse the user prompt and return a structured action payload."""
    if session_history is None:
        session_history = []

    normalized = prompt.strip().lower()

    if not normalized:
        return {
            "action": "policy_reply",
            "reply": "I did not receive any content. Please send your travel request again."
        }

    if any(keyword in normalized for keyword in ["book", "reserve", "travel", "flight", "hotel"]):
        return {
            "action": "create",
            "payload": {
                "request": prompt,
                "history": session_history,
            }
        }

    return {
        "action": "policy_reply",
        "reply": "Thanks for your message. Tell me more about your travel dates, destination, and contact details."
    }
