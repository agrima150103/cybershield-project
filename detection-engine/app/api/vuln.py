from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.vuln_scanner import full_vulnerability_scan, security_headers_scan

router = APIRouter()

class VulnRequest(BaseModel):
    url: str

@router.post("/full")
async def vuln_full(req: VulnRequest):
    return full_vulnerability_scan(req.url)

@router.post("/headers")
async def vuln_headers(req: VulnRequest):
    return security_headers_scan(req.url)