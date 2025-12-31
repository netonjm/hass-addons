'use strict';

/**
 * Error codes for TTLock operations
 */
const ErrorCodes = Object.freeze({
  // Lock errors
  LOCK_NOT_FOUND: 'LOCK_NOT_FOUND',
  LOCK_NOT_PAIRED: 'LOCK_NOT_PAIRED',
  LOCK_NOT_CONNECTED: 'LOCK_NOT_CONNECTED',
  
  // BLE errors
  BLE_CONNECTION_FAILED: 'BLE_CONNECTION_FAILED',
  BLE_SCAN_ACTIVE: 'BLE_SCAN_ACTIVE',
  BLE_TIMEOUT: 'BLE_TIMEOUT',
  BLE_ADAPTER_NOT_READY: 'BLE_ADAPTER_NOT_READY',
  
  // Operation errors
  OPERATION_FAILED: 'OPERATION_FAILED',
  OPERATION_NOT_SUPPORTED: 'OPERATION_NOT_SUPPORTED',
  INIT_FAILED: 'INIT_FAILED',
  
  // Credential errors
  PASSCODE_FAILED: 'PASSCODE_FAILED',
  CARD_FAILED: 'CARD_FAILED',
  FINGERPRINT_FAILED: 'FINGERPRINT_FAILED',
  
  // Settings errors
  SETTINGS_FAILED: 'SETTINGS_FAILED',
  
  // MQTT errors
  MQTT_CONNECTION_FAILED: 'MQTT_CONNECTION_FAILED',
  MQTT_PUBLISH_FAILED: 'MQTT_PUBLISH_FAILED',
  
  // Store errors
  STORE_LOAD_FAILED: 'STORE_LOAD_FAILED',
  STORE_SAVE_FAILED: 'STORE_SAVE_FAILED',
  
  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
});

/**
 * Human-readable error messages
 */
const ErrorMessages = Object.freeze({
  [ErrorCodes.LOCK_NOT_FOUND]: 'Lock not found',
  [ErrorCodes.LOCK_NOT_PAIRED]: 'Lock is not paired',
  [ErrorCodes.LOCK_NOT_CONNECTED]: 'Lock is not connected',
  [ErrorCodes.BLE_CONNECTION_FAILED]: 'Failed to connect via Bluetooth',
  [ErrorCodes.BLE_SCAN_ACTIVE]: 'Cannot perform operation while scanning',
  [ErrorCodes.BLE_TIMEOUT]: 'Bluetooth operation timed out',
  [ErrorCodes.BLE_ADAPTER_NOT_READY]: 'Bluetooth adapter not ready',
  [ErrorCodes.OPERATION_FAILED]: 'Operation failed',
  [ErrorCodes.OPERATION_NOT_SUPPORTED]: 'Operation not supported by this lock',
  [ErrorCodes.INIT_FAILED]: 'Lock initialization failed',
  [ErrorCodes.PASSCODE_FAILED]: 'Passcode operation failed',
  [ErrorCodes.CARD_FAILED]: 'Card operation failed',
  [ErrorCodes.FINGERPRINT_FAILED]: 'Fingerprint operation failed',
  [ErrorCodes.SETTINGS_FAILED]: 'Failed to update settings',
  [ErrorCodes.MQTT_CONNECTION_FAILED]: 'MQTT connection failed',
  [ErrorCodes.MQTT_PUBLISH_FAILED]: 'Failed to publish MQTT message',
  [ErrorCodes.STORE_LOAD_FAILED]: 'Failed to load saved data',
  [ErrorCodes.STORE_SAVE_FAILED]: 'Failed to save data',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unknown error occurred'
});

/**
 * Custom error class for TTLock operations
 */
class TTLockError extends Error {
  /**
   * @param {string} code - Error code from ErrorCodes
   * @param {string} [message] - Custom message (optional, defaults to ErrorMessages)
   * @param {Object} [details] - Additional error details
   */
  constructor(code, message, details = {}) {
    const errorMessage = message || ErrorMessages[code] || ErrorMessages[ErrorCodes.UNKNOWN_ERROR];
    super(errorMessage);
    
    this.name = 'TTLockError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TTLockError);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }

  /**
   * Create a TTLockError from a generic error
   * @param {Error} error - Original error
   * @param {string} [code] - Error code to use
   * @returns {TTLockError}
   */
  static fromError(error, code = ErrorCodes.UNKNOWN_ERROR) {
    if (error instanceof TTLockError) {
      return error;
    }
    return new TTLockError(code, error.message, { 
      originalError: error.name,
      stack: error.stack 
    });
  }
}

module.exports = {
  TTLockError,
  ErrorCodes,
  ErrorMessages
};
