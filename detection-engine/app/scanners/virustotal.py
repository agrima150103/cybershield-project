import os
import requests

VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
VT_BASE_URL = "https://www.virustotal.com/api/v3"

def scan_with_virustotal(url: str) -> dict:
    if not VT_API_KEY:
        return {"error": "No API key configured", "malicious_count": 0}

    headers = {"x-apikey": VT_API_KEY}

    try:
        # Submit URL for scanning
        resp = requests.post(
            f"{VT_BASE_URL}/urls",
            headers=headers,
            data={"url": url},
            timeout=10,
        )
        resp.raise_for_status()
        analysis_id = resp.json()["data"]["id"]

        # Get results
        result = requests.get(
            f"{VT_BASE_URL}/analyses/{analysis_id}",
            headers=headers,
            timeout=15,
        )
        result.raise_for_status()
        stats = result.json()["data"]["attributes"]["stats"]

        return {
            "malicious_count": stats.get("malicious", 0),
            "suspicious_count": stats.get("suspicious", 0),
            "harmless_count": stats.get("harmless", 0),
            "undetected_count": stats.get("undetected", 0),
            "is_flagged": stats.get("malicious", 0) > 0,
        }
    except Exception as e:
        return {"error": str(e), "malicious_count": 0}