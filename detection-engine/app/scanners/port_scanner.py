import socket
import json
from datetime import datetime


def resolve_domain(domain: str) -> str:
    try:
        ip = socket.gethostbyname(domain)
        return ip
    except Exception:
        return ""


def scan_ports(domain: str) -> dict:
    ip = resolve_domain(domain)
    if not ip:
        return {"error": f"Could not resolve domain: {domain}", "ip": None}

    common_ports = {
        21: "FTP",
        22: "SSH",
        23: "Telnet",
        25: "SMTP",
        53: "DNS",
        80: "HTTP",
        110: "POP3",
        143: "IMAP",
        443: "HTTPS",
        445: "SMB",
        993: "IMAPS",
        995: "POP3S",
        3306: "MySQL",
        3389: "RDP",
        5432: "PostgreSQL",
        8080: "HTTP-Proxy",
        8443: "HTTPS-Alt",
        8888: "HTTP-Alt",
    }

    open_ports = []
    closed_count = 0
    start_time = datetime.utcnow()

    for port, service in common_ports.items():
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.5)
            result = sock.connect_ex((ip, port))
            if result == 0:
                # Try to grab banner
                banner = ""
                try:
                    sock.send(b"HEAD / HTTP/1.0\r\n\r\n")
                    banner = sock.recv(256).decode("utf-8", errors="ignore").strip()
                    if len(banner) > 120:
                        banner = banner[:120] + "..."
                except Exception:
                    pass

                open_ports.append({
                    "port": port,
                    "service": service,
                    "state": "open",
                    "banner": banner or None,
                })
            else:
                closed_count += 1
            sock.close()
        except Exception:
            closed_count += 1

    end_time = datetime.utcnow()
    scan_duration = (end_time - start_time).total_seconds()

    # Risk assessment
    risky_ports = {21, 23, 445, 3306, 3389, 5432}
    risk_findings = []
    risk_score = 0

    for p in open_ports:
        if p["port"] in risky_ports:
            risk_findings.append(f"Port {p['port']} ({p['service']}) is open — often targeted by attackers")
            risk_score += 15
        if p["port"] == 23:
            risk_findings.append("Telnet (23) is unencrypted and highly insecure")
            risk_score += 20
        if p["port"] == 3389:
            risk_findings.append("RDP (3389) exposed to internet — brute-force risk")
            risk_score += 20

    if len(open_ports) > 8:
        risk_findings.append(f"High number of open ports ({len(open_ports)}) increases attack surface")
        risk_score += 10

    risk_score = min(risk_score, 100)
    risk_level = "Critical" if risk_score >= 60 else "Medium" if risk_score >= 30 else "Low"

    return {
        "domain": domain,
        "ip": ip,
        "scan_time": start_time.isoformat(),
        "scan_duration_seconds": round(scan_duration, 2),
        "total_ports_scanned": len(common_ports),
        "open_ports": open_ports,
        "open_count": len(open_ports),
        "closed_count": closed_count,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_findings": risk_findings,
    }