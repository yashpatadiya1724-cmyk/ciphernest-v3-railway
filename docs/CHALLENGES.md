# Engineering Challenges & Technical Learnings
### Repository: ciphernest-v3-railway

## 1. Challenge: Breaking Changes in TOTP Libraries (otplib v12 vs v13)
- **Problem:** Updating dependencies to modern versions broke the 2FA controller with `TypeError: Cannot read properties of undefined (reading 'generateSecret')`, as `otplib` v13 restructured its default exports.
- **Solution:** Implemented an adaptive compatibility wrapper in `backend/controllers/2faController.js` supporting both v12 (`authenticator.generateSecret()`) and v13 (`otplib.generateSecret()`, `otplib.verifySync()`) signatures, guaranteeing zero runtime crashes across environments.

---

## 2. Challenge: Maintaining Honest Security Posture
- **Problem:** Cybersecurity marketing frequently defaults to buzzwords like *"military-grade"* or *"zero-knowledge"*. Auditing the actual code revealed that the credential vault uses server-side AES encryption where the server manages the master key.
- **Solution:** Refactored documentation and project descriptions to reflect technical reality. Accurately defined the architecture as a **Server-Side Encrypted Credential Vault with Multi-Factor Authentication and Tenancy Isolation**, eliminating exaggerated claims.
