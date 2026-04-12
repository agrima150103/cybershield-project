import os
import re
import json
import numpy as np
from urllib.parse import urlparse
import joblib

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')

SUSPICIOUS_WORDS = [
    'login', 'signin', 'verify', 'account', 'update', 'secure',
    'banking', 'confirm', 'password', 'suspend', 'alert', 'urgent',
]

_rf_model = None
_gb_model = None
_meta = None

def _load_models():
    global _rf_model, _gb_model, _meta

    rf_path = os.path.join(MODEL_DIR, 'phishing_rf.pkl')
    gb_path = os.path.join(MODEL_DIR, 'phishing_gb.pkl')
    meta_path = os.path.join(MODEL_DIR, 'model_meta.json')

    if os.path.exists(rf_path):
        _rf_model = joblib.load(rf_path)
    if os.path.exists(gb_path):
        _gb_model = joblib.load(gb_path)
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            _meta = json.load(f)

def extract_features(url: str) -> list:
    parsed = urlparse(url if url.startswith('http') else f'http://{url}')
    domain = parsed.netloc or ''
    path = parsed.path or ''
    query = parsed.query or ''

    return [
        len(url),
        len(domain),
        len(path),
        1 if re.match(r'\d+\.\d+\.\d+\.\d+', domain) else 0,
        1 if '@' in url else 0,
        1 if '//' in path else 0,
        max(len(domain.split('.')) - 2, 0),
        1 if parsed.scheme == 'https' else 0,
        sum(1 for w in SUSPICIOUS_WORDS if w in url.lower()),
        len(re.findall(r'[-_~!$&@#%]', url)),
        len(re.findall(r'\d', domain)),
        1 if any(s in domain for s in ['bit.ly','tinyurl','goo.gl','t.co']) else 0,
        1 if domain.startswith('xn--') else 0,
        len(query),
        query.count('&'),
        1 if 'redirect' in query.lower() or 'url=' in query.lower() else 0,
        url.count('.'),
        url.count('-'),
        len(path.split('/')) - 1,
        1 if any(ext in path.lower() for ext in ['.php','.cgi','.asp','.jsp']) else 0,
    ]

def predict(url: str) -> dict:
    global _rf_model, _gb_model, _meta

    if _rf_model is None:
        _load_models()

    if _rf_model is None:
        return {
            'ml_available': False,
            'error': 'Models not trained yet. Run: python -m app.ml.train_model',
        }

    features = np.array([extract_features(url)])

    rf_proba = _rf_model.predict_proba(features)[0][1]
    rf_label = int(_rf_model.predict(features)[0])

    result = {
        'ml_available': True,
        'rf_phishing_probability': round(float(rf_proba), 4),
        'rf_prediction': 'phishing' if rf_label == 1 else 'legitimate',
    }

    if _gb_model is not None:
        gb_proba = _gb_model.predict_proba(features)[0][1]
        gb_label = int(_gb_model.predict(features)[0])
        result['gb_phishing_probability'] = round(float(gb_proba), 4)
        result['gb_prediction'] = 'phishing' if gb_label == 1 else 'legitimate'

        # Ensemble average
        ensemble = (rf_proba + gb_proba) / 2
        result['ensemble_score'] = round(float(ensemble), 4)
        result['ensemble_prediction'] = 'phishing' if ensemble > 0.5 else 'legitimate'
    else:
        result['ensemble_score'] = result['rf_phishing_probability']
        result['ensemble_prediction'] = result['rf_prediction']

    if _meta:
        result['model_accuracy'] = _meta.get('rf_cv_accuracy')

    return result