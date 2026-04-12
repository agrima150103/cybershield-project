from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.url_analyzer import analyze_url

router = APIRouter()

class ScanRequest(BaseModel):
    url: str

@router.post("/url")
async def scan_url(req: ScanRequest):
    result = analyze_url(req.url)
    return result