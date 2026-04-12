import requests
import csv
import io
from datetime import datetime

def fetch_phishtank():
    """Fetch latest phishing URLs from PhishTank"""
    try:
        url = "http://data.phishtank.com/data/online-valid.csv"
        resp = requests.get(url, timeout=30, headers={"User-Agent": "CyberShield/1.0"})
        resp.raise_for_status()

        reader = csv.DictReader(io.StringIO(resp.text))
        entries = []
        for i, row in enumerate(reader):
            if i >= 500:  # Limit to 500 entries
                break
            entries.append({
                "url": row.get("url", ""),
                "source": "phishtank",
                "threat_type": "phishing",
                "confidence": 0.9,
                "first_seen": row.get("submission_time", ""),
                "metadata": {
                    "phish_id": row.get("phish_id", ""),
                    "target": row.get("target", ""),
                },
            })
        return entries
    except Exception as e:
        print(f"[PhishTank] Error: {e}")
        return []

def fetch_abusech_urlhaus():
    """Fetch malware URLs from abuse.ch URLhaus"""
    try:
        url = "https://urlhaus.abuse.ch/downloads/csv_recent/"
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()

        lines = resp.text.split("\n")
        entries = []
        for line in lines:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.strip('"').split('","')
            if len(parts) >= 4:
                entries.append({
                    "url": parts[2] if len(parts) > 2 else "",
                    "source": "abusech",
                    "threat_type": parts[4] if len(parts) > 4 else "malware",
                    "confidence": 0.85,
                    "first_seen": parts[1] if len(parts) > 1 else "",
                    "metadata": {
                        "id": parts[0],
                        "status": parts[3] if len(parts) > 3 else "",
                        "tags": parts[6] if len(parts) > 6 else "",
                    },
                })
            if len(entries) >= 500:
                break
        return entries
    except Exception as e:
        print(f"[abuse.ch] Error: {e}")
        return []

def fetch_openphish():
    """Fetch phishing URLs from OpenPhish"""
    try:
        url = "https://openphish.com/feed.txt"
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()

        entries = []
        for line in resp.text.strip().split("\n"):
            line = line.strip()
            if line:
                entries.append({
                    "url": line,
                    "source": "openphish",
                    "threat_type": "phishing",
                    "confidence": 0.8,
                    "first_seen": datetime.utcnow().isoformat(),
                    "metadata": {},
                })
            if len(entries) >= 500:
                break
        return entries
    except Exception as e:
        print(f"[OpenPhish] Error: {e}")
        return []

def fetch_all_feeds():
    """Fetch from all threat feeds"""
    all_entries = []
    print("[Feeds] Fetching PhishTank...")
    all_entries.extend(fetch_phishtank())
    print(f"[Feeds] PhishTank: {len(all_entries)} entries")

    print("[Feeds] Fetching abuse.ch URLhaus...")
    abusech = fetch_abusech_urlhaus()
    all_entries.extend(abusech)
    print(f"[Feeds] abuse.ch: {len(abusech)} entries")

    print("[Feeds] Fetching OpenPhish...")
    openphish = fetch_openphish()
    all_entries.extend(openphish)
    print(f"[Feeds] OpenPhish: {len(openphish)} entries")

    print(f"[Feeds] Total: {len(all_entries)} entries")
    return all_entries