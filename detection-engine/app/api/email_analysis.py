import sys
import os
from fastapi import APIRouter
from pydantic import BaseModel

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, project_root)

from services.email_analyzer.app.analyzer import analyze_headers

router = APIRouter()

class EmailRequest(BaseModel):
    raw_headers: str

@router.post("/analyze")
async def analyze_email(req: EmailRequest):
    result = analyze_headers(req.raw_headers)
    return result