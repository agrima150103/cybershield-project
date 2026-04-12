import whois
from datetime import datetime, timezone

def lookup_whois(domain: str) -> dict:
    try:
        w = whois.whois(domain)

        creation_date = w.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]

        expiration_date = w.expiration_date
        if isinstance(expiration_date, list):
            expiration_date = expiration_date[0]

        domain_age_days = None
        if creation_date:
            # Make both datetimes naive for comparison
            if creation_date.tzinfo is not None:
                creation_date = creation_date.replace(tzinfo=None)
            domain_age_days = (datetime.utcnow() - creation_date).days

        return {
            "registrar": w.registrar,
            "creation_date": str(creation_date) if creation_date else None,
            "expiration_date": str(expiration_date) if expiration_date else None,
            "domain_age_days": domain_age_days,
            "name_servers": w.name_servers if w.name_servers else [],
            "country": w.country,
            "org": w.org,
            "is_new_domain": domain_age_days is not None and domain_age_days < 90,
        }
    except Exception as e:
        return {"error": str(e)}