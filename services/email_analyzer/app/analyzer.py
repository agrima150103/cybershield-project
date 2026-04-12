import re
import email
from email import policy

def analyze_headers(raw_headers: str) -> dict:
    msg = email.message_from_string(raw_headers, policy=policy.default)

    received_chain = msg.get_all("Received", [])
    hops = parse_received_chain(received_chain)
    sender_ip = extract_sender_ip(received_chain)
    from_addr = msg.get("From", "")
    from_domain = extract_domain(from_addr)
    return_path = msg.get("Return-Path", "")
    message_id = msg.get("Message-ID", "")

    spf = check_spf(msg)
    dkim = check_dkim(msg)
    dmarc = check_dmarc(msg)

    is_spoofed = detect_spoofing(from_addr, return_path, spf, dkim, dmarc)

    return {
        "from": from_addr,
        "from_domain": from_domain,
        "return_path": return_path,
        "message_id": message_id,
        "sender_ip": sender_ip,
        "hops": hops,
        "hop_count": len(hops),
        "spf_result": spf,
        "dkim_result": dkim,
        "dmarc_result": dmarc,
        "is_spoofed": is_spoofed,
        "spoofing_indicators": get_spoofing_indicators(from_addr, return_path, spf, dkim, dmarc),
    }

def parse_received_chain(received_headers: list) -> list:
    hops = []
    for i, header in enumerate(received_headers):
        hop = {"raw": header, "index": i}

        from_match = re.search(r'from\s+([\w\-\.]+)', header, re.IGNORECASE)
        if from_match:
            hop["from_server"] = from_match.group(1)

        by_match = re.search(r'by\s+([\w\-\.]+)', header, re.IGNORECASE)
        if by_match:
            hop["by_server"] = by_match.group(1)

        ip_match = re.search(r'\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]', header)
        if ip_match:
            hop["ip"] = ip_match.group(1)

        date_match = re.search(r';\s*(.+)$', header)
        if date_match:
            hop["timestamp"] = date_match.group(1).strip()

        hops.append(hop)
    return hops

def extract_sender_ip(received_headers: list) -> str:
    if received_headers:
        last = received_headers[-1]
        ip_match = re.search(r'\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]', last)
        if ip_match:
            return ip_match.group(1)
    return ""

def extract_domain(from_addr: str) -> str:
    match = re.search(r'@([\w\-\.]+)', from_addr)
    return match.group(1) if match else ""

def check_spf(msg) -> str:
    spf_header = msg.get("Received-SPF", "")
    auth_results = msg.get("Authentication-Results", "")

    if "pass" in spf_header.lower():
        return "pass"
    if "fail" in spf_header.lower():
        return "fail"
    if "softfail" in spf_header.lower():
        return "softfail"

    spf_match = re.search(r'spf=(pass|fail|softfail|neutral|none)', auth_results, re.IGNORECASE)
    if spf_match:
        return spf_match.group(1).lower()

    return "unknown"

def check_dkim(msg) -> str:
    auth_results = msg.get("Authentication-Results", "")
    dkim_match = re.search(r'dkim=(pass|fail|neutral|none)', auth_results, re.IGNORECASE)
    if dkim_match:
        return dkim_match.group(1).lower()

    if msg.get("DKIM-Signature"):
        return "present"
    return "unknown"

def check_dmarc(msg) -> str:
    auth_results = msg.get("Authentication-Results", "")
    dmarc_match = re.search(r'dmarc=(pass|fail|none)', auth_results, re.IGNORECASE)
    if dmarc_match:
        return dmarc_match.group(1).lower()
    return "unknown"

def detect_spoofing(from_addr, return_path, spf, dkim, dmarc) -> bool:
    from_domain = extract_domain(from_addr)
    rp_domain = extract_domain(return_path)

    if from_domain and rp_domain and from_domain.lower() != rp_domain.lower():
        return True
    if spf == "fail":
        return True
    if dkim == "fail":
        return True
    if dmarc == "fail":
        return True
    return False

def get_spoofing_indicators(from_addr, return_path, spf, dkim, dmarc) -> list:
    indicators = []
    from_domain = extract_domain(from_addr)
    rp_domain = extract_domain(return_path)

    if from_domain and rp_domain and from_domain.lower() != rp_domain.lower():
        indicators.append(f"From domain ({from_domain}) differs from Return-Path domain ({rp_domain})")
    if spf == "fail":
        indicators.append("SPF check failed — sender IP not authorized")
    if spf == "softfail":
        indicators.append("SPF softfail — sender IP not fully authorized")
    if dkim == "fail":
        indicators.append("DKIM signature verification failed")
    if dmarc == "fail":
        indicators.append("DMARC policy check failed")
    if spf == "unknown" and dkim == "unknown":
        indicators.append("No SPF or DKIM authentication found")
    return indicators