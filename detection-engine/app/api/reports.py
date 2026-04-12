import io
import json
from datetime import datetime
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

router = APIRouter()


def generate_pdf_bytes(scan_data: dict) -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        raise RuntimeError("reportlab not installed. Run: pip install reportlab")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm, leftMargin=18 * mm, rightMargin=18 * mm)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Title2', fontSize=22, leading=28, fontName='Helvetica-Bold', textColor=colors.HexColor('#1e293b'), alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Sub', fontSize=10, leading=14, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='SectionHead', fontSize=13, leading=18, fontName='Helvetica-Bold', textColor=colors.HexColor('#0ea5e9'), spaceBefore=16, spaceAfter=8))
    styles.add(ParagraphStyle(name='Body2', fontSize=10, leading=15, textColor=colors.HexColor('#334155')))
    styles.add(ParagraphStyle(name='Small', fontSize=8, leading=11, textColor=colors.HexColor('#94a3b8')))
    styles.add(ParagraphStyle(name='Verdict', fontSize=14, leading=20, fontName='Helvetica-Bold', alignment=TA_CENTER))

    elements = []

    # Header
    elements.append(Paragraph("CyberShield Threat Report", styles['Title2']))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", styles['Sub']))
    elements.append(Spacer(1, 4))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0')))
    elements.append(Spacer(1, 12))

    # Scan Overview
    url = scan_data.get('url', 'N/A')
    domain = scan_data.get('domain', 'N/A')
    threat_score = scan_data.get('threat_score', 0)
    is_malicious = scan_data.get('is_malicious', False)
    heuristic_score = scan_data.get('heuristic_score', threat_score)

    verdict_color = '#ef4444' if is_malicious else '#22c55e'
    verdict_text = 'MALICIOUS — HIGH RISK' if is_malicious else 'SAFE — LOW RISK'
    if not is_malicious and threat_score > 0.3:
        verdict_text = 'SUSPICIOUS — MEDIUM RISK'
        verdict_color = '#f59e0b'

    elements.append(Paragraph("Scan Overview", styles['SectionHead']))

    overview_data = [
        ['URL', url],
        ['Domain', domain],
        ['Threat Score', f"{threat_score * 100:.0f}%"],
        ['Heuristic Score', f"{heuristic_score * 100:.0f}%"],
        ['Verdict', verdict_text],
        ['Scan Time', scan_data.get('created_at', datetime.utcnow().isoformat())],
    ]

    overview_table = Table(overview_data, colWidths=[120, 380])
    overview_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (1, 4), (1, 4), colors.HexColor(verdict_color)),
        ('FONTNAME', (1, 4), (1, 4), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#f1f5f9')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(overview_table)
    elements.append(Spacer(1, 10))

    # SSL Info
    ssl_info = scan_data.get('ssl_info', {})
    elements.append(Paragraph("SSL / TLS Certificate", styles['SectionHead']))
    ssl_data = [
        ['Has SSL', 'Yes' if ssl_info.get('has_ssl') else 'No'],
        ['Issuer', str(ssl_info.get('issuer', 'N/A'))],
        ['Expires', str(ssl_info.get('expires', 'N/A'))],
        ['Cert Age (days)', str(ssl_info.get('cert_age_days', 'N/A'))],
        ['Days Until Expiry', str(ssl_info.get('days_until_expiry', 'N/A'))],
    ]
    ssl_table = Table(ssl_data, colWidths=[120, 380])
    ssl_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    elements.append(ssl_table)
    elements.append(Spacer(1, 10))

    # WHOIS
    whois_data = scan_data.get('whois_data', {})
    elements.append(Paragraph("WHOIS Information", styles['SectionHead']))
    whois_rows = [
        ['Registrar', str(whois_data.get('registrar', 'N/A'))],
        ['Organization', str(whois_data.get('org', 'N/A'))],
        ['Country', str(whois_data.get('country', 'N/A'))],
        ['Creation Date', str(whois_data.get('creation_date', 'N/A'))],
        ['Domain Age (days)', str(whois_data.get('domain_age_days', 'N/A'))],
        ['New Domain (<90d)', 'Yes' if whois_data.get('is_new_domain') else 'No'],
    ]
    whois_table = Table(whois_rows, colWidths=[120, 380])
    whois_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    elements.append(whois_table)
    elements.append(Spacer(1, 10))

    # URL Features
    features = scan_data.get('features', {})
    elements.append(Paragraph("URL Feature Analysis", styles['SectionHead']))
    feat_rows = []
    for key, val in features.items():
        label = key.replace('_', ' ').title()
        feat_rows.append([label, str(val)])
    if feat_rows:
        feat_table = Table(feat_rows, colWidths=[200, 300])
        feat_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#f1f5f9')),
        ]))
        elements.append(feat_table)
    elements.append(Spacer(1, 10))

    # ML Analysis
    ml = scan_data.get('ml_analysis', {})
    if ml.get('ml_available'):
        elements.append(Paragraph("Machine Learning Analysis", styles['SectionHead']))
        ml_rows = [
            ['Random Forest', f"{ml.get('rf_phishing_probability', 0) * 100:.0f}% — {ml.get('rf_prediction', 'N/A')}"],
            ['Gradient Boosting', f"{ml.get('gb_phishing_probability', 0) * 100:.0f}% — {ml.get('gb_prediction', 'N/A')}"],
            ['Ensemble Score', f"{ml.get('ensemble_score', 0) * 100:.0f}%"],
            ['Ensemble Verdict', ml.get('ensemble_prediction', 'N/A').upper()],
            ['Model Accuracy', f"{ml.get('model_accuracy', 0) * 100:.0f}%"],
        ]
        ml_table = Table(ml_rows, colWidths=[150, 350])
        ml_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#f1f5f9')),
        ]))
        elements.append(ml_table)
        elements.append(Spacer(1, 10))

    # VirusTotal
    vt = scan_data.get('virustotal_result', {})
    elements.append(Paragraph("VirusTotal Results", styles['SectionHead']))
    vt_rows = [
        ['Malicious Engines', str(vt.get('malicious_count', 0))],
        ['Suspicious Engines', str(vt.get('suspicious_count', 0))],
        ['Harmless Engines', str(vt.get('harmless_count', 0))],
        ['Flagged', 'Yes' if vt.get('is_flagged') else 'No'],
    ]
    vt_table = Table(vt_rows, colWidths=[150, 350])
    vt_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    elements.append(vt_table)
    elements.append(Spacer(1, 16))

    # Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0')))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("This report was auto-generated by CyberShield Threat Intelligence Platform.", styles['Small']))
    elements.append(Paragraph("For internal use only. Results should be verified with additional investigation.", styles['Small']))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


@router.post("/generate")
async def generate_report(scan_data: dict):
    pdf_bytes = generate_pdf_bytes(scan_data)
    filename = f"cybershield_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )