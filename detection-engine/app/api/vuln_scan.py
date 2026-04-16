from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.vuln_scanner import full_vulnerability_scan
from app.scanners.nikto_scanner import nikto_scan
from app.scanners.network_capture import full_network_capture

router = APIRouter()


class ScanRequest(BaseModel):
    target: str


@router.post("/full")
async def vuln_scan(req: ScanRequest):
    return full_vulnerability_scan(req.target)


@router.post("/nikto")
async def nikto(req: ScanRequest):
    return nikto_scan(req.target)


@router.post("/capture")
async def network_capture(req: ScanRequest):
    return full_network_capture(req.target)