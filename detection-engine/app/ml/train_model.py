import os
import json
import random
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
import joblib

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')

# --- Synthetic data generator ---

LEGIT_DOMAINS = [
    'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org', 'linkedin.com', 'twitter.com',
    'netflix.com', 'youtube.com', 'reddit.com', 'instagram.com', 'whatsapp.com',
    'zoom.us', 'dropbox.com', 'slack.com', 'spotify.com', 'paypal.com',
    'bbc.co.uk', 'nytimes.com', 'cnn.com', 'medium.com', 'notion.so',
]

PHISH_PATTERNS = [
    'secure-login-{domain}.com', '{domain}-verify.net', 'update-{domain}.info',
    '{domain}-account.xyz', 'signin-{domain}.co', '{domain}.security-check.com',
    'www-{domain}.tk', '{domain}-support.ml', 'auth-{domain}.ga',
    '{domain}.com.suspicious-site.net', 'login.{domain}.phishsite.com',
]

SUSPICIOUS_WORDS = [
    'login', 'signin', 'verify', 'account', 'update', 'secure',
    'banking', 'confirm', 'password', 'suspend', 'alert', 'urgent',
]

SUSPICIOUS_PATHS = [
    '/login', '/signin', '/verify-account', '/update-info', '/secure/auth',
    '/account/confirm', '/password-reset', '/banking/login', '/wallet/verify',
    '/cgi-bin/login.php', '/wp-admin/login.php', '/.env', '/admin/auth',
]

def random_ip():
    return f"{random.randint(1,254)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def generate_legit_url():
    domain = random.choice(LEGIT_DOMAINS)
    scheme = 'https'
    paths = ['', '/', '/about', '/contact', '/products', '/docs', '/help', '/blog', f'/page/{random.randint(1,100)}']
    path = random.choice(paths)
    return f"{scheme}://{domain}{path}"

def generate_phish_url():
    target = random.choice(LEGIT_DOMAINS).replace('.com','').replace('.org','').replace('.co.uk','')
    pattern = random.choice(PHISH_PATTERNS)
    domain = pattern.format(domain=target)

    use_ip = random.random() < 0.25
    if use_ip:
        domain = random_ip()

    scheme = random.choice(['http', 'https']) if random.random() < 0.6 else 'http'
    path = random.choice(SUSPICIOUS_PATHS + ['', '/'])

    extra = ''
    if random.random() < 0.3:
        extra = f"?token={''.join(random.choices('abcdef0123456789', k=32))}"
    if random.random() < 0.15:
        extra += f"&redirect=https://{random.choice(LEGIT_DOMAINS)}"

    subdomain = ''
    if random.random() < 0.35:
        subdomain = f"{random.choice(['secure','login','auth','www','mail','account'])}."

    return f"{scheme}://{subdomain}{domain}{path}{extra}"

def extract_features_from_url(url):
    from urllib.parse import urlparse
    import re

    parsed = urlparse(url if url.startswith('http') else f'http://{url}')
    domain = parsed.netloc or ''
    path = parsed.path or ''
    query = parsed.query or ''

    return [
        len(url),                                                             # url_length
        len(domain),                                                          # domain_length
        len(path),                                                            # path_length
        1 if re.match(r'\d+\.\d+\.\d+\.\d+', domain) else 0,               # has_ip
        1 if '@' in url else 0,                                               # has_at
        1 if '//' in path else 0,                                             # double_slash
        max(len(domain.split('.')) - 2, 0),                                   # subdomain_count
        1 if parsed.scheme == 'https' else 0,                                 # has_https
        sum(1 for w in SUSPICIOUS_WORDS if w in url.lower()),                # suspicious_word_count
        len(re.findall(r'[-_~!$&@#%]', url)),                               # special_char_count
        len(re.findall(r'\d', domain)),                                       # digit_count_domain
        1 if any(s in domain for s in ['bit.ly','tinyurl','goo.gl','t.co']) else 0,  # is_shortened
        1 if domain.startswith('xn--') else 0,                               # has_punycode
        len(query),                                                           # query_length
        query.count('&'),                                                     # param_count
        1 if 'redirect' in query.lower() or 'url=' in query.lower() else 0, # has_redirect_param
        url.count('.'),                                                       # total_dots
        url.count('-'),                                                       # total_hyphens
        len(path.split('/')) - 1,                                             # path_depth
        1 if any(ext in path.lower() for ext in ['.php','.cgi','.asp','.jsp']) else 0,  # has_server_script
    ]

FEATURE_NAMES = [
    'url_length', 'domain_length', 'path_length', 'has_ip', 'has_at',
    'double_slash', 'subdomain_count', 'has_https', 'suspicious_word_count',
    'special_char_count', 'digit_count_domain', 'is_shortened', 'has_punycode',
    'query_length', 'param_count', 'has_redirect_param', 'total_dots',
    'total_hyphens', 'path_depth', 'has_server_script',
]

def generate_dataset(n_legit=3000, n_phish=3000):
    X, y = [], []

    for _ in range(n_legit):
        url = generate_legit_url()
        X.append(extract_features_from_url(url))
        y.append(0)

    for _ in range(n_phish):
        url = generate_phish_url()
        X.append(extract_features_from_url(url))
        y.append(1)

    return np.array(X), np.array(y)

def train():
    print("[ML] Generating synthetic dataset...")
    X, y = generate_dataset(n_legit=5000, n_phish=5000)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"[ML] Training set: {len(X_train)} samples")
    print(f"[ML] Test set:     {len(X_test)} samples")

    # Train Random Forest
    rf = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    # Train Gradient Boosting
    gb = GradientBoostingClassifier(n_estimators=120, max_depth=6, learning_rate=0.1, random_state=42)
    gb.fit(X_train, y_train)

    # Evaluate both
    print("\n--- Random Forest ---")
    rf_pred = rf.predict(X_test)
    print(classification_report(y_test, rf_pred, target_names=['Legit', 'Phishing']))

    print("--- Gradient Boosting ---")
    gb_pred = gb.predict(X_test)
    print(classification_report(y_test, gb_pred, target_names=['Legit', 'Phishing']))

    # Cross-validation
    rf_cv = cross_val_score(rf, X, y, cv=5, scoring='accuracy')
    gb_cv = cross_val_score(gb, X, y, cv=5, scoring='accuracy')
    print(f"[ML] RF 5-fold CV accuracy:  {rf_cv.mean():.4f} (+/- {rf_cv.std():.4f})")
    print(f"[ML] GB 5-fold CV accuracy:  {gb_cv.mean():.4f} (+/- {gb_cv.std():.4f})")

    # Feature importance
    print("\n[ML] Top feature importances (Random Forest):")
    importances = sorted(zip(FEATURE_NAMES, rf.feature_importances_), key=lambda x: x[1], reverse=True)
    for name, imp in importances[:10]:
        print(f"  {name:30s} {imp:.4f}")

    # Save models
    os.makedirs(MODEL_DIR, exist_ok=True)

    rf_path = os.path.join(MODEL_DIR, 'phishing_rf.pkl')
    gb_path = os.path.join(MODEL_DIR, 'phishing_gb.pkl')
    meta_path = os.path.join(MODEL_DIR, 'model_meta.json')

    joblib.dump(rf, rf_path)
    joblib.dump(gb, gb_path)

    meta = {
        'feature_names': FEATURE_NAMES,
        'n_features': len(FEATURE_NAMES),
        'rf_cv_accuracy': round(float(rf_cv.mean()), 4),
        'gb_cv_accuracy': round(float(gb_cv.mean()), 4),
        'training_samples': len(X),
    }

    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\n[ML] Models saved to {MODEL_DIR}")
    print(f"  - {rf_path}")
    print(f"  - {gb_path}")
    print(f"  - {meta_path}")

    return rf, gb

if __name__ == '__main__':
    train()