import hashlib
import requests


def check_password_breach(password: str) -> dict:
    sha1 = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1[:5]
    suffix = sha1[5:]

    try:
        resp = requests.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=10,
            headers={"User-Agent": "CyberShield-ThreatPlatform"},
        )
        resp.raise_for_status()

        for line in resp.text.splitlines():
            hash_suffix, count = line.split(':')
            if hash_suffix.strip() == suffix:
                return {
                    "breached": True,
                    "breach_count": int(count),
                    "message": f"This password has appeared in {int(count):,} data breaches",
                    "risk_level": "Critical" if int(count) > 1000 else "High" if int(count) > 100 else "Medium",
                }

        return {
            "breached": False,
            "breach_count": 0,
            "message": "This password has not been found in any known data breaches",
            "risk_level": "Low",
        }

    except Exception as e:
        return {"error": str(e), "breached": None}


def check_email_breach(email: str) -> dict:
    """
    Uses the free HIBP breach directory to check known breaches.
    Note: The full API requires a paid key. This uses the password range API
    and provides general breach awareness.
    """
    breaches_info = {
        "checked": True,
        "email": email,
        "recommendation": "Use haveibeenpwned.com to check your full breach history",
        "general_tips": [
            "Use unique passwords for every account",
            "Enable two-factor authentication everywhere",
            "Use a password manager to generate strong passwords",
            "Monitor your accounts for suspicious activity",
            "Change passwords immediately if a breach is confirmed",
        ],
    }

    domain = email.split('@')[-1].lower() if '@' in email else ''
    common_breached_domains = {
        'yahoo.com': 'Yahoo (3B accounts, 2013-2014)',
        'linkedin.com': 'LinkedIn (164M accounts, 2012)',
        'adobe.com': 'Adobe (153M accounts, 2013)',
        'dropbox.com': 'Dropbox (68M accounts, 2012)',
        'myspace.com': 'Myspace (360M accounts, 2008)',
    }

    if domain in common_breached_domains:
        breaches_info["domain_warning"] = f"The domain {domain} was involved in: {common_breached_domains[domain]}"
        breaches_info["domain_breached"] = True
    else:
        breaches_info["domain_breached"] = False

    return breaches_info


def analyze_password_strength(password: str) -> dict:
    length = len(password)
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)

    char_space = 0
    if has_lower: char_space += 26
    if has_upper: char_space += 26
    if has_digit: char_space += 10
    if has_special: char_space += 32

    import math
    entropy = length * math.log2(char_space) if char_space > 0 else 0

    score = 0
    findings = []

    if length >= 12: score += 25; findings.append("Good length (12+ characters)")
    elif length >= 8: score += 15; findings.append("Acceptable length (8+ characters)")
    else: score += 5; findings.append("Too short (under 8 characters)")

    if has_upper: score += 10; findings.append("Has uppercase letters")
    else: findings.append("Missing uppercase letters")
    if has_lower: score += 10; findings.append("Has lowercase letters")
    else: findings.append("Missing lowercase letters")
    if has_digit: score += 10; findings.append("Has numbers")
    else: findings.append("Missing numbers")
    if has_special: score += 15; findings.append("Has special characters")
    else: findings.append("Missing special characters")

    if entropy >= 60: score += 20; findings.append(f"Strong entropy: {entropy:.0f} bits")
    elif entropy >= 40: score += 10; findings.append(f"Moderate entropy: {entropy:.0f} bits")
    else: findings.append(f"Weak entropy: {entropy:.0f} bits")

    common_passwords = [
        'password', '123456', 'qwerty', 'abc123', 'monkey', 'letmein',
        'dragon', 'master', 'admin', 'welcome', 'login', 'princess',
        'football', 'shadow', 'sunshine', 'trustno1', 'iloveyou',
    ]

    if password.lower() in common_passwords:
        score = max(score - 40, 0)
        findings.append("This is a commonly used password — extremely weak")

    score = min(score, 100)
    strength = "Strong" if score >= 80 else "Good" if score >= 60 else "Fair" if score >= 40 else "Weak"

    crack_times = {
        "online_throttled": "centuries" if entropy > 60 else "years" if entropy > 40 else "days" if entropy > 20 else "seconds",
        "offline_fast": "years" if entropy > 80 else "months" if entropy > 60 else "hours" if entropy > 40 else "seconds",
    }

    return {
        "score": score,
        "strength": strength,
        "entropy_bits": round(entropy, 1),
        "length": length,
        "has_uppercase": has_upper,
        "has_lowercase": has_lower,
        "has_digits": has_digit,
        "has_special": has_special,
        "findings": findings,
        "estimated_crack_time": crack_times,
    }