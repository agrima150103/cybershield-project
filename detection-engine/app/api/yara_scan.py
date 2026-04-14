from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.yara_scanner import scan_url_with_yara, get_rules_info

router = APIRouter()


class YaraScanRequest(BaseModel):
    url: str


@router.post("/scan")
async def yara_scan(req: YaraScanRequest):
    return scan_url_with_yara(req.url)


@router.get("/rules")
async def yara_rules():
    return get_rules_info()