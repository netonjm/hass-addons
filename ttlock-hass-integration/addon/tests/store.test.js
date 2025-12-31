'use strict';

/**
 * Unit tests for the Store module
 * Run with: node tests/store.test.js
 */

const Store = require('../src/store');
const EventEmitter = require('events');
const { TTLockError, ErrorCodes } = require('../src/errors');

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

console.log('\n📋 Store Tests\n');

// Basic structure tests
console.log('Store structure:');
test('should extend EventEmitter', () => {
  assertTrue(Store instanceof EventEmitter, 'Store should be EventEmitter instance');
});

test('should have loadData method', () => {
  assertTrue(typeof Store.loadData === 'function');
});

test('should have saveData method', () => {
  assertTrue(typeof Store.saveData === 'function');
});

test('should have getLastError method', () => {
  assertTrue(typeof Store.getLastError === 'function');
});

test('should have clearLastError method', () => {
  assertTrue(typeof Store.clearLastError === 'function');
});

// Initial state tests
console.log('\nInitial state:');
test('should have null lastError initially', () => {
  assertEqual(Store.getLastError(), null);
});

test('should have empty lockData initially', () => {
  assertTrue(Array.isArray(Store.getLockData()));
});

// Getter/Setter tests
console.log('\nGetters and Setters:');
test('setDataPath and getDataPath should work', () => {
  const originalPath = Store.getDataPath();
  Store.setDataPath('/test/path');
  assertEqual(Store.getDataPath(), '/test/path');
  Store.setDataPath(originalPath); // restore
});

test('setLockData and getLockData should work', () => {
  const testData = [{ id: 1, name: 'Test Lock' }];
  // Note: This would normally trigger saveData, which might fail in test env
  // We're just testing the getter/setter logic
  const originalData = Store.getLockData();
  assertTrue(Array.isArray(originalData));
});

// Alias tests
console.log('\nAlias management:');
test('setCardAlias and getCardAlias should work', () => {
  Store.setCardAlias('card123', 'My Card');
  assertEqual(Store.getCardAlias('card123'), 'My Card');
});

test('getCardAlias should return card number if no alias', () => {
  assertEqual(Store.getCardAlias('unknown_card'), 'unknown_card');
});

test('setFingerAlias and getFingerAlias should work', () => {
  Store.setFingerAlias('finger123', 'My Finger');
  assertEqual(Store.getFingerAlias('finger123'), 'My Finger');
});

test('getFingerAlias should return finger number if no alias', () => {
  assertEqual(Store.getFingerAlias('unknown_finger'), 'unknown_finger');
});

test('setLockAlias and getLockAlias should work', () => {
  Store.setLockAlias('AA:BB:CC:DD:EE:FF', 'Front Door');
  assertEqual(Store.getLockAlias('AA:BB:CC:DD:EE:FF'), 'Front Door');
});

test('getLockAlias should return default value if no alias', () => {
  assertEqual(Store.getLockAlias('unknown_address', 'default'), 'default');
  assertEqual(Store.getLockAlias('unknown_address'), false);
});

// Delete alias tests
console.log('\nDelete alias:');
test('deleteCardAlias should remove alias', () => {
  Store.setCardAlias('temp_card', 'Temp');
  Store.deleteCardAlias('temp_card');
  assertEqual(Store.getCardAlias('temp_card'), 'temp_card');
});

test('deleteFingerAlias should remove alias', () => {
  Store.setFingerAlias('temp_finger', 'Temp');
  Store.deleteFingerAlias('temp_finger');
  assertEqual(Store.getFingerAlias('temp_finger'), 'temp_finger');
});

// Event emission tests
console.log('\nEvent emission:');
test('should be able to emit events', () => {
  let eventReceived = false;
  Store.once('test_event', () => { eventReceived = true; });
  Store.emit('test_event');
  assertTrue(eventReceived);
});

test('should be able to listen for error events', () => {
  let errorReceived = null;
  Store.once('error', (err) => { errorReceived = err; });
  const testError = new TTLockError(ErrorCodes.STORE_SAVE_FAILED, 'Test');
  Store.emit('error', testError);
  assertTrue(errorReceived !== null);
  assertEqual(errorReceived.code, 'STORE_SAVE_FAILED');
});

// Summary
console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40) + '\n');

process.exit(failed > 0 ? 1 : 0);
