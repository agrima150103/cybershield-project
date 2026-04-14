from fastapi import APIRouter
from pydantic import BaseModel
from app.scanners.breach_checker import (
    check_password_breach,
    check_email_breach,
    analyze_password_strength,
)

router = APIRouter()


class PasswordCheckRequest(BaseModel):
    password: str


class EmailCheckRequest(BaseModel):
    email: str


@router.post("/check-password")
async def password_breach(req: PasswordCheckRequest):
    breach = check_password_breach(req.password)
    strength = analyze_password_strength(req.password)
    return {"breach_check": breach, "strength_analysis": strength}


@router.post("/check-email")
async def email_breach(req: EmailCheckRequest):
    return check_email_breach(req.email)