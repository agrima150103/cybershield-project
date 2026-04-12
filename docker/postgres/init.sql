-- Users & Auth
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scanned URLs
CREATE TABLE url_scans (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    domain VARCHAR(255),
    threat_score FLOAT DEFAULT 0,
    is_malicious BOOLEAN DEFAULT FALSE,
    scan_source VARCHAR(50), -- 'user', 'extension', 'feed'
    features JSONB, -- ML feature vector stored here
    virustotal_result JSONB,
    safe_browsing_result JSONB,
    whois_data JSONB,
    ssl_info JSONB,
    scanned_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Threat feeds
CREATE TABLE threat_entries (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    source VARCHAR(100), -- 'phishtank', 'openphish', 'abusech'
    threat_type VARCHAR(50), -- 'phishing', 'malware', 'c2'
    confidence FLOAT,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    metadata JSONB
);

CREATE INDEX idx_threat_entries_url ON threat_entries(url);
CREATE INDEX idx_url_scans_domain ON url_scans(domain);

-- Community reports
CREATE TABLE community_reports (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    reported_by INTEGER REFERENCES users(id),
    reason TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'dismissed')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Email analyses
CREATE TABLE email_analyses (
    id SERIAL PRIMARY KEY,
    raw_headers TEXT NOT NULL,
    sender_ip VARCHAR(45),
    from_domain VARCHAR(255),
    spf_result VARCHAR(20),
    dkim_result VARCHAR(20),
    dmarc_result VARCHAR(20),
    is_spoofed BOOLEAN DEFAULT FALSE,
    analyzed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);