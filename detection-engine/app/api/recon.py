from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.port_scanner import scan_ports
from app.scanners.abuse_ipdb import check_abuse_ipdb

router = APIRouter()


class ReconRequest(BaseModel):
    domain: str


@router.post("/port-scan")
async def port_scan(req: ReconRequest):
    result = scan_ports(req.domain)
    return result


@router.post("/abuse-check")
async def abuse_check(req: ReconRequest):
    result = check_abuse_ipdb(req.domain)
    return result


@router.post("/full")
async def full_recon(req: ReconRequest):
    port_result = scan_ports(req.domain)
    abuse_result = check_abuse_ipdb(req.domain)

    combined_risk = 0
    if port_result.get("risk_score"):
        combined_risk += port_result["risk_score"] * 0.4
    if abuse_result.get("abuse_confidence_score"):
        combined_risk += abuse_result["abuse_confidence_score"] * 0.6

    combined_risk = min(round(combined_risk), 100)
    combined_level = "Critical" if combined_risk >= 60 else "High" if combined_risk >= 40 else "Medium" if combined_risk >= 20 else "Low"

    return {
        "domain": req.domain,
        "ip": port_result.get("ip") or abuse_result.get("ip"),
        "port_scan": port_result,
        "abuse_check": abuse_result,
        "combined_risk_score": combined_risk,
        "combined_risk_level": combined_level,
    }