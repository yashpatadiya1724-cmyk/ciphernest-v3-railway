# Security Policy — CipherNest v2

## Supported Versions

| Version | Supported |
|---|---|
| `v2.x` (Cloud-Native Mobile / Railway) | ✅ Yes |
| Earlier experimental versions | ❌ No |

---

## Reporting a Vulnerability

If you discover a security vulnerability, flaw in cryptography implementation, or credential leakage within CipherNest, please do **NOT** open a public issue.

Report findings privately to:
* **Lead Maintainer:** Yash Patadiya
* **Security Contact:** [yashpatadiya1724@gmail.com](mailto:yashpatadiya1724@gmail.com)
* **Response Window:** Within 48 hours with an initial severity triage and remediation plan.

Please include:
1. Vulnerable endpoint, service component, or file.
2. Step-by-step reproduction guide or proof-of-concept payload.
3. Impact assessment (e.g., unauthorized vault decryption, token forgery, bypass of 2FA TOTP).

---

## Threat Model & Cryptographic Boundaries

### 1. Server-Side Encrypted Vault
* **Algorithm:** Symmetric AES block cipher (via `crypto-js`) with randomized salts and Initialization Vectors (IVs) per item.
* **Key Residency:** The master encryption key is derived server-side from `JWT_SECRET` / `ENCRYPTION_KEY` in environment memory.
* **Honest Security Posture:** This is a **server-side encrypted vault**, not a zero-knowledge system. Plaintext credentials exist strictly in transient server memory during authenticated decryption requests.

### 2. Multi-Factor Authentication (2FA)
* **Standard:** RFC 6238 Time-Based One-Time Password (TOTP).
* **Clock Drift Tolerance:** Validates current window with 30-second token expiration.
* **Brute-Force Protection:** Rate limiting restricts repeated invalid authentication attempts.

### 3. Web Application Security Headers
CipherNest enforces strict HTTP security headers across all API responses:
* `Content-Security-Policy` (CSP)
* `Strict-Transport-Security` (HSTS)
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`

### 4. Logging & Credential Hygiene
* Master passwords, unencrypted secret values, and private keys are strictly forbidden from stdout, file logs, or error stack traces.
