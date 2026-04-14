import os
import socket
import ipaddress
import requests

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY", "").strip()


def is_public_ip(ip: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip)
        return not (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
        )
    except ValueError:
        return False


def resolve_domain_to_ip(domain: str) -> str | None:
    try:
        return socket.gethostbyname(domain)
    except Exception:
        return None


def lookup_internetdb(ip: str) -> dict:
    """
    Free Shodan-backed fallback.
    Docs: https://internetdb.shodan.io/
    """
    try:
        response = requests.get(f"https://internetdb.shodan.io/{ip}", timeout=10)
        response.raise_for_status()
        data = response.json()

        risk_findings = []
        ports = data.get("ports", []) or []
        vulns = data.get("vulns", []) or []

        if len(ports) > 10:
            risk_findings.append("Large number of open ports exposed")
        if 23 in ports:
            risk_findings.append("Telnet exposed")
        if 21 in ports:
            risk_findings.append("FTP exposed")
        if 3389 in ports:
            risk_findings.append("RDP exposed")
        if vulns:
            risk_findings.append("Known vulnerabilities reported by InternetDB")

        return {
            "found": True,
            "source": "internetdb",
            "ip": ip,
            "organization": None,
            "os": None,
            "country": None,
            "hostnames": data.get("hostnames", []),
            "open_ports": ports,
            "technologies": data.get("cpes", []),
            "vulnerabilities": vulns,
            "services": [{"port": p, "product": "Unknown", "version": "", "transport": "tcp"} for p in ports],
            "risk_findings": risk_findings,
            "message": "Returned from Shodan InternetDB fallback",
        }
    except Exception as e:
        return {"found": False, "source": "internetdb", "error": str(e)}


def lookup_shodan(domain_or_ip: str) -> dict:
    target = domain_or_ip.strip().replace("http://", "").replace("https://", "").split("/")[0]

    if target.replace(".", "").isdigit():
        ip_to_query = target
    else:
        ip_to_query = resolve_domain_to_ip(target)

    if not ip_to_query:
        return {"found": False, "error": f"Could not resolve domain: {target}"}

    if not is_public_ip(ip_to_query):
        return {
            "found": False,
            "message": f"{ip_to_query} is not a public internet IP, so Shodan has no data for it",
        }

    # No key? Use free fallback directly
    if not SHODAN_API_KEY:
        fallback = lookup_internetdb(ip_to_query)
        fallback["domain"] = target
        if not fallback.get("found"):
            fallback["error"] = "No SHODAN_API_KEY configured and InternetDB lookup failed"
        return fallback

    # Try full Shodan API first
    try:
        url = f"https://api.shodan.io/shodan/host/{ip_to_query}?key={SHODAN_API_KEY}"
        response = requests.get(url, timeout=15)

        # If account doesn't have access, fallback to InternetDB
        if response.status_code == 403:
            fallback = lookup_internetdb(ip_to_query)
            fallback["domain"] = target
            fallback["message"] = (
                "Main Shodan host API returned 403 Forbidden. "
                "Used free InternetDB fallback instead."
            )
            return fallback

        response.raise_for_status()
        data = response.json()

        services = []
        technologies = set()
        vulns = set()
        risk_findings = []

        for item in data.get("data", []):
            product = item.get("product") or "Unknown"
            version = item.get("version") or ""
            port = item.get("port")
            transport = item.get("transport", "tcp")

            services.append({
                "port": port,
                "product": product,
                "version": version,
                "transport": transport,
            })

            if product and product != "Unknown":
                technologies.add(product)

            for v in item.get("vulns", []) or []:
                vulns.add(v)

        open_ports = data.get("ports", [])

        if len(open_ports) > 10:
            risk_findings.append("Large number of open ports exposed")
        if any(p in open_ports for p in [23, 2323]):
            risk_findings.append("Telnet exposed")
        if any(p in open_ports for p in [21]):
            risk_findings.append("FTP exposed")
        if any(p in open_ports for p in [3389]):
            risk_findings.append("RDP exposed")
        if len(vulns) > 0:
            risk_findings.append("Known vulnerabilities reported by Shodan")

        return {
            "found": True,
            "source": "shodan",
            "domain": target,
            "ip": ip_to_query,
            "organization": data.get("org"),
            "os": data.get("os"),
            "country": data.get("country_name"),
            "open_ports": open_ports,
            "hostnames": data.get("hostnames", []),
            "technologies": sorted(list(technologies)),
            "vulnerabilities": sorted(list(vulns)),
            "services": services,
            "risk_findings": risk_findings,
        }

    except Exception as e:
        # Final fallback
        fallback = lookup_internetdb(ip_to_query)
        fallback["domain"] = target
        if fallback.get("found"):
            fallback["message"] = (
                f"Main Shodan lookup failed ({str(e)}). "
                "Used free InternetDB fallback instead."
            )
            return fallback

        return {"found": False, "error": str(e)}