import os
import requests

GSB_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_KEY", "")
GSB_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

def check_safe_browsing(url: str) -> dict:
    if not GSB_API_KEY:
        return {"error": "No API key configured", "is_threat": False}

    try:
        payload = {
            "client": {"clientId": "cybershield", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}],
            },
        }

        resp = requests.post(
            f"{GSB_URL}?key={GSB_API_KEY}",
            json=payload,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        matches = data.get("matches", [])
        return {
            "is_threat": len(matches) > 0,
            "threats": [m.get("threatType") for m in matches],
        }
    except Exception as e:
        return {"error": str(e), "is_threat": False}