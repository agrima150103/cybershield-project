import os
import socket
import requests


ABUSEIPDB_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
ABUSEIPDB_URL = "https://api.abuseipdb.com/api/v2/check"


def resolve_domain(domain: str) -> str:
    try:
        return socket.gethostbyname(domain)
    except Exception:
        return ""


def check_abuse_ipdb(domain: str) -> dict:
    ip = resolve_domain(domain)
    if not ip:
        return {"error": f"Could not resolve domain: {domain}", "ip": None}

    if not ABUSEIPDB_KEY:
        return {
            "error": "No AbuseIPDB API key configured",
            "ip": ip,
            "is_checked": False,
        }

    try:
        headers = {
            "Accept": "application/json",
            "Key": ABUSEIPDB_KEY,
        }

        params = {
            "ipAddress": ip,
            "maxAgeInDays": 90,
            "verbose": True,
        }

        response = requests.get(ABUSEIPDB_URL, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json().get("data", {})

        # Extract recent reports
        recent_reports = []
        for report in data.get("reports", [])[:10]:
            recent_reports.append({
                "reported_at": report.get("reportedAt"),
                "comment": report.get("comment", ""),
                "categories": report.get("categories", []),
                "reporter_country": report.get("reporterCountryCode", "Unknown"),
            })

        # Category mapping
        category_map = {
            1: "DNS Compromise",
            2: "DNS Poisoning",
            3: "Fraud Orders",
            4: "DDoS Attack",
            5: "FTP Brute-Force",
            7: "Ping of Death",
            8: "Phishing",
            9: "Fraud VoIP",
            10: "Email Spam",
            11: "Bitcoin Miner",
            14: "Port Scan",
            15: "Hacking",
            16: "SQL Injection",
            17: "Spoofing",
            18: "Brute-Force",
            19: "Bad Web Bot",
            20: "Exploited Host",
            21: "Web App Attack",
            22: "SSH",
            23: "IoT Targeted",
        }

        # Get unique categories from reports
        all_categories = set()
        for report in data.get("reports", []):
            for cat_id in report.get("categories", []):
                if cat_id in category_map:
                    all_categories.add(category_map[cat_id])

        abuse_score = data.get("abuseConfidenceScore", 0)
        threat_level = "Critical" if abuse_score >= 75 else "High" if abuse_score >= 50 else "Medium" if abuse_score >= 25 else "Low"

        return {
            "ip": ip,
            "domain": domain,
            "is_checked": True,
            "is_public": data.get("isPublic", False),
            "abuse_confidence_score": abuse_score,
            "threat_level": threat_level,
            "country_code": data.get("countryCode", "Unknown"),
            "country_name": data.get("countryName", "Unknown"),
            "isp": data.get("isp", "Unknown"),
            "usage_type": data.get("usageType", "Unknown"),
            "domain_name": data.get("domain", "Unknown"),
            "total_reports": data.get("totalReports", 0),
            "num_distinct_users": data.get("numDistinctUsers", 0),
            "last_reported_at": data.get("lastReportedAt"),
            "is_whitelisted": data.get("isWhitelisted", False),
            "attack_categories": list(all_categories),
            "recent_reports": recent_reports,
        }

    except Exception as e:
        return {
            "error": str(e),
            "ip": ip,
            "is_checked": False,
        }