# Contributing to CipherNest

Thank you for contributing to CipherNest. We welcome contributions that improve security auditing, cryptographic hygiene, and mobile UX.

## Security & Contribution Guidelines
1. **Absolute Honesty**: Never misrepresent cryptographic architecture. Do not claim zero-knowledge or client-side encryption when operations execute server-side.
2. **Never Log Secrets**: Never print, log, or dump plaintext credentials, encryption keys, or JWT tokens in console output or error logs.
3. **No Hardcoded Keys**: Always use environment variables for cryptographic secrets with sensible fallback warnings.
4. **Testing**: Run all vault encryption tests before opening pull requests:
   ```bash
   cd backend && npm test
   ```
5. **Branching**: Submit changes from dedicated feature branches, never directly to `main`.
