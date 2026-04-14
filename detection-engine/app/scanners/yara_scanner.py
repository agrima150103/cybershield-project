import os
import re
import yara
import requests
from urllib.parse import urlparse

RULES_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'yara_rules')


def ensure_rules_dir():
    os.makedirs(RULES_DIR, exist_ok=True)


def get_default_rules():
    return {
        "phishing_login_form": '''
rule phishing_login_form {
    meta:
        description = "Detects fake login pages with credential harvesting forms"
        severity = "high"
        category = "credential_harvesting"
    strings:
        $form = "<form" nocase
        $password = "type=\"password\"" nocase
        $password2 = "type='password'" nocase
        $submit = "type=\"submit\"" nocase
        $submit2 = "type='submit'" nocase
        $login_word = /log.?in/i
        $signin_word = /sign.?in/i
        $verify = "verify" nocase
    condition:
        $form and ($password or $password2) and ($submit or $submit2) and any of ($login_word, $signin_word, $verify)
}
''',
        "paypal_phishing": '''
rule paypal_phishing {
    meta:
        description = "Detects PayPal phishing page indicators"
        severity = "critical"
        category = "brand_impersonation"
    strings:
        $paypal_text = "paypal" nocase
        $paypal_logo = "paypal-logo" nocase
        $paypal_img = "paypal.com/logo" nocase
        $password = "type=\"password\"" nocase
        $form = "<form" nocase
        $not_paypal_domain = "paypal.com" nocase
    condition:
        ($paypal_text or $paypal_logo or $paypal_img) and $password and $form
}
''',
        "microsoft_phishing": '''
rule microsoft_phishing {
    meta:
        description = "Detects Microsoft/Office365 phishing indicators"
        severity = "critical"
        category = "brand_impersonation"
    strings:
        $ms1 = "microsoft" nocase
        $ms2 = "office365" nocase
        $ms3 = "outlook" nocase
        $ms4 = "onedrive" nocase
        $ms5 = "sharepoint" nocase
        $password = "type=\"password\"" nocase
        $form = "<form" nocase
    condition:
        any of ($ms1, $ms2, $ms3, $ms4, $ms5) and $password and $form
}
''',
        "urgency_social_engineering": '''
rule urgency_social_engineering {
    meta:
        description = "Detects social engineering urgency language"
        severity = "medium"
        category = "social_engineering"
    strings:
        $urgent1 = "your account has been" nocase
        $urgent2 = "suspended" nocase
        $urgent3 = "unauthorized" nocase
        $urgent4 = "verify your identity" nocase
        $urgent5 = "confirm your account" nocase
        $urgent6 = "within 24 hours" nocase
        $urgent7 = "immediate action" nocase
        $urgent8 = "account will be closed" nocase
        $urgent9 = "unusual activity" nocase
        $urgent10 = "security alert" nocase
    condition:
        3 of them
}
''',
        "credential_exfiltration": '''
rule credential_exfiltration {
    meta:
        description = "Detects credential exfiltration techniques"
        severity = "high"
        category = "data_theft"
    strings:
        $ajax1 = "XMLHttpRequest" nocase
        $ajax2 = "fetch(" nocase
        $ajax3 = "$.ajax" nocase
        $ajax4 = "$.post" nocase
        $password = "password" nocase
        $form_data = "FormData" nocase
        $encode1 = "btoa(" nocase
        $encode2 = "encodeURI" nocase
        $telegram = "api.telegram.org" nocase
        $discord = "discord.com/api/webhooks" nocase
    condition:
        any of ($ajax1, $ajax2, $ajax3, $ajax4) and $password and any of ($form_data, $encode1, $encode2, $telegram, $discord)
}
''',
        "obfuscated_redirect": '''
rule obfuscated_redirect {
    meta:
        description = "Detects obfuscated redirects hiding malicious destinations"
        severity = "medium"
        category = "evasion"
    strings:
        $redir1 = "window.location" nocase
        $redir2 = "document.location" nocase
        $redir3 = "location.href" nocase
        $redir4 = "location.replace" nocase
        $redir5 = "meta http-equiv=\"refresh\"" nocase
        $obf1 = "eval(" nocase
        $obf2 = "atob(" nocase
        $obf3 = "String.fromCharCode" nocase
        $obf4 = "unescape(" nocase
        $obf5 = "decodeURIComponent" nocase
    condition:
        any of ($redir1, $redir2, $redir3, $redir4, $redir5) and any of ($obf1, $obf2, $obf3, $obf4, $obf5)
}
''',
        "data_uri_phishing": '''
rule data_uri_phishing {
    meta:
        description = "Detects data URI based phishing"
        severity = "high"
        category = "evasion"
    strings:
        $data_uri = "data:text/html" nocase
        $base64 = ";base64," nocase
        $iframe = "<iframe" nocase
        $hidden = "display:none" nocase
        $hidden2 = "visibility:hidden" nocase
        $zero_size = "width:0" nocase
    condition:
        $data_uri and $base64 and any of ($iframe, $hidden, $hidden2, $zero_size)
}
''',
    }


def compile_rules():
    rules_dict = get_default_rules()
    compiled = {}
    errors = []

    for name, source in rules_dict.items():
        try:
            compiled[name] = yara.compile(source=source)
        except yara.SyntaxError as e:
            errors.append({"rule": name, "error": str(e)})

    return compiled, errors


def fetch_page_content(url: str) -> dict:
    try:
        if not url.startswith('http'):
            url = f'http://{url}'

        resp = requests.get(url, timeout=8, verify=False, allow_redirects=True, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        return {
            "status_code": resp.status_code,
            "content": resp.text,
            "final_url": str(resp.url),
            "content_length": len(resp.text),
            "headers": dict(resp.headers),
        }
    except Exception as e:
        return {"error": str(e), "content": ""}


def scan_url_with_yara(url: str) -> dict:
    page = fetch_page_content(url)

    if page.get("error"):
        return {
            "url": url,
            "error": page["error"],
            "matches": [],
            "total_matches": 0,
            "risk_score": 0,
            "risk_level": "Unknown",
        }

    content = page.get("content", "")
    if not content:
        return {
            "url": url,
            "error": "Empty page content",
            "matches": [],
            "total_matches": 0,
            "risk_score": 0,
            "risk_level": "Low",
        }

    compiled_rules, compile_errors = compile_rules()
    matches = []
    total_score = 0

    severity_scores = {
        "critical": 30,
        "high": 20,
        "medium": 10,
        "low": 5,
    }

    for name, rule in compiled_rules.items():
        try:
            yara_matches = rule.match(data=content)
            for m in yara_matches:
                meta = m.meta
                severity = meta.get("severity", "medium")
                score = severity_scores.get(severity, 10)
                total_score += score

                matched_strings = []
                for s in m.strings:
                    for instance in s.instances:
                        decoded = instance.plaintext().decode('utf-8', errors='ignore')
                        if len(decoded) > 80:
                            decoded = decoded[:80] + "..."
                        matched_strings.append({
                            "identifier": s.identifier,
                            "matched_text": decoded,
                        })

                matches.append({
                    "rule_name": m.rule,
                    "description": meta.get("description", ""),
                    "severity": severity,
                    "category": meta.get("category", "unknown"),
                    "score_contribution": score,
                    "matched_strings": matched_strings[:5],
                })
        except Exception:
            pass

    total_score = min(total_score, 100)
    risk_level = "Critical" if total_score >= 70 else "High" if total_score >= 50 else "Medium" if total_score >= 25 else "Low"

    page_analysis = {
        "has_forms": "<form" in content.lower(),
        "has_password_field": 'type="password"' in content.lower() or "type='password'" in content.lower(),
        "has_external_scripts": bool(re.findall(r'<script[^>]+src=["\']https?://', content, re.I)),
        "has_iframe": "<iframe" in content.lower(),
        "has_obfuscation": any(x in content.lower() for x in ["eval(", "atob(", "string.fromcharcode", "unescape("]),
        "has_data_uri": "data:text/html" in content.lower(),
        "content_length": len(content),
        "external_links_count": len(re.findall(r'https?://[^\s"\'<>]+', content)),
    }

    return {
        "url": url,
        "final_url": page.get("final_url", url),
        "status_code": page.get("status_code"),
        "matches": matches,
        "total_matches": len(matches),
        "risk_score": total_score,
        "risk_level": risk_level,
        "page_analysis": page_analysis,
        "rules_loaded": len(compiled_rules),
        "compile_errors": compile_errors,
    }


def get_rules_info() -> dict:
    rules_dict = get_default_rules()
    info = []
    for name, source in rules_dict.items():
        meta = {}
        for line in source.split('\n'):
            line = line.strip()
            if '=' in line and line.endswith('"'):
                key = line.split('=')[0].strip()
                val = line.split('=', 1)[1].strip().strip('"')
                meta[key] = val
        info.append({
            "name": name,
            "description": meta.get("description", ""),
            "severity": meta.get("severity", "unknown"),
            "category": meta.get("category", "unknown"),
        })
    return {"rules": info, "total": len(info)}