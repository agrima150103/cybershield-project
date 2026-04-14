import ssl
import socket
import requests
from urllib.parse import urlparse
from datetime import datetime


COMMON_SENSITIVE_PATHS = [
    "/admin",
    "/admin/login",
    "/login",
    "/dashboard",
    "/phpmyadmin",
    "/.env",
    "/config",
    "/backup",
    "/wp-admin",
    "/server-status",
    "/robots.txt",
]


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        return f"https://{url}"
    return url


def extract_host(url: str) -> str:
    parsed = urlparse(normalize_url(url))
    return (parsed.netloc or parsed.path).split(":")[0]


def try_fetch(url: str):
    try:
        response = requests.get(
            url,
            timeout=8,
            allow_redirects=True,
            verify=False,
            headers={"User-Agent": "CyberShield/1.0"},
        )
        return response, None
    except Exception as e:
        return None, str(e)


def fetch_best_response(url: str):
    normalized = normalize_url(url)

    response, error = try_fetch(normalized)
    if response is not None:
        return response, normalized

    # fallback to http if https input fails
    host = extract_host(normalized)
    fallback = f"http://{host}"
    response, _ = try_fetch(fallback)
    if response is not None:
        return response, fallback

    return None, normalized


def analyze_security_headers(headers: dict) -> dict:
    required_headers = {
        "Content-Security-Policy": {
            "severity": "high",
            "issue": "Missing Content-Security-Policy header",
        },
        "Strict-Transport-Security": {
            "severity": "high",
            "issue": "Missing HSTS header",
        },
        "X-Frame-Options": {
            "severity": "medium",
            "issue": "Missing X-Frame-Options header",
        },
        "X-Content-Type-Options": {
            "severity": "medium",
            "issue": "Missing X-Content-Type-Options header",
        },
        "Referrer-Policy": {
            "severity": "low",
            "issue": "Missing Referrer-Policy header",
        },
    }

    present_headers = []
    missing_headers = []
    score = 0

    for header, info in required_headers.items():
        if header in headers:
            present_headers.append({
                "header": header,
                "value": headers.get(header, ""),
            })
        else:
            missing_headers.append({
                "header": header,
                "issue": info["issue"],
                "severity": info["severity"],
            })
            score += {"high": 10, "medium": 6, "low": 3}[info["severity"]]

    return {
        "present_headers": present_headers,
        "missing_headers": missing_headers,
        "header_score": score,
    }


def scan_sensitive_paths(base_url: str) -> dict:
    found = []
    exposure_score = 0
    checked = 0

    base = base_url.rstrip("/")

    for path in COMMON_SENSITIVE_PATHS:
        checked += 1
        try:
            resp = requests.get(
                f"{base}{path}",
                timeout=4,
                allow_redirects=False,
                verify=False,
                headers={"User-Agent": "CyberShield/1.0"},
            )

            if resp.status_code in [200, 401, 403]:
                severity = "medium"
                description = "Potentially sensitive endpoint exposed"

                if path in ["/.env", "/backup", "/config", "/phpmyadmin", "/server-status"]:
                    severity = "high"
                    exposure_score += 8
                else:
                    exposure_score += 4

                found.append({
                    "path": path,
                    "status_code": resp.status_code,
                    "description": description,
                    "severity": severity,
                    "accessible": resp.status_code == 200,
                })
        except Exception:
            continue

    return {
        "paths_checked": checked,
        "paths_found": len(found),
        "found": found,
        "exposure_score": exposure_score,
    }


def analyze_ssl_tls(host: str) -> dict:
    try:
        context = ssl.create_default_context()

        with socket.create_connection((host, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert()
                cipher = ssock.cipher()
                tls_version = ssock.version()

                not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                days_until_expiry = (not_after - datetime.utcnow()).days

                findings = []
                ssl_score = 0

                if days_until_expiry < 30:
                    findings.append({"issue": "Certificate expires soon", "severity": "high"})
                    ssl_score += 12
                else:
                    findings.append({"issue": "Certificate validity looks healthy", "severity": "good"})

                if tls_version in ["TLSv1", "TLSv1.1"]:
                    findings.append({"issue": f"Weak TLS version in use: {tls_version}", "severity": "high"})
                    ssl_score += 12
                else:
                    findings.append({"issue": f"Modern TLS version in use: {tls_version}", "severity": "good"})

                return {
                    "has_ssl": True,
                    "tls_version": tls_version,
                    "cipher": cipher[0] if cipher else "Unknown",
                    "days_until_expiry": days_until_expiry,
                    "findings": findings,
                    "ssl_score": ssl_score,
                }

    except Exception as e:
        return {
            "has_ssl": False,
            "error": str(e),
            "ssl_score": 20,
            "findings": [
                {
                    "issue": "No SSL/TLS connection available",
                    "severity": "high",
                }
            ],
        }


def security_headers_scan(url: str) -> dict:
    response, final_url = fetch_best_response(url)

    if response is None:
        return {
            "url": url,
            "error": "Could not fetch target site",
            "security_headers": {
                "present_headers": [],
                "missing_headers": [],
                "header_score": 0,
            },
        }

    return {
        "url": final_url,
        "security_headers": analyze_security_headers(dict(response.headers)),
    }


def full_vulnerability_scan(url: str) -> dict:
    response, final_url = fetch_best_response(url)
    host = extract_host(url)

    if response is None:
        return {
            "url": url,
            "domain": host,
            "error": "Could not fetch target site",
            "combined_score": 0,
            "risk_level": "Unknown",
            "total_findings": 0,
            "security_headers": {
                "present_headers": [],
                "missing_headers": [],
                "header_score": 0,
            },
            "exposed_paths": {
                "paths_checked": 0,
                "paths_found": 0,
                "found": [],
                "exposure_score": 0,
            },
            "ssl_analysis": {
                "has_ssl": False,
                "error": "Connection failed",
                "ssl_score": 0,
                "findings": [],
            },
        }

    headers_result = analyze_security_headers(dict(response.headers))
    paths_result = scan_sensitive_paths(final_url)
    ssl_result = analyze_ssl_tls(host)

    combined_score = (
        headers_result.get("header_score", 0)
        + paths_result.get("exposure_score", 0)
        + ssl_result.get("ssl_score", 0)
    )

    total_findings = (
        len(headers_result.get("missing_headers", []))
        + len(paths_result.get("found", []))
        + len([f for f in ssl_result.get("findings", []) if f.get("severity") != "good"])
    )

    risk_level = (
        "High" if combined_score >= 40
        else "Medium" if combined_score >= 20
        else "Low"
    )

    return {
        "url": final_url,
        "domain": host,
        "combined_score": combined_score,
        "risk_level": risk_level,
        "total_findings": total_findings,
        "security_headers": headers_result,
        "exposed_paths": paths_result,
        "ssl_analysis": ssl_result,
    }