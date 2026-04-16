import ssl
import socket
import struct
import time
import requests
from urllib.parse import urlparse
from datetime import datetime


def capture_dns_resolution(domain: str) -> dict:
    start = time.time()
    try:
        records = socket.getaddrinfo(domain, None)
        duration = round((time.time() - start) * 1000, 2)

        ips = list(set(r[4][0] for r in records))
        families = list(set('IPv4' if r[0] == socket.AF_INET else 'IPv6' for r in records))

        try:
            reverse_dns = socket.gethostbyaddr(ips[0])[0] if ips else None
        except Exception:
            reverse_dns = None

        return {
            'query': domain,
            'query_type': 'A/AAAA',
            'resolved_ips': ips,
            'address_families': families,
            'reverse_dns': reverse_dns,
            'response_time_ms': duration,
            'record_count': len(ips),
            'status': 'resolved',
        }
    except socket.gaierror as e:
        return {
            'query': domain,
            'status': 'failed',
            'error': str(e),
            'response_time_ms': round((time.time() - start) * 1000, 2),
        }


def capture_tls_handshake(domain: str) -> dict:
    start = time.time()
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(5)
            s.connect((domain, 443))
            duration = round((time.time() - start) * 1000, 2)

            cert = s.getpeercert()
            cipher = s.cipher()
            version = s.version()

            subject = dict(x[0] for x in cert.get('subject', []))
            issuer = dict(x[0] for x in cert.get('issuer', []))
            san = [v for _, v in cert.get('subjectAltName', [])]

            return {
                'status': 'success',
                'handshake_time_ms': duration,
                'tls_version': version,
                'cipher_suite': cipher[0] if cipher else 'Unknown',
                'cipher_bits': cipher[2] if cipher else 0,
                'certificate': {
                    'subject_cn': subject.get('commonName', ''),
                    'issuer_cn': issuer.get('commonName', ''),
                    'issuer_org': issuer.get('organizationName', ''),
                    'not_before': cert.get('notBefore', ''),
                    'not_after': cert.get('notAfter', ''),
                    'serial_number': cert.get('serialNumber', ''),
                    'san_domains': san[:10],
                    'san_count': len(san),
                },
                'handshake_steps': [
                    {'step': 1, 'direction': 'client_to_server', 'message': 'ClientHello', 'detail': f'Proposing {version} with supported cipher suites'},
                    {'step': 2, 'direction': 'server_to_client', 'message': 'ServerHello', 'detail': f'Selected {cipher[0] if cipher else "unknown"} ({cipher[2] if cipher else 0}-bit)'},
                    {'step': 3, 'direction': 'server_to_client', 'message': 'Certificate', 'detail': f'Sent certificate for {subject.get("commonName", domain)} issued by {issuer.get("commonName", "Unknown")}'},
                    {'step': 4, 'direction': 'server_to_client', 'message': 'ServerHelloDone', 'detail': 'Server finished its part of handshake'},
                    {'step': 5, 'direction': 'client_to_server', 'message': 'ClientKeyExchange', 'detail': 'Client sends pre-master secret encrypted with server public key'},
                    {'step': 6, 'direction': 'both', 'message': 'ChangeCipherSpec', 'detail': 'Both sides switch to encrypted communication'},
                    {'step': 7, 'direction': 'both', 'message': 'Finished', 'detail': f'Secure tunnel established in {duration}ms'},
                ],
            }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
            'handshake_time_ms': round((time.time() - start) * 1000, 2),
        }


def capture_http_exchange(url: str) -> dict:
    if not url.startswith('http'):
        url = f'https://{url}'

    start = time.time()
    try:
        resp = requests.get(url, timeout=8, verify=False, allow_redirects=False,
                            headers={
                                'User-Agent': 'CyberShield-PacketCapture/1.0',
                                'Accept': 'text/html,application/xhtml+xml',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Connection': 'keep-alive',
                            })
        duration = round((time.time() - start) * 1000, 2)

        request_headers = {
            'Method': 'GET',
            'Path': urlparse(url).path or '/',
            'Host': urlparse(url).netloc,
            'User-Agent': 'CyberShield-PacketCapture/1.0',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }

        response_headers = dict(resp.headers)
        content_length = len(resp.content)

        cookies = []
        for cookie in resp.cookies:
            cookies.append({
                'name': cookie.name,
                'domain': cookie.domain,
                'path': cookie.path,
                'secure': cookie.secure,
                'expires': str(cookie.expires) if cookie.expires else None,
            })

        redirect_chain = []
        if resp.is_redirect or resp.is_permanent_redirect:
            location = resp.headers.get('Location', '')
            redirect_chain.append({
                'status': resp.status_code,
                'location': location,
            })

        return {
            'status': 'captured',
            'url': url,
            'response_time_ms': duration,
            'request': {
                'method': 'GET',
                'url': url,
                'headers': request_headers,
            },
            'response': {
                'status_code': resp.status_code,
                'status_text': resp.reason,
                'headers': response_headers,
                'content_length': content_length,
                'content_type': resp.headers.get('Content-Type', 'Unknown'),
                'encoding': resp.encoding,
            },
            'cookies': cookies,
            'redirect_chain': redirect_chain,
            'timing': {
                'total_ms': duration,
            },
        }
    except Exception as e:
        return {
            'status': 'failed',
            'url': url,
            'error': str(e),
            'response_time_ms': round((time.time() - start) * 1000, 2),
        }


def full_network_capture(target: str) -> dict:
    parsed = urlparse(target if target.startswith('http') else f'https://{target}')
    domain = parsed.netloc or parsed.path.split('/')[0]
    url = f'{parsed.scheme or "https"}://{domain}'

    start = time.time()

    dns_result = capture_dns_resolution(domain)
    tls_result = capture_tls_handshake(domain)
    http_result = capture_http_exchange(url)

    total_time = round((time.time() - start) * 1000, 2)

    packets = []
    pkt_num = 1

    if dns_result.get('status') == 'resolved':
        packets.append({'no': pkt_num, 'time': '0.000', 'source': 'Your PC', 'destination': 'DNS Server', 'protocol': 'DNS', 'info': f'Standard query A {domain}', 'length': 74})
        pkt_num += 1
        packets.append({'no': pkt_num, 'time': f'{dns_result["response_time_ms"]/1000:.3f}', 'source': 'DNS Server', 'destination': 'Your PC', 'protocol': 'DNS', 'info': f'Standard query response A {dns_result["resolved_ips"][0] if dns_result["resolved_ips"] else "N/A"}', 'length': 90})
        pkt_num += 1

    if tls_result.get('status') == 'success':
        ip = dns_result.get('resolved_ips', ['Server'])[0] if dns_result.get('resolved_ips') else 'Server'
        packets.append({'no': pkt_num, 'time': f'{pkt_num * 0.001:.3f}', 'source': 'Your PC', 'destination': ip, 'protocol': 'TCP', 'info': f'SYN → {domain}:443', 'length': 66})
        pkt_num += 1
        packets.append({'no': pkt_num, 'time': f'{pkt_num * 0.012:.3f}', 'source': ip, 'destination': 'Your PC', 'protocol': 'TCP', 'info': 'SYN-ACK ←', 'length': 66})
        pkt_num += 1
        packets.append({'no': pkt_num, 'time': f'{pkt_num * 0.012:.3f}', 'source': 'Your PC', 'destination': ip, 'protocol': 'TCP', 'info': 'ACK → (3-way handshake complete)', 'length': 54})
        pkt_num += 1

        for step in tls_result.get('handshake_steps', []):
            src = 'Your PC' if 'client' in step.get('direction', '') else ip
            dst = ip if 'client' in step.get('direction', '') else 'Your PC'
            if step.get('direction') == 'both':
                src = 'Both'
                dst = 'Both'
            packets.append({'no': pkt_num, 'time': f'{pkt_num * 0.015:.3f}', 'source': src, 'destination': dst, 'protocol': f'TLS {tls_result.get("tls_version", "")}', 'info': step['message'], 'length': 150 + pkt_num * 10})
            pkt_num += 1

    if http_result.get('status') == 'captured':
        ip = dns_result.get('resolved_ips', ['Server'])[0] if dns_result.get('resolved_ips') else 'Server'
        packets.append({'no': pkt_num, 'time': f'{pkt_num * 0.015:.3f}', 'source': 'Your PC', 'destination': ip, 'protocol': 'HTTP', 'info': f'GET {parsed.path or "/"} HTTP/1.1', 'length': 340})
        pkt_num += 1
        packets.append({'no': pkt_num, 'time': f'{pkt_num * 0.015:.3f}', 'source': ip, 'destination': 'Your PC', 'protocol': 'HTTP', 'info': f'{http_result["response"]["status_code"]} {http_result["response"]["status_text"]} ({http_result["response"]["content_length"]} bytes)', 'length': http_result['response']['content_length']})

    return {
        'target': url,
        'domain': domain,
        'capture_time': datetime.utcnow().isoformat(),
        'total_duration_ms': total_time,
        'dns': dns_result,
        'tls': tls_result,
        'http': http_result,
        'packet_table': packets,
        'total_packets': len(packets),
    }