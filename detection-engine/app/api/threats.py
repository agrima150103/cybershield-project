import sys
import os
from fastapi import APIRouter

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, project_root)

from services.threat_feed.app.ingester import fetch_all_feeds, fetch_phishtank, fetch_abusech_urlhaus, fetch_openphish

router = APIRouter()

@router.get("/feeds/fetch")
async def fetch_feeds():
    entries = fetch_all_feeds()
    return {
        "total": len(entries),
        "entries": entries[:50],  # Return first 50 as preview
        "message": f"Fetched {len(entries)} threat entries from all feeds",
    }

@router.get("/feeds/phishtank")
async def get_phishtank():
    entries = fetch_phishtank()
    return {"source": "phishtank", "count": len(entries), "entries": entries[:20]}

@router.get("/feeds/abusech")
async def get_abusech():
    entries = fetch_abusech_urlhaus()
    return {"source": "abusech", "count": len(entries), "entries": entries[:20]}

@router.get("/feeds/openphish")
async def get_openphish():
    entries = fetch_openphish()
    return {"source": "openphish", "count": len(entries), "entries": entries[:20]}

@router.get("/check")
async def check_url_against_feeds(url: str):
    """Check if a URL exists in any threat feed"""
    all_entries = fetch_all_feeds()
    matches = [e for e in all_entries if url in e["url"] or e["url"] in url]
    return {
        "url": url,
        "found_in_feeds": len(matches) > 0,
        "matches": matches[:10],
    }