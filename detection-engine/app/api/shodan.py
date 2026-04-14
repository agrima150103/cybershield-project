from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.shodan_lookup import lookup_shodan

router = APIRouter()

class ShodanRequest(BaseModel):
    domain: str

@router.post("/lookup")
async def shodan_lookup(req: ShodanRequest):
    return lookup_shodan(req.domain)