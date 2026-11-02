# CipherNest v2 — System Design & Architecture Document

## 1. System Overview
CipherNest v2 is a mobile-ready cybersecurity operations platform combining an encrypted credential vault, two-factor authentication (2FA), web security header analysis, and network diagnostics.

---

## 2. Core Architecture Decisions

### 2.1 Credential Vault Encryption Architecture
- **Encryption Algorithm:** Standard AES symmetric block cipher (via CryptoJS) with dynamic randomized initialization vectors (IVs) and salts.
- **Key Hierarchy:** Encryption is performed server-side utilizing a dedicated server master key (`JWT_SECRET`).
- **Cryptographic Independence:** Two identical plaintexts encrypted under the same master key yield completely different ciphertexts, preventing pattern frequency analysis.
- **Access Scope:** All queries enforce strict user-level tenancy (`{ userId: req.user._id }`). The `getSecrets` list endpoint returns only metadata (`label`, `category`, `createdAt`) — secret decryption requires explicit individual single-item queries.

### 2.2 Multi-Factor Authentication (2FA)
- Employs RFC 6238 Time-Based One-Time Password (TOTP) algorithm via `otplib`.
- Generates base32 secret keys and encodes them into standard `otpauth://` URI schemes visualized via client QR codes.

---

## 3. Security Reality & Governance (Audit Findings)
- **Architecture Type:** Server-Side Encrypted Storage.
- **Classification:** CipherNest provides encrypted storage at rest with user isolation. It is **not** a client-side zero-knowledge architecture (the server possesses the decryption key in environment configuration).
- **Audit Logging:** Every secret creation, modification, and deletion triggers an immutable record in `ActivityLog` documenting actor ID, timestamp, and action description.
