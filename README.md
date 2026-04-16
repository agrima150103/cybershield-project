# 🛡️ CyberShield — Real-Time Cyber Threat Intelligence Platform

A full-stack **Security Operations Center (SOC)** dashboard that combines machine learning, real-time threat detection, phishing simulation, penetration testing, and network reconnaissance into a unified cybersecurity platform.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-FastAPI-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Cybersecurity Tools Integrated](#cybersecurity-tools-integrated)
- [Getting Started](#getting-started)
- [API Keys Setup](#api-keys-setup)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Testing Each Feature](#testing-each-feature)
- [Screenshots](#screenshots)

---

## Overview

CyberShield is a **mini Security Operations Center** built from scratch. It detects phishing websites using machine learning, analyzes suspicious emails for spoofing, scans servers for vulnerabilities, simulates phishing campaigns, checks passwords against breach databases, and provides real-time threat alerts — all through a modern dark-themed dashboard.

The platform covers the **full threat lifecycle**: reconnaissance (Nmap, AbuseIPDB), detection (ML models, VirusTotal, YARA rules, email analysis), simulation (GoPhish phishing campaigns), penetration testing (vulnerability scanning, Nikto-style web server analysis, Wireshark-style packet capture), and response (PDF reports, live WebSocket alerts, community reporting).

---

## Features

### 📊 Dashboard
- Real-time threat statistics with interactive charts (Recharts)
- URL Scanner with ML-powered phishing detection
- Scan history with threat score visualization
- Live WebSocket alerts for malicious URL detections
- PDF report generation for any scan result

### 🔍 URL Threat Scanner
- Extracts **20 URL features** (length, IP usage, suspicious words, subdomain count, etc.)
- Checks **SSL certificates** (issuer, age, expiry)
- Runs **WHOIS lookups** (domain age, registrar, country)
- Queries **VirusTotal** (70+ antivirus engines)
- Queries **Google Safe Browsing** database
- Runs two **ML models**: Random Forest (150 trees) + Gradient Boosting (120 trees)
- Blends heuristic scoring (60%) with ML prediction (40%)

### 📧 Email Header Analyzer
- Parses the full **Received chain** (every server hop)
- Validates **SPF** (sender IP authorization)
- Validates **DKIM** (cryptographic email signatures)
- Validates **DMARC** (domain alignment policy)
- Detects **From / Return-Path / Reply-To mismatches**
- Identifies spoofing indicators and computes threat scores

### 🔎 Network Reconnaissance
- **Port scanning** on 18 common ports (HTTP, SSH, FTP, RDP, MySQL, etc.)
- **Banner grabbing** to identify running services and versions
- **AbuseIPDB integration** — checks IP reputation against global abuse database
- Risk assessment with findings and security recommendations

### 🔓 Penetration Testing Suite
- **Vulnerability Scanner**: Security headers audit (HSTS, CSP, X-Frame-Options, etc.), SSL/TLS vulnerability detection, sensitive path discovery (20 common paths like .env, .git, wp-admin), cookie security analysis
- **Nikto-Style Web Scanner**: Server fingerprinting, HTTP method testing (PUT/DELETE/TRACE), directory listing detection, dangerous file discovery (17 file types), HTML comment analysis, CORS misconfiguration detection
- **Wireshark-Style Packet Capture**: DNS resolution timing and analysis, TLS handshake step-by-step breakdown (7 steps), HTTP request/response capture, synthetic packet table with protocol coloring

### 🎣 GoPhish Phishing Simulator
- Connects to **GoPhish** phishing simulation framework
- Monitors campaign statistics (emails sent, opened, clicked, credentials submitted)
- Analyzes landing pages for phishing indicators
- Tests CyberShield's own detection against simulated phishing URLs

### 🔬 YARA Rule Scanner
- **7 custom YARA rules** for phishing detection:
  - Credential harvesting forms
  - PayPal brand impersonation
  - Microsoft/Office365 phishing
  - Social engineering urgency language
  - Credential exfiltration (Telegram/Discord webhooks)
  - Obfuscated redirects (eval, atob, String.fromCharCode)
  - Data URI phishing
- Fetches and scans live page content server-side
- Reports matched strings with severity scores

### 🔐 Breach & Password Checker
- Checks passwords against **Have I Been Pwned** using k-Anonymity model (password never leaves your machine in full — only first 5 chars of SHA-1 hash are sent)
- **Password strength analysis** with entropy calculation
- Email domain breach history awareness
- Security recommendations

### 📡 Threat Feed Aggregator
- Pulls known threats from **PhishTank**, **abuse.ch URLhaus**, and **OpenPhish**
- Stores in PostgreSQL for searchable threat database
- Displays on dashboard with source and confidence scores

### 👥 Community Reporting
- Users submit suspicious URLs with descriptions
- Community voting system (trust/doubt)
- Admin verification and dismissal workflow

### 🌐 Chrome Browser Extension
- Chrome Manifest V3 extension
- Intercepts navigation and queries CyberShield API in real-time
- Shows warning overlay for flagged sites

### ⚡ Real-Time Alerts
- **WebSocket** server pushes live alerts to all connected users
- Scan completion notifications with ML prediction badges
- Threat alerts broadcast when malicious URLs are detected

### 📄 PDF Report Generation
- Professional threat reports using ReportLab
- Includes scan overview, SSL info, WHOIS data, URL features, ML analysis, VirusTotal results

### 🛡️ Admin Panel & Settings
- Platform-wide statistics (users, scans, threats, emails analyzed)
- User management (role changes, account deletion)
- Community report review (verify/dismiss)
- Role-based access control (admin / analyst / viewer)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React Client   │────▶│  API Gateway     │────▶│  Detection Engine   │
│  (Port 5173)    │     │  (Port 5000)     │     │  (Port 8000)        │
│                 │     │                  │     │                     │
│  - Dashboard    │     │  - JWT Auth      │     │  - URL Analysis     │
│  - Email Scan   │     │  - Rate Limiting │     │  - ML Models (RF+GB)│
│  - Recon Page   │     │  - WebSocket     │     │  - WHOIS Lookup     │
│  - Pen Testing  │     │  - Input Sanitize│     │  - VirusTotal API   │
│  - YARA Scan    │     │  - CORS / Helmet │     │  - YARA Rules       │
│  - Breach Check │     │  - Route Proxy   │     │  - Port Scanner     │
│  - GoPhish      │     │                  │     │  - AbuseIPDB        │
│  - Community    │     │                  │     │  - Breach Checker   │
│  - Admin Panel  │     │                  │     │  - Vuln Scanner     │
└─────────────────┘     └────────┬─────────┘     │  - Nikto Scanner   │
                                 │               │  - Packet Capture   │
                        ┌────────▼─────────┐     │  - PDF Reports     │
                        │  PostgreSQL 16   │     │  - GoPhish Client   │
                        │  + Redis 7       │     └─────────────────────┘
                        │  (Docker)        │
                        └──────────────────┘
```

**Request Flow:** Browser → React Client → Vite Proxy → API Gateway (auth + rate limit) → Detection Engine (analysis + ML) → PostgreSQL (save) → WebSocket (broadcast) → Dashboard (live update)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Axios, React Router |
| **API Gateway** | Node.js, Express 5, JWT, bcrypt, WebSocket, Helmet.js |
| **Detection Engine** | Python 3.12, FastAPI, scikit-learn, ReportLab, YARA |
| **Database** | PostgreSQL 16, Redis 7 |
| **Infrastructure** | Docker Compose |
| **ML Models** | Random Forest (150 trees), Gradient Boosting (120 trees) |
| **Browser Extension** | Chrome Manifest V3 |

---

## Cybersecurity Tools Integrated

| Tool | Purpose |
|------|---------|
| **Nmap** (via python-nmap) | Port scanning and service discovery |
| **GoPhish** | Phishing campaign simulation and testing |
| **YARA** | Pattern matching rules for phishing kit detection |
| **VirusTotal API** | URL scanning against 70+ antivirus engines |
| **Google Safe Browsing** | Check URLs against Google's phishing database |
| **AbuseIPDB** | IP reputation and abuse report checking |
| **Have I Been Pwned** | Password breach database (k-Anonymity) |
| **PhishTank / OpenPhish / abuse.ch** | Threat intelligence feeds |
| **SPF / DKIM / DMARC** | Email authentication validation |
| **WHOIS** | Domain registration intelligence |
| **SSL/TLS Analysis** | Certificate inspection and vulnerability detection |
| **Nikto-Style Scanner** | Web server misconfiguration detection |
| **Wireshark-Style Capture** | Network packet analysis (DNS, TLS, HTTP) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Docker Desktop** (for PostgreSQL and Redis)
- **Nmap** installed and added to PATH ([download](https://nmap.org/download.html))
- **GoPhish** ([download](https://github.com/gophish/gophish/releases)) — optional
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/agrima150103/cybershield-project.git
cd cybershield-project

# Start databases
docker-compose up -d

# Setup API Gateway
cd api-gateway
npm install
cp .env.example .env    # Edit with your settings

# Setup Detection Engine
cd ../detection-engine
pip install -r requirements.txt
cp .env.example .env    # Edit with your API keys

# Train ML Models
python -m app.ml.train_model

# Setup React Client
cd ../client
npm install
```

---

## API Keys Setup

| Service | Where to Get | Required? | Free Tier |
|---------|-------------|-----------|-----------|
| VirusTotal | [virustotal.com](https://www.virustotal.com/gui/join) | Recommended | 500 req/day |
| Google Safe Browsing | [Google Cloud Console](https://console.cloud.google.com) | Optional | 10,000 req/day |
| AbuseIPDB | [abuseipdb.com](https://www.abuseipdb.com/register) | Optional | 1,000 req/day |
| GoPhish | Run GoPhish → Account Settings → API Key | Optional | Unlimited |

The platform works without any API keys — it skips external checks and relies on heuristic + ML scoring.

---

## Running the Project

Open **4 terminal windows**:

```bash
# Terminal 1: Databases
docker-compose up -d

# Terminal 2: API Gateway (port 5000)
cd api-gateway && npm run dev

# Terminal 3: Detection Engine (port 8000)
cd detection-engine && uvicorn app.main:app --reload --port 8000

# Terminal 4: React Client (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173** → Register → Login → Start scanning!

---

## Project Structure

```
cybershield-project/
├── api-gateway/                    # Node.js/Express API Gateway
│   └── src/
│       ├── config/                 # Database and app configuration
│       ├── middleware/             # Auth (JWT), sanitization
│       ├── routes/                 # All API route handlers
│       ├── websocket/             # WebSocket server
│       └── app.js                 # Express app entry
│
├── detection-engine/               # Python/FastAPI Detection Engine
│   ├── app/
│   │   ├── api/                   # FastAPI endpoints
│   │   ├── ml/                    # ML training + prediction
│   │   └── scanners/              # All security scanners
│   └── models/                    # Trained ML models (.pkl)
│
├── client/                         # React/Vite Frontend
│   └── src/
│       ├── context/               # Auth context
│       ├── hooks/                 # WebSocket hook
│       ├── pages/                 # All page components
│       └── services/              # API client (axios)
│
├── browser-extension/              # Chrome Manifest V3
├── gophish/                        # GoPhish binary + config
├── docker-compose.yml             # PostgreSQL + Redis
└── README.md
```

---

## How It Works

### URL Scan Flow
1. User enters URL → React sends POST with JWT auth
2. API Gateway validates token, rate limits, sanitizes input
3. Detection Engine runs parallel checks: SSL, WHOIS, VirusTotal, feature extraction
4. 20 features fed into RF (150 trees) + GB (120 trees) ensemble
5. Final score = 60% heuristic + 40% ML average
6. Saved to PostgreSQL, broadcast via WebSocket
7. Dashboard shows score, ML analysis, domain intel in real-time

### ML Pipeline
- **Training:** 10,000 synthetic URLs (50/50 split)
- **Features:** 20 URL characteristics
- **Models:** Random Forest + Gradient Boosting ensemble
- **Validation:** 5-fold cross-validation

### Security Hardening
- JWT + bcrypt (12 rounds) authentication
- Role-based access control (admin/analyst/viewer)
- XSS input sanitization
- Rate limiting (200/15min global, 10/1min scans)
- Helmet.js security headers
- CORS restriction

---

## Testing Each Feature

### 📊 Dashboard — URL Scanner
| URL | Expected Result |
|-----|----------------|
| `https://google.com` | Safe — low threat score |
| `http://192.168.1.1/login` | Suspicious — IP-based URL |

### 📧 Email Analyzer — Paste This Test Header
```
Delivered-To: victim@gmail.com
Received: from mail-suspicious.example.com (mail-suspicious.example.com [185.234.72.15])
        by mx.google.com with ESMTPS id abc123;
        Mon, 14 Apr 2025 08:15:31 -0700 (PDT)
Authentication-Results: mx.google.com;
       spf=fail (google.com: domain of admin@paypal.com does not designate 185.234.72.15 as permitted sender);
       dkim=fail header.d=paypal.com;
       dmarc=fail (p=REJECT)
From: PayPal Security <admin@paypal.com>
Reply-To: hacker-collect@protonmail.com
Return-Path: <bounce@suspicious-server.ru>
To: victim@gmail.com
Subject: Urgent: Your account has been limited
Date: Mon, 14 Apr 2025 08:15:30 -0700
Message-ID: <fake123@suspicious-server.ru>
X-Mailer: PhishKit v2.1
```
**Expected:** SPF fail, DKIM fail, DMARC fail, Reply-To mismatch, suspicious Return-Path.

### 🔎 Reconnaissance
| Domain | What You'll See |
|--------|----------------|
| `scanme.nmap.org` | Nmap's official test target — has open ports |
| `google.com` | Standard web ports (80, 443) |
| `github.com` | Multiple services |

### 🔓 Penetration Testing
| Tab | Domain | What You'll See |
|-----|--------|----------------|
| Vulnerability Scan | `google.com` | Missing headers, SSL config, exposed paths |
| Nikto Scanner | `google.com` | Server disclosure, version detection |
| Packet Capture | `google.com` | DNS + TLS handshake + HTTP (Wireshark-style table) |

### 🔬 YARA Scanner
| URL | Expected Result |
|-----|----------------|
| `https://google.com` | Clean — no rules matched |
| `https://facebook.com/login` | Matches phishing_login_form rule |

### 🔐 Breach Checker
| Password | Expected Result |
|----------|----------------|
| `password123` | ~2.2 million breaches, Critical |
| `admin` | High breach count |
| `MyStr0ng!P@ss2024` | 0 breaches, Strong |

| Email | Expected Result |
|-------|----------------|
| `test@yahoo.com` | Yahoo breach warning (3B accounts) |
| `user@gmail.com` | No major domain breaches |

### 🎣 GoPhish
1. Start GoPhish, create a campaign with a cloned login page
2. View campaign stats in CyberShield's GoPhish Simulator page
3. Scan the phishing URL in Dashboard — CyberShield detects its own simulated attack

---

## Environment Variables

### API Gateway (.env)
```
PORT=5000
JWT_SECRET=your-secret-key-change-this
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cybershield
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Detection Engine (.env)
```
VIRUSTOTAL_API_KEY=your_virustotal_api_key
GOOGLE_SAFE_BROWSING_KEY=your_google_safe_browsing_key
ABUSEIPDB_API_KEY=your_abuseipdb_api_key
GOPHISH_API_KEY=your_gophish_api_key
GOPHISH_ADMIN_URL=http://127.0.0.1:3333
```

---

## License

This project is for educational and portfolio purposes.

---

Built with 🛡️ by [Agrima](https://github.com/agrima150103)