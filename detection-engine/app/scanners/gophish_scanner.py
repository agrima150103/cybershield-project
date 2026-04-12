import os
import re
import socket
import requests
from urllib.parse import urlparse
from datetime import datetime

GOPHISH_API_KEY = os.getenv("GOPHISH_API_KEY", "")
GOPHISH_ADMIN_URL = os.getenv("GOPHISH_ADMIN_URL", "https://127.0.0.1:3333")


def get_gophish_client():
    if not GOPHISH_API_KEY:
        return None
    return {
        "url": GOPHISH_ADMIN_URL,
        "headers": {"Authorization": f"Bearer {GOPHISH_API_KEY}"},
    }


def get_campaigns():
    client = get_gophish_client()
    if not client:
        return {"error": "GoPhish API key not configured", "campaigns": []}

    try:
        resp = requests.get(
            f"{client['url']}/api/campaigns/",
            headers=client["headers"],
            verify=False,
            timeout=10,
        )
        resp.raise_for_status()
        campaigns = resp.json()

        results = []
        for c in campaigns:
            results.append({
                "id": c.get("id"),
                "name": c.get("name"),
                "status": c.get("status"),
                "created_date": c.get("created_date"),
                "launch_date": c.get("launch_date"),
                "completed_date": c.get("completed_date"),
                "url": c.get("url"),
                "smtp_name": c.get("smtp", {}).get("name", "Unknown"),
                "template_name": c.get("template", {}).get("name", "Unknown"),
                "total_targets": len(c.get("results", [])),
                "emails_sent": sum(1 for r in c.get("results", []) if r.get("status") == "Email Sent"),
                "emails_opened": sum(1 for r in c.get("results", []) if r.get("status") == "Email Opened"),
                "links_clicked": sum(1 for r in c.get("results", []) if r.get("status") == "Clicked Link"),
                "data_submitted": sum(1 for r in c.get("results", []) if r.get("status") == "Submitted Data"),
            })

        return {"campaigns": results, "total": len(results)}
    except Exception as e:
        return {"error": str(e), "campaigns": []}


def get_campaign_detail(campaign_id: int):
    client = get_gophish_client()
    if not client:
        return {"error": "GoPhish API key not configured"}

    try:
        resp = requests.get(
            f"{client['url']}/api/campaigns/{campaign_id}",
            headers=client["headers"],
            verify=False,
            timeout=10,
        )
        resp.raise_for_status()
        campaign = resp.json()

        # Parse results into timeline events
        timeline = []
        for result in campaign.get("results", []):
            timeline.append({
                "email": result.get("email"),
                "first_name": result.get("first_name"),
                "last_name": result.get("last_name"),
                "status": result.get("status"),
                "ip": result.get("ip"),
                "latitude": result.get("latitude"),
                "longitude": result.get("longitude"),
                "send_date": result.get("send_date"),
                "reported": result.get("reported", False),
            })

        # Summary stats
        total = len(timeline)
        stats = {
            "total_targets": total,
            "email_sent": sum(1 for t in timeline if t["status"] == "Email Sent"),
            "email_opened": sum(1 for t in timeline if t["status"] == "Email Opened"),
            "clicked_link": sum(1 for t in timeline if t["status"] == "Clicked Link"),
            "submitted_data": sum(1 for t in timeline if t["status"] == "Submitted Data"),
            "reported": sum(1 for t in timeline if t.get("reported")),
        }

        if total > 0:
            stats["click_rate"] = round((stats["clicked_link"] / total) * 100, 1)
            stats["submission_rate"] = round((stats["submitted_data"] / total) * 100, 1)
            stats["report_rate"] = round((stats["reported"] / total) * 100, 1)
        else:
            stats["click_rate"] = 0
            stats["submission_rate"] = 0
            stats["report_rate"] = 0

        return {
            "id": campaign.get("id"),
            "name": campaign.get("name"),
            "status": campaign.get("status"),
            "url": campaign.get("url"),
            "created_date": campaign.get("created_date"),
            "launch_date": campaign.get("launch_date"),
            "stats": stats,
            "timeline": timeline,
        }
    except Exception as e:
        return {"error": str(e)}


def get_landing_pages():
    client = get_gophish_client()
    if not client:
        return {"error": "GoPhish API key not configured", "pages": []}

    try:
        resp = requests.get(
            f"{client['url']}/api/pages/",
            headers=client["headers"],
            verify=False,
            timeout=10,
        )
        resp.raise_for_status()
        pages = resp.json()

        results = []
        for p in pages:
            html = p.get("html", "")
            results.append({
                "id": p.get("id"),
                "name": p.get("name"),
                "modified_date": p.get("modified_date"),
                "capture_credentials": p.get("capture_credentials", False),
                "capture_passwords": p.get("capture_passwords", False),
                "redirect_url": p.get("redirect_url", ""),
                "has_form": "<form" in html.lower(),
                "has_password_field": 'type="password"' in html.lower() or "type='password'" in html.lower(),
                "html_length": len(html),
            })

        return {"pages": results, "total": len(results)}
    except Exception as e:
        return {"error": str(e), "pages": []}


def get_templates():
    client = get_gophish_client()
    if not client:
        return {"error": "GoPhish API key not configured", "templates": []}

    try:
        resp = requests.get(
            f"{client['url']}/api/templates/",
            headers=client["headers"],
            verify=False,
            timeout=10,
        )
        resp.raise_for_status()
        templates = resp.json()

        results = []
        for t in templates:
            html = t.get("html", "")
            text = t.get("text", "")
            content = html + text

            # Analyze for social engineering indicators
            urgency_words = ["urgent", "immediately", "suspend", "verify", "expire", "unauthorized", "confirm"]
            has_urgency = any(w in content.lower() for w in urgency_words)

            results.append({
                "id": t.get("id"),
                "name": t.get("name"),
                "modified_date": t.get("modified_date"),
                "subject": t.get("subject", ""),
                "has_tracking_image": "{{.TrackingURL}}" in html,
                "has_phish_url": "{{.URL}}" in html,
                "has_urgency_language": has_urgency,
                "html_length": len(html),
                "text_length": len(text),
            })

        return {"templates": results, "total": len(results)}
    except Exception as e:
        return {"error": str(e), "templates": []}


def analyze_phish_url(phish_url: str):
    """Analyze a GoPhish landing page URL for detection indicators."""
    indicators = []
    risk_score = 0

    try:
        parsed = urlparse(phish_url)
        domain = parsed.netloc or ""

        # Check if it's a local/private IP
        if re.match(r'\d+\.\d+\.\d+\.\d+', domain.split(":")[0]):
            indicators.append("Uses IP address instead of domain name")
            risk_score += 20

        # Check for non-standard port
        if ":" in domain:
            port = domain.split(":")[1]
            if port not in ["80", "443"]:
                indicators.append(f"Non-standard port: {port}")
                risk_score += 15

        # Check SSL
        if parsed.scheme != "https":
            indicators.append("No HTTPS — credentials sent in plaintext")
            risk_score += 25

        # Try to fetch the page
        try:
            resp = requests.get(phish_url, timeout=5, verify=False, allow_redirects=False)
            html = resp.text.lower()

            if "<form" in html:
                indicators.append("Contains login/data capture form")
                risk_score += 15
            if 'type="password"' in html or "type='password'" in html:
                indicators.append("Contains password input field")
                risk_score += 20
            if "{{.url}}" in html or "gophish" in resp.headers.get("X-Powered-By", "").lower():
                indicators.append("GoPhish framework signature detected")
                risk_score += 10
            if any(w in html for w in ["verify your account", "suspended", "unauthorized access", "confirm your identity"]):
                indicators.append("Social engineering language detected in page content")
                risk_score += 15

            # Check response headers
            server = resp.headers.get("Server", "")
            if "gophish" in server.lower():
                indicators.append("Server header reveals GoPhish")
                risk_score += 10

        except Exception:
            indicators.append("Could not fetch landing page — may be down or blocked")

        risk_score = min(risk_score, 100)
        risk_level = "Critical" if risk_score >= 70 else "High" if risk_score >= 50 else "Medium" if risk_score >= 30 else "Low"

        return {
            "url": phish_url,
            "indicators": indicators,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "is_phishing_page": risk_score >= 40,
        }

    except Exception as e:
        return {"error": str(e), "url": phish_url}