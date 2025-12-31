'use strict';

/**
 * Unit tests for the TTLockError system
 * Run with: node tests/errors.test.js
 */

const { TTLockError, ErrorCodes, ErrorMessages } = require('../src/errors');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected true but got false');
  }
}

console.log('\n📋 TTLockError Tests\n');

// ErrorCodes tests
console.log('ErrorCodes:');
test('should have LOCK_NOT_FOUND code', () => {
  assertEqual(ErrorCodes.LOCK_NOT_FOUND, 'LOCK_NOT_FOUND');
});

test('should have BLE_CONNECTION_FAILED code', () => {
  assertEqual(ErrorCodes.BLE_CONNECTION_FAILED, 'BLE_CONNECTION_FAILED');
});

test('should have all expected error codes', () => {
  const expectedCodes = [
    'LOCK_NOT_FOUND', 'LOCK_NOT_PAIRED', 'LOCK_NOT_CONNECTED',
    'BLE_CONNECTION_FAILED', 'BLE_SCAN_ACTIVE', 'BLE_TIMEOUT',
    'OPERATION_FAILED', 'OPERATION_NOT_SUPPORTED', 'INIT_FAILED',
    'PASSCODE_FAILED', 'CARD_FAILED', 'FINGERPRINT_FAILED',
    'SETTINGS_FAILED', 'MQTT_CONNECTION_FAILED', 'MQTT_PUBLISH_FAILED',
    'STORE_LOAD_FAILED', 'STORE_SAVE_FAILED', 'UNKNOWN_ERROR'
  ];
  expectedCodes.forEach(code => {
    assertTrue(ErrorCodes[code] !== undefined, `Missing code: ${code}`);
  });
});

test('should be frozen (immutable)', () => {
  assertTrue(Object.isFrozen(ErrorCodes), 'ErrorCodes should be frozen');
});

// ErrorMessages tests
console.log('\nErrorMessages:');
test('should have message for each error code', () => {
  Object.values(ErrorCodes).forEach(code => {
    assertTrue(ErrorMessages[code] !== undefined, `Missing message for code: ${code}`);
  });
});

// TTLockError class tests
console.log('\nTTLockError class:');
test('should create error with code and message', () => {
  const error = new TTLockError(ErrorCodes.LOCK_NOT_FOUND, 'Custom message');
  assertEqual(error.code, 'LOCK_NOT_FOUND');
  assertEqual(error.message, 'Custom message');
});

test('should use default message if not provided', () => {
  const error = new TTLockError(ErrorCodes.LOCK_NOT_FOUND);
  assertEqual(error.message, ErrorMessages.LOCK_NOT_FOUND);
});

test('should store details object', () => {
  const details = { address: 'AA:BB:CC:DD:EE:FF', attempt: 3 };
  const error = new TTLockError(ErrorCodes.BLE_CONNECTION_FAILED, 'Failed', details);
  assertEqual(error.details.address, 'AA:BB:CC:DD:EE:FF');
  assertEqual(error.details.attempt, 3);
});

test('should have timestamp', () => {
  const error = new TTLockError(ErrorCodes.UNKNOWN_ERROR);
  assertTrue(error.timestamp !== undefined, 'Should have timestamp');
  assertTrue(typeof error.timestamp === 'string', 'Timestamp should be string');
});

test('should extend Error', () => {
  const error = new TTLockError(ErrorCodes.UNKNOWN_ERROR);
  assertTrue(error instanceof Error, 'Should be instance of Error');
  assertTrue(error instanceof TTLockError, 'Should be instance of TTLockError');
});

test('should have name property', () => {
  const error = new TTLockError(ErrorCodes.UNKNOWN_ERROR);
  assertEqual(error.name, 'TTLockError');
});

// toJSON tests
console.log('\ntoJSON method:');
test('should convert to JSON correctly', () => {
  const error = new TTLockError(ErrorCodes.LOCK_NOT_FOUND, 'Test', { foo: 'bar' });
  const json = error.toJSON();
  assertEqual(json.name, 'TTLockError');
  assertEqual(json.code, 'LOCK_NOT_FOUND');
  assertEqual(json.message, 'Test');
  assertEqual(json.details.foo, 'bar');
  assertTrue(json.timestamp !== undefined);
});

test('should be serializable to JSON string', () => {
  const error = new TTLockError(ErrorCodes.LOCK_NOT_FOUND, 'Test');
  const jsonString = JSON.stringify(error.toJSON());
  const parsed = JSON.parse(jsonString);
  assertEqual(parsed.code, 'LOCK_NOT_FOUND');
});

// fromError tests
console.log('\nfromError static method:');
test('should convert generic Error to TTLockError', () => {
  const genericError = new Error('Something went wrong');
  const ttlockError = TTLockError.fromError(genericError, ErrorCodes.OPERATION_FAILED);
  assertTrue(ttlockError instanceof TTLockError);
  assertEqual(ttlockError.code, 'OPERATION_FAILED');
  assertEqual(ttlockError.message, 'Something went wrong');
});

test('should return same error if already TTLockError', () => {
  const original = new TTLockError(ErrorCodes.LOCK_NOT_FOUND, 'Original');
  const result = TTLockError.fromError(original, ErrorCodes.UNKNOWN_ERROR);
  assertTrue(result === original, 'Should return same instance');
});

test('should use UNKNOWN_ERROR as default code', () => {
  const genericError = new Error('Test');
  const ttlockError = TTLockError.fromError(genericError);
  assertEqual(ttlockError.code, 'UNKNOWN_ERROR');
});

// Summary
console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40) + '\n');

process.exit(failed > 0 ? 1 : 0);
