import re
import requests
from urllib.parse import urljoin
from datetime import datetime


def nikto_scan(target: str) -> dict:
    if not target.startswith('http'):
        target = f'https://{target}'

    findings = []
    start_time = datetime.utcnow()

    try:
        resp = requests.get(target, timeout=8, verify=False, allow_redirects=True,
                            headers={'User-Agent': 'CyberShield-Nikto/1.0'})
        headers = {k.lower(): v for k, v in resp.headers.items()}
        body = resp.text.lower()
    except Exception as e:
        return {'error': str(e), 'target': target}

    # 1. Server technology fingerprinting
    server = headers.get('server', '')
    powered_by = headers.get('x-powered-by', '')

    if server:
        findings.append({
            'id': 'NIKTO-001',
            'category': 'Information Disclosure',
            'title': f'Server header reveals: {server}',
            'severity': 'low',
            'description': 'Server version information helps attackers find known exploits',
            'reference': 'CWE-200: Exposure of Sensitive Information',
        })

        version_match = re.search(r'(\d+\.\d+[\.\d]*)', server)
        if version_match:
            findings.append({
                'id': 'NIKTO-002',
                'category': 'Information Disclosure',
                'title': f'Exact version number exposed: {version_match.group(1)}',
                'severity': 'medium',
                'description': 'Specific version numbers allow targeted CVE exploitation',
                'reference': 'OWASP: Security Misconfiguration',
            })

    if powered_by:
        findings.append({
            'id': 'NIKTO-003',
            'category': 'Information Disclosure',
            'title': f'X-Powered-By reveals: {powered_by}',
            'severity': 'medium',
            'description': 'Technology stack disclosure aids reconnaissance',
            'reference': 'CWE-200',
        })

    # 2. HTTP method testing
    try:
        options_resp = requests.options(target, timeout=5, verify=False)
        allow = options_resp.headers.get('allow', '')
        if allow:
            methods = [m.strip() for m in allow.split(',')]
            dangerous = [m for m in methods if m in ['PUT', 'DELETE', 'TRACE', 'CONNECT']]
            if dangerous:
                findings.append({
                    'id': 'NIKTO-010',
                    'category': 'Dangerous HTTP Methods',
                    'title': f'Dangerous methods enabled: {", ".join(dangerous)}',
                    'severity': 'high',
                    'description': 'PUT allows file upload, DELETE allows file removal, TRACE enables XST attacks',
                    'reference': 'OWASP: Security Misconfiguration',
                })

        try:
            trace_resp = requests.request('TRACE', target, timeout=5, verify=False)
            if trace_resp.status_code == 200 and 'TRACE' in trace_resp.text.upper():
                findings.append({
                    'id': 'NIKTO-011',
                    'category': 'Dangerous HTTP Methods',
                    'title': 'TRACE method is enabled (XST vulnerability)',
                    'severity': 'medium',
                    'description': 'Cross-Site Tracing can steal cookies and credentials',
                    'reference': 'CWE-693',
                })
        except Exception:
            pass
    except Exception:
        pass

    # 3. Directory listing check
    common_dirs = ['/images/', '/css/', '/js/', '/uploads/', '/static/', '/assets/', '/media/', '/files/']
    for dir_path in common_dirs:
        try:
            dir_url = urljoin(target, dir_path)
            dir_resp = requests.get(dir_url, timeout=4, verify=False, allow_redirects=False)
            if dir_resp.status_code == 200:
                text = dir_resp.text.lower()
                if 'index of' in text or 'directory listing' in text or '<pre>' in text:
                    findings.append({
                        'id': 'NIKTO-020',
                        'category': 'Directory Listing',
                        'title': f'Directory listing enabled: {dir_path}',
                        'severity': 'medium',
                        'description': 'Exposes file structure and potentially sensitive files',
                        'reference': 'CWE-548: Exposure of Information Through Directory Listing',
                    })
                    break
        except Exception:
            pass

    # 4. Common dangerous files
    dangerous_files = [
        ('/phpinfo.php', 'phpinfo() exposed', 'high', 'Reveals full server configuration'),
        ('/test.php', 'Test file accessible', 'medium', 'Test files may contain debug info'),
        ('/info.php', 'PHP info file', 'high', 'Reveals PHP configuration'),
        ('/debug/', 'Debug endpoint', 'high', 'Debug mode may expose stack traces'),
        ('/.git/HEAD', 'Git repository exposed', 'critical', 'Entire source code can be downloaded'),
        ('/.svn/entries', 'SVN repository exposed', 'critical', 'Version control metadata exposed'),
        ('/.env', 'Environment file', 'critical', 'May contain API keys and passwords'),
        ('/wp-config.php.bak', 'WordPress config backup', 'critical', 'Database credentials exposed'),
        ('/config.yml', 'Config file accessible', 'high', 'Application configuration exposed'),
        ('/dump.sql', 'SQL dump file', 'critical', 'Database contents exposed'),
        ('/backup.zip', 'Backup archive', 'critical', 'Full application backup downloadable'),
        ('/error_log', 'Error log accessible', 'medium', 'Log files reveal internal paths'),
        ('/access_log', 'Access log accessible', 'medium', 'Request logs exposed'),
        ('/composer.json', 'Composer manifest', 'low', 'PHP dependencies disclosed'),
        ('/package.json', 'NPM manifest', 'low', 'Node.js dependencies disclosed'),
        ('/Dockerfile', 'Dockerfile exposed', 'medium', 'Container configuration revealed'),
        ('/docker-compose.yml', 'Docker Compose exposed', 'high', 'Infrastructure configuration'),
    ]

    for path, title, severity, desc in dangerous_files:
        try:
            file_url = urljoin(target, path)
            file_resp = requests.get(file_url, timeout=3, verify=False, allow_redirects=False)
            if file_resp.status_code == 200 and len(file_resp.text) > 10:
                content = file_resp.text.lower()[:300]
                if 'not found' not in content and '404' not in content and '<html' not in content[:50]:
                    findings.append({
                        'id': f'NIKTO-0{30 + dangerous_files.index((path, title, severity, desc))}',
                        'category': 'Sensitive File Exposure',
                        'title': f'{title}: {path}',
                        'severity': severity,
                        'description': desc,
                        'reference': 'CWE-538: Insertion of Sensitive Information into Externally-Accessible File',
                    })
        except Exception:
            pass

    # 5. Content analysis
    if '<input' in body and 'autocomplete' not in body:
        findings.append({
            'id': 'NIKTO-050',
            'category': 'Form Security',
            'title': 'Forms without autocomplete=off',
            'severity': 'low',
            'description': 'Browsers may cache sensitive form data',
            'reference': 'CWE-524: Use of Cache that Contains Sensitive Information',
        })

    if '<!--' in body:
        comments = re.findall(r'<!--(.*?)-->', resp.text, re.DOTALL)
        sensitive = [c for c in comments if any(w in c.lower() for w in ['todo', 'fixme', 'hack', 'password', 'key', 'secret', 'debug', 'admin'])]
        if sensitive:
            findings.append({
                'id': 'NIKTO-051',
                'category': 'Information Disclosure',
                'title': f'Sensitive HTML comments found ({len(sensitive)} occurrences)',
                'severity': 'low',
                'description': 'Comments may reveal internal logic, credentials, or TODO items',
                'reference': 'CWE-615: Inclusion of Sensitive Information in Source Code Comments',
            })

    # 6. CORS misconfiguration
    try:
        cors_resp = requests.get(target, timeout=5, verify=False,
                                  headers={'Origin': 'https://evil-attacker.com'})
        acao = cors_resp.headers.get('access-control-allow-origin', '')
        if acao == '*' or 'evil-attacker.com' in acao:
            findings.append({
                'id': 'NIKTO-060',
                'category': 'CORS Misconfiguration',
                'title': 'Wildcard or reflective CORS policy',
                'severity': 'high',
                'description': 'Any website can make authenticated requests to this server',
                'reference': 'CWE-942: Permissive Cross-domain Policy',
            })
    except Exception:
        pass

    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    severity_scores = {'critical': 25, 'high': 15, 'medium': 10, 'low': 5}
    risk_score = min(sum(severity_scores.get(f['severity'], 0) for f in findings), 100)
    risk_level = 'Critical' if risk_score >= 70 else 'High' if risk_score >= 50 else 'Medium' if risk_score >= 25 else 'Low'

    return {
        'target': target,
        'scan_time': start_time.isoformat(),
        'scan_duration': round(duration, 2),
        'findings': findings,
        'total_findings': len(findings),
        'risk_score': risk_score,
        'risk_level': risk_level,
        'summary': {
            'critical': sum(1 for f in findings if f['severity'] == 'critical'),
            'high': sum(1 for f in findings if f['severity'] == 'high'),
            'medium': sum(1 for f in findings if f['severity'] == 'medium'),
            'low': sum(1 for f in findings if f['severity'] == 'low'),
        },
        'server_info': {
            'server': server,
            'powered_by': powered_by,
            'status_code': resp.status_code if 'resp' in dir() else None,
        },
    }