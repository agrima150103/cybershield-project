from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.gophish_scanner import (
    get_campaigns,
    get_campaign_detail,
    get_landing_pages,
    get_templates,
    analyze_phish_url,
)

router = APIRouter()


@router.get("/campaigns")
async def campaigns():
    return get_campaigns()


@router.get("/campaigns/{campaign_id}")
async def campaign_detail(campaign_id: int):
    return get_campaign_detail(campaign_id)


@router.get("/pages")
async def pages():
    return get_landing_pages()


@router.get("/templates")
async def templates():
    return get_templates()


class AnalyzeRequest(BaseModel):
    url: str


@router.post("/analyze-url")
async def analyze_url(req: AnalyzeRequest):
    return analyze_phish_url(req.url)