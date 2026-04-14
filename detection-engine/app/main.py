from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.api.scan import router as scan_router
from app.api.email_analysis import router as email_router
from app.api.threats import router as threats_router
from app.api.reports import router as reports_router
from app.api.recon import router as recon_router
from app.api.gophish import router as gophish_router
from app.api.yara_scan import router as yara_router
from app.api.breach import router as breach_router
from app.api.shodan import router as shodan_router
from app.api.vuln import router as vuln_router

app = FastAPI(title="CyberShield Detection Engine", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "detection-engine"}

app.include_router(scan_router, prefix="/api/scan")
app.include_router(email_router, prefix="/api/email")
app.include_router(threats_router, prefix="/api/threats")
app.include_router(reports_router, prefix="/api/reports")
app.include_router(recon_router, prefix="/api/recon")
app.include_router(gophish_router, prefix="/api/gophish")
app.include_router(yara_router, prefix="/api/yara")
app.include_router(breach_router, prefix="/api/breach")
app.include_router(shodan_router, prefix="/api/shodan")
app.include_router(vuln_router, prefix="/api/vuln")