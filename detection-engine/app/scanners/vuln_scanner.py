import re
import ssl
import socket
import requests
from urllib.parse import urlparse, urljoin
from datetime import datetime


def scan_security_headers(url: str) -> list:
    try:
        if not url.startswith('http'):
            url = f'https://{url}'

        resp = requests.get(url, timeout=8, verify=False, allow_redirects=True,
                            headers={'User-Agent': 'CyberShield-VulnScanner/1.0'})
        headers = {k.lower(): v for k, v in resp.headers.items()}

        checks = []
        severity_scores = {'high': 15, 'medium': 10, 'low': 5}

        security_headers = {
            'strict-transport-security': {
                'name': 'HTTP Strict Transport Security (HSTS)',
                'severity': 'high',
                'description': 'Forces browsers to use HTTPS, preventing downgrade attacks',
                'fix': 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains',
            },
            'content-security-policy': {
                'name': 'Content Security Policy (CSP)',
                'severity': 'high',
                'description': 'Prevents XSS by controlling which resources can load',
                'fix': "Add: Content-Security-Policy: default-src 'self'",
            },
            'x-content-type-options': {
                'name': 'X-Content-Type-Options',
                'severity': 'medium',
                'description': 'Prevents MIME type sniffing attacks',
                'fix': 'Add: X-Content-Type-Options: nosniff',
            },
            'x-frame-options': {
                'name': 'X-Frame-Options',
                'severity': 'medium',
                'description': 'Prevents clickjacking by blocking iframe embedding',
                'fix': 'Add: X-Frame-Options: DENY or SAMEORIGIN',
            },
            'x-xss-protection': {
                'name': 'X-XSS-Protection',
                'severity': 'low',
                'description': 'Enables browser built-in XSS filter',
                'fix': 'Add: X-XSS-Protection: 1; mode=block',
            },
            'referrer-policy': {
                'name': 'Referrer-Policy',
                'severity': 'low',
                'description': 'Controls referrer info sent with requests',
                'fix': 'Add: Referrer-Policy: strict-origin-when-cross-origin',
            },
            'permissions-policy': {
                'name': 'Permissions-Policy',
                'severity': 'medium',
                'description': 'Controls which browser features the site can use',
                'fix': 'Add: Permissions-Policy: geolocation=(), camera=()',
            },
        }

        for key, info in security_headers.items():
            present = key in headers
            checks.append({
                'header': info['name'],
                'key': key,
                'present': present,
                'severity': info['severity'],
                'description': info['description'],
                'fix': info['fix'],
                'value': headers.get(key),
                'score': 0 if present else severity_scores.get(info['severity'], 5),
            })

        if 'server' in headers:
            checks.append({
                'header': 'Server Information Disclosure',
                'key': 'server',
                'present': True,
                'severity': 'low',
                'description': f'Server header reveals: {headers["server"]}',
                'fix': 'Remove or obfuscate the Server header',
                'value': headers['server'],
                'score': 5,
            })

        if 'x-powered-by' in headers:
            checks.append({
                'header': 'X-Powered-By Disclosure',
                'key': 'x-powered-by',
                'present': True,
                'severity': 'medium',
                'description': f'Technology disclosed: {headers["x-powered-by"]}',
                'fix': 'Remove X-Powered-By header',
                'value': headers['x-powered-by'],
                'score': 10,
            })

        return checks
    except Exception as e:
        return [{'header': 'Connection Error', 'description': str(e), 'severity': 'high', 'present': False, 'score': 0}]


def scan_ssl_vulnerabilities(domain: str) -> list:
    findings = []

    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(5)
            s.connect((domain, 443))
            cert = s.getpeercert()
            cipher = s.cipher()

            if cipher:
                cipher_name, protocol, bits = cipher
                if bits < 128:
                    findings.append({
                        'name': 'Weak cipher strength',
                        'severity': 'high',
                        'detail': f'{cipher_name} uses only {bits}-bit encryption',
                        'fix': 'Configure server to use 256-bit ciphers minimum',
                    })
                if 'RC4' in cipher_name or 'DES' in cipher_name or 'NULL' in cipher_name:
                    findings.append({
                        'name': 'Insecure cipher suite',
                        'severity': 'critical',
                        'detail': f'Using deprecated cipher: {cipher_name}',
                        'fix': 'Disable RC4, DES, NULL ciphers; use AES-GCM',
                    })
                if 'TLSv1.0' in str(protocol) or 'TLSv1.1' in str(protocol) or 'SSLv3' in str(protocol):
                    findings.append({
                        'name': 'Outdated TLS version',
                        'severity': 'high',
                        'detail': f'Using {protocol} which has known vulnerabilities',
                        'fix': 'Upgrade to TLS 1.2 or 1.3',
                    })

                findings.append({
                    'name': 'SSL/TLS Configuration',
                    'severity': 'info',
                    'detail': f'Protocol: {protocol}, Cipher: {cipher_name}, Bits: {bits}',
                    'fix': None,
                })

            not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
            days_left = (not_after - datetime.utcnow()).days

            if days_left < 0:
                findings.append({
                    'name': 'Expired SSL certificate',
                    'severity': 'critical',
                    'detail': f'Certificate expired {abs(days_left)} days ago',
                    'fix': 'Renew the SSL certificate immediately',
                })
            elif days_left < 30:
                findings.append({
                    'name': 'SSL certificate expiring soon',
                    'severity': 'medium',
                    'detail': f'Certificate expires in {days_left} days',
                    'fix': 'Renew the SSL certificate before expiry',
                })

            san = cert.get('subjectAltName', [])
            if not san:
                findings.append({
                    'name': 'Missing Subject Alternative Name',
                    'severity': 'low',
                    'detail': 'Certificate has no SAN entries',
                    'fix': 'Reissue certificate with proper SAN entries',
                })

    except ssl.SSLError as e:
        findings.append({
            'name': 'SSL connection failed',
            'severity': 'critical',
            'detail': str(e),
            'fix': 'Fix SSL configuration on the server',
        })
    except Exception as e:
        findings.append({
            'name': 'SSL check error',
            'severity': 'medium',
            'detail': str(e),
            'fix': 'Ensure port 443 is accessible and SSL is configured',
        })

    return findings


def scan_common_vulnerabilities(url: str) -> list:
    if not url.startswith('http'):
        url = f'https://{url}'

    findings = []

    sensitive_paths = [
        ('/.env', 'Environment file exposed', 'critical'),
        ('/.git/config', 'Git repository exposed', 'critical'),
        ('/wp-admin/', 'WordPress admin panel', 'medium'),
        ('/admin/', 'Admin panel accessible', 'medium'),
        ('/phpmyadmin/', 'phpMyAdmin exposed', 'high'),
        ('/server-status', 'Apache status page', 'medium'),
        ('/server-info', 'Apache info page', 'medium'),
        ('/.htaccess', 'htaccess file accessible', 'high'),
        ('/robots.txt', 'Robots.txt present', 'info'),
        ('/sitemap.xml', 'Sitemap present', 'info'),
        ('/.well-known/security.txt', 'Security.txt present', 'info'),
        ('/wp-login.php', 'WordPress login', 'medium'),
        ('/backup/', 'Backup directory', 'high'),
        ('/config.php', 'Config file exposed', 'critical'),
        ('/database/', 'Database directory', 'critical'),
        ('/api/docs', 'API documentation exposed', 'low'),
        ('/swagger/', 'Swagger UI exposed', 'low'),
        ('/graphql', 'GraphQL endpoint', 'medium'),
        ('/.DS_Store', 'macOS metadata file', 'low'),
        ('/crossdomain.xml', 'Flash crossdomain policy', 'low'),
    ]

    for path, name, severity in sensitive_paths:
        try:
            test_url = urljoin(url, path)
            resp = requests.get(test_url, timeout=4, verify=False, allow_redirects=False,
                                headers={'User-Agent': 'CyberShield-VulnScanner/1.0'})

            if resp.status_code == 200 and len(resp.text) > 0:
                is_real = resp.status_code != 404 and 'not found' not in resp.text.lower()[:200]
                if is_real:
                    findings.append({
                        'path': path,
                        'name': name,
                        'severity': severity,
                        'status_code': resp.status_code,
                        'content_length': len(resp.text),
                        'accessible': True,
                    })
        except Exception:
            pass

    return findings


def scan_cookie_security(url: str) -> list:
    findings = []
    try:
        if not url.startswith('http'):
            url = f'https://{url}'

        resp = requests.get(url, timeout=8, verify=False, allow_redirects=True)

        for cookie in resp.cookies:
            issues = []

            if not cookie.secure:
                issues.append('Missing Secure flag (cookie sent over HTTP)')
            if not cookie.has_nonstandard_attr('HttpOnly') and 'httponly' not in str(cookie).lower():
                issues.append('Missing HttpOnly flag (accessible to JavaScript)')
            if 'samesite' not in str(cookie).lower():
                issues.append('Missing SameSite attribute (CSRF risk)')

            if issues:
                findings.append({
                    'cookie_name': cookie.name,
                    'domain': cookie.domain,
                    'severity': 'medium',
                    'issues': issues,
                })
    except Exception:
        pass

    return findings


def full_vulnerability_scan(target: str) -> dict:
    parsed = urlparse(target if target.startswith('http') else f'https://{target}')
    domain = parsed.netloc or parsed.path.split('/')[0]
    url = f'{parsed.scheme or "https"}://{domain}'

    header_checks = scan_security_headers(url)
    ssl_findings = scan_ssl_vulnerabilities(domain)
    path_findings = scan_common_vulnerabilities(url)
    cookie_findings = scan_cookie_security(url)

    total_score = sum(c.get('score', 0) for c in header_checks)

    severity_scores = {'critical': 25, 'high': 15, 'medium': 10, 'low': 5, 'info': 0}
    for f in ssl_findings:
        total_score += severity_scores.get(f.get('severity', 'info'), 0)
    for f in path_findings:
        if f.get('accessible') and f.get('severity') != 'info':
            total_score += severity_scores.get(f.get('severity', 'info'), 0)
    for f in cookie_findings:
        total_score += 5

    total_score = min(total_score, 100)
    risk_level = 'Critical' if total_score >= 70 else 'High' if total_score >= 50 else 'Medium' if total_score >= 25 else 'Low'

    critical_count = sum(1 for f in ssl_findings + path_findings if f.get('severity') == 'critical')
    high_count = sum(1 for f in ssl_findings + path_findings + header_checks if f.get('severity') == 'high' and not f.get('present', True))
    medium_count = sum(1 for f in ssl_findings + path_findings + header_checks + cookie_findings if f.get('severity') == 'medium')

    return {
        'target': url,
        'domain': domain,
        'scan_time': datetime.utcnow().isoformat(),
        'header_checks': header_checks,
        'ssl_findings': ssl_findings,
        'path_findings': path_findings,
        'cookie_findings': cookie_findings,
        'risk_score': total_score,
        'risk_level': risk_level,
        'summary': {
            'critical': critical_count,
            'high': high_count,
            'medium': medium_count,
            'total_findings': critical_count + high_count + medium_count,
            'headers_missing': sum(1 for c in header_checks if not c.get('present') and c.get('key') in ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'x-xss-protection', 'referrer-policy', 'permissions-policy']),
            'paths_exposed': sum(1 for p in path_findings if p.get('accessible') and p.get('severity') != 'info'),
            'cookie_issues': len(cookie_findings),
            'ssl_issues': sum(1 for s in ssl_findings if s.get('severity') in ['critical', 'high']),
        },
    }