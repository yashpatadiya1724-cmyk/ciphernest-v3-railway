/**
 * CipherNest — Credential Vault AES & 2FA TOTP Verification Test Suite
 */

const CryptoJS = require('crypto-js');
const otplib = require('otplib');
const { authenticator } = require('../controllers/2faController');

console.log('==================================================');
console.log('🛡️ CIPHERNEST: VAULT ENCRYPTION & 2FA TESTS');
console.log('==================================================');

const MASTER_KEY = 'test_vault_secret_key_long_entropy_2026';
const WRONG_KEY = 'incorrect_intruder_key_999';

// 1. AES Encryption & Decryption Roundtrip Test
const rawCredential = 'super_secret_database_password_!@#$';
const encryptedCiphertext = CryptoJS.AES.encrypt(rawCredential, MASTER_KEY).toString();

if (!encryptedCiphertext || encryptedCiphertext === rawCredential) {
  throw new Error('Encryption failed or returned plaintext');
}
console.log(`✅ AES Encryption: Plaintext encrypted to ciphertext (${encryptedCiphertext.slice(0, 24)}...)`);

// Decrypt with correct key
const decryptedBytes = CryptoJS.AES.decrypt(encryptedCiphertext, MASTER_KEY);
const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

if (decryptedText !== rawCredential) {
  throw new Error(`Decryption failed: expected "${rawCredential}", got "${decryptedText}"`);
}
console.log('✅ AES Decryption: Successfully recovered original credential');

// 2. Decrypt with Wrong Key (Tamper / Unauthorized Access Test)
const unauthorizedBytes = CryptoJS.AES.decrypt(encryptedCiphertext, WRONG_KEY);
let unauthorizedText = '';
try {
  unauthorizedText = unauthorizedBytes.toString(CryptoJS.enc.Utf8);
} catch (e) {
  unauthorizedText = '';
}
if (unauthorizedText === rawCredential) {
  throw new Error('Security Breach: Unauthorized key decrypted credential!');
}
console.log('✅ Key Isolation: Incorrect secret key failed to decrypt ciphertext');

// 3. Salt / IV Randomness Test
// Two identical plaintexts must produce different ciphertexts due to salt/IV
const ciphertext1 = CryptoJS.AES.encrypt('identical_secret', MASTER_KEY).toString();
const ciphertext2 = CryptoJS.AES.encrypt('identical_secret', MASTER_KEY).toString();

if (ciphertext1 === ciphertext2) {
  throw new Error('Weak Crypto: Identical plaintexts produced identical ciphertexts (missing salt/IV)');
}
console.log('✅ Cryptographic Salt/IV: Two identical secrets produce distinct ciphertexts');

// 4. Two-Factor Authentication (TOTP RFC 6238) Test
const userTotpSecret = authenticator.generateSecret();
const currentToken = otplib.generateSync
  ? otplib.generateSync({ secret: userTotpSecret })
  : (otplib.authenticator ? otplib.authenticator.generate(userTotpSecret) : null);

if (!currentToken) {
  throw new Error('Could not generate TOTP token');
}

const isValid = authenticator.verify({ token: currentToken, secret: userTotpSecret });

if (!isValid) {
  throw new Error('TOTP 2FA token generation or validation failed');
}
console.log(`✅ 2FA TOTP: RFC 6238 6-digit token (${currentToken}) verified against generated secret`);

// 5. Invalid / Expired Token Rejection Test
const isInvalidAccepted = authenticator.verify({ token: '000000', secret: userTotpSecret });
if (isInvalidAccepted) {
  throw new Error('Security Breach: Invalid 2FA token was accepted!');
}
console.log('✅ 2FA Token Rejection: Invalid token correctly rejected');

console.log('==================================================');
console.log('🏆 ALL CIPHERNEST VAULT & 2FA TESTS PASSED (100%)');
console.log('==================================================');
