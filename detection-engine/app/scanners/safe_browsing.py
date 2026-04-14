import os
import requests

API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "").strip()

def check_safe_browsing(url: str) -> dict:
    if not API_KEY:
        return {"error": "No API key configured", "is_threat": False}

    endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={API_KEY}"

    payload = {
        "client": {
            "clientId": "cybershield",
            "clientVersion": "1.0"
        },
        "threatInfo": {
            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION"
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}]
        }
    }

    try:
        response = requests.post(endpoint, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        return {
            "is_threat": bool(data.get("matches")),
            "matches": data.get("matches", [])
        }

    except Exception as e:
        return {"error": str(e), "is_threat": False}