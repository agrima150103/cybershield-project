import re
import ssl
import socket
from urllib.parse import urlparse
from datetime import datetime
from app.scanners.whois_lookup import lookup_whois
from app.scanners.virustotal import scan_with_virustotal
from app.scanners.safe_browsing import check_safe_browsing
from app.ml.predictor import predict as ml_predict


def analyze_url(url: str) -> dict:
    parsed = urlparse(url if url.startswith('http') else f'http://{url}')
    domain = parsed.netloc or parsed.path.split('/')[0]

    features = extract_features(url, parsed)
    ssl_info = check_ssl(domain)
    whois_data = lookup_whois(domain)
    vt_result = scan_with_virustotal(url)
    gsb_result = check_safe_browsing(url)

    heuristic_score = calculate_threat_score(features, ssl_info, whois_data, vt_result, gsb_result)

    # ML prediction
    ml_result = ml_predict(url)

    # Blend: 60% heuristic + 40% ML if available
    if ml_result.get('ml_available'):
        ml_score = ml_result.get('ensemble_score', 0)
        threat_score = round(0.6 * heuristic_score + 0.4 * ml_score, 2)
    else:
        threat_score = heuristic_score

    return {
        "url": url,
        "domain": domain,
        "features": features,
        "ssl_info": ssl_info,
        "whois_data": whois_data,
        "virustotal_result": vt_result,
        "safe_browsing_result": gsb_result,
        "ml_analysis": ml_result,
        "heuristic_score": heuristic_score,
        "threat_score": threat_score,
        "is_malicious": threat_score > 0.6,
    }


def extract_features(url: str, parsed) -> dict:
    domain = parsed.netloc or ""
    path = parsed.path or ""

    return {
        "url_length": len(url),
        "domain_length": len(domain),
        "path_length": len(path),
        "has_ip_address": bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain)),
        "has_at_symbol": "@" in url,
        "has_double_slash_redirect": "//" in path,
        "subdomain_count": len(domain.split('.')) - 2 if domain else 0,
        "has_https": parsed.scheme == "https",
        "has_suspicious_words": any(w in url.lower() for w in [
            'login', 'signin', 'verify', 'account', 'update', 'secure',
            'banking', 'confirm', 'password', 'suspend'
        ]),
        "special_char_count": len(re.findall(r'[-_~!$&@#%]', url)),
        "digit_count": len(re.findall(r'\d', domain)),
        "is_shortened": any(s in domain for s in [
            'bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly'
        ]),
        "has_punycode": domain.startswith('xn--'),
    }


def check_ssl(domain: str) -> dict:
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(5)
            s.connect((domain, 443))
            cert = s.getpeercert()
            not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
            not_before = datetime.strptime(cert['notBefore'], '%b %d %H:%M:%S %Y %Z')
            return {
                "has_ssl": True,
                "issuer": dict(x[0] for x in cert.get('issuer', [])),
                "expires": not_after.isoformat(),
                "cert_age_days": (datetime.utcnow() - not_before).days,
                "days_until_expiry": (not_after - datetime.utcnow()).days,
                "is_self_signed": False,
            }
    except Exception as e:
        return {"has_ssl": False, "error": str(e)}


def calculate_threat_score(features, ssl_info, whois_data, vt_result, gsb_result) -> float:
    score = 0.0

    # Feature-based scoring
    feature_weights = {
        "has_ip_address": 0.15,
        "has_at_symbol": 0.1,
        "has_double_slash_redirect": 0.08,
        "has_suspicious_words": 0.1,
        "is_shortened": 0.08,
        "has_punycode": 0.12,
    }
    for feature, weight in feature_weights.items():
        if features.get(feature):
            score += weight

    if features["url_length"] > 75:
        score += 0.05
    if features["subdomain_count"] > 3:
        score += 0.08
    if features["special_char_count"] > 5:
        score += 0.03

    # SSL scoring
    if not ssl_info.get("has_ssl"):
        score += 0.1
    if ssl_info.get("cert_age_days", 999) < 30:
        score += 0.08

    # WHOIS scoring
    if whois_data.get("is_new_domain"):
        score += 0.15
    if whois_data.get("domain_age_days") is not None and whois_data["domain_age_days"] < 30:
        score += 0.1

    # VirusTotal scoring
    malicious = vt_result.get("malicious_count", 0)
    if malicious > 5:
        score += 0.3
    elif malicious > 0:
        score += 0.15

    # Safe Browsing scoring
    if gsb_result.get("is_threat"):
        score += 0.25

    return min(round(score, 2), 1.0)