/**
 * Test Suite: CipherNest Zero-Knowledge Biometric Vault & AES-256 Cloud Engine
 */

const assert = require('assert');
const crypto = require('crypto');
const {
  deriveZeroKnowledgeKey,
  encryptVaultSecret,
  decryptVaultSecret,
  validateRailwayEnvironment,
} = require('../services/zeroKnowledgeVaultService');

console.log('Running CipherNest Zero-Knowledge Biometric Vault Tests...');

// Test 1: Key Derivation with Biometric Entropy
const masterPass = 'SuperAdminMasterPassphrase#2026';
const biometricToken = 'fido2-prf-touchid-entropy-9831fa0b';
const salt = crypto.randomBytes(16);

const key1 = deriveZeroKnowledgeKey(masterPass, biometricToken, salt);
const key2 = deriveZeroKnowledgeKey(masterPass, biometricToken, salt);
assert.strictEqual(key1.length, 32, 'Derived key must be exactly 256 bits (32 bytes)');
assert.deepStrictEqual(key1, key2, 'Deterministic derivation with identical inputs');

// Distinct biometric input must yield completely distinct key
const differentBioKey = deriveZeroKnowledgeKey(masterPass, 'different-fingerprint-token', salt);
assert.notDeepStrictEqual(key1, differentBioKey);
console.log('✅ Zero-Knowledge Biometric Key Derivation verified');

// Test 2: AES-256-GCM Encrypt & Decrypt Round-trip
const secretData = JSON.stringify({
  apiSecret: 'sk-live-railway-ciphernest-998214',
  hospitalId: 'SOU-SILVER-OAK',
  role: 'VAULT_ADMIN',
});

const encrypted = encryptVaultSecret(secretData, key1);
assert(encrypted.ciphertext.length > 0);
assert.strictEqual(encrypted.iv.length, 24, '96-bit IV is 24 hex characters');
assert.strictEqual(encrypted.authTag.length, 32, '128-bit auth tag is 32 hex characters');

const decrypted = decryptVaultSecret(encrypted, key1);
assert.strictEqual(decrypted, secretData);
console.log('✅ AES-256-GCM Authenticated Encryption & Decryption round-trip verified');

// Test 3: Tamper Resistance (GCM Auth Tag Mismatch)
const tamperedPayload = {
  ...encrypted,
  ciphertext: encrypted.ciphertext.slice(0, -2) + (encrypted.ciphertext.slice(-2) === 'aa' ? 'bb' : 'aa'),
};

assert.throws(() => {
  decryptVaultSecret(tamperedPayload, key1);
}, /Unsupported state or unable to authenticate data/);
console.log('✅ GCM Authenticated Tamper Resistance verified (bit-flip rejected)');

// Test 4: Railway Environment Validator
const envConfig = validateRailwayEnvironment();
assert.strictEqual(envConfig.healthy, true);
assert(envConfig.port > 0);
console.log(`✅ Railway Deployment Configuration verified (Port: ${envConfig.port}, Node: ${process.version})`);

console.log('🏆 ALL CIPHERNEST ZERO-KNOWLEDGE VAULT TESTS PASSED!\n');
