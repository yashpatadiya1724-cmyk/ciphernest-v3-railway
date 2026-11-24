/**
 * Test Suite: CipherNest Zero-Knowledge Biometric Vault & AES-256 Cloud Engine
 */

const assert = require('assert');
const crypto = require('crypto');
const {
  deriveZeroKnowledgeKey,
  encryptVaultSecret,
  decryptVaultSecret,
  generateBiometricChallenge,
  verifyBiometricChallenge,
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

// Test 5: Input Validation & Key Length Guards
assert.throws(() => {
  encryptVaultSecret('plain text', Buffer.from('short-key-16-bytes'));
}, /Valid 256-bit AES key is required/);
console.log('✅ Key Length Guard: Non-256-bit key correctly rejected');

// Test 6: Incomplete Vault Payload Rejection
assert.throws(() => {
  decryptVaultSecret({ ciphertext: 'abc', iv: 'def' }, key1);
}, /Incomplete encrypted vault payload/);
assert.throws(() => {
  decryptVaultSecret({ iv: 'def', authTag: '123' }, key1);
}, /Incomplete encrypted vault payload/);
console.log('✅ Incomplete Vault Payload Guard: Missing IV or AuthTag rejected');

// Test 7: Zero-Knowledge Derivation Input Guards
assert.throws(() => {
  deriveZeroKnowledgeKey('', biometricToken, salt);
}, /Master secret and biometric entropy are required/);
assert.throws(() => {
  deriveZeroKnowledgeKey(masterPass, '', salt);
}, /Master secret and biometric entropy are required/);
console.log('✅ KDF Input Validation Guard: Empty master pass or biometric entropy rejected');

// Test 8: Salt Entropy Separation
const salt2 = crypto.randomBytes(16);
const keySalt2 = deriveZeroKnowledgeKey(masterPass, biometricToken, salt2);
assert.notDeepStrictEqual(key1, keySalt2, 'Distinct salts must yield cryptographically distinct derived keys');
console.log('✅ Salt Entropy Separation verified');

// Test 9: Additional Authenticated Data (AAD) Tenant-Binding
const tenantAAD = 'tenant:SOU-SILVER-OAK:dept:cybersecurity';
const aadEncrypted = encryptVaultSecret(secretData, key1, tenantAAD);
assert.strictEqual(aadEncrypted.aad, tenantAAD);
const aadDecrypted = decryptVaultSecret(aadEncrypted, key1);
assert.strictEqual(aadDecrypted, secretData);

// Tampering with tenant AAD context must trigger authentication failure
assert.throws(() => {
  decryptVaultSecret({ ...aadEncrypted, aad: 'tenant:ROGUE-HOSPITAL:dept:cybersecurity' }, key1);
}, /Unsupported state or unable to authenticate data/);
console.log('✅ Tenant-Bound AAD (Additional Authenticated Data) Verification verified');

// Test 10: Biometric Challenge Freshness & Verification
const bioChallenge = generateBiometricChallenge();
assert.strictEqual(typeof bioChallenge.challenge, 'string');
assert.strictEqual(bioChallenge.challenge.length, 64, 'Challenge must be 256-bit (64 hex characters)');
assert(verifyBiometricChallenge(bioChallenge), 'Fresh biometric challenge must verify');

// Expired challenge rejection
const expiredChallenge = { challenge: bioChallenge.challenge, timestamp: Date.now() - 70000 };
assert.strictEqual(verifyBiometricChallenge(expiredChallenge, 60000), false, 'Expired challenge must be rejected');

// Invalid length challenge rejection
assert.strictEqual(verifyBiometricChallenge({ challenge: 'short-bad-challenge', timestamp: Date.now() }), false);
console.log('✅ Biometric PRF Challenge & Freshness Verification verified');

console.log('🏆 ALL CIPHERNEST ZERO-KNOWLEDGE VAULT TESTS PASSED!\n');
