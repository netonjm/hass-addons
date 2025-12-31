'use strict';

const EventEmitter = require('events');
const store = require("./store");
const { TTLockError, ErrorCodes } = require("./errors");
const { TTLockClient, AudioManage, LockedStatus, LogOperateCategory, LogOperateNames } = require("ttlock-sdk-js");

const ScanType = Object.freeze({
  NONE: 0,
  AUTOMATIC: 1,
  MANUAL: 2
});

const SCAN_MAX = 3;

/**
 * Sleep for
 * @param ms miliseconds
 */
async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
/**
 * Events:
 * - lockListChanged - when a lock was found during scanning
 * - lockPaired - a lock was paired
 * - lockConnected - a connetion to a lock was estabilisehed
 * - lockLock - a lock was locked
 * - lockUnlock - a lock was unlocked
 * - scanStart - scanning has started
 * - scanStop - scanning has stopped
 */
class Manager extends EventEmitter {
  constructor() {
    super();
    this.startupStatus = -1;
    this.client = undefined;
    this.scanning = false;
    /** @type {NodeJS.Timeout} */
    this.scanTimer = undefined;
    this.scanCounter = 0;
    /** @type {Map<string, import('ttlock-sdk-js').TTLock>} Locks that are paired and were seen during the BLE scan */
    this.pairedLocks = new Map();
    /** @type {Map<string, import('ttlock-sdk-js').TTLock>} Locks that are pairable and were seen during the BLE scan */
    this.newLocks = new Map();
    /** @type {Set<string>} Locks found during scan that we need to connect to at least once to get their information */
    this.connectQueue = new Set();
    /** @type {'none'|'noble'} */
    this.gateway = 'none';
    this.gateway_host = "";
    this.gateway_port = 0;
    this.gateway_key = "";
    this.gateway_user = "";
    this.gateway_pass = "";
  }

  async init() {
    if (typeof this.client == "undefined") {
      try {
        let clientOptions = {}

        if (this.gateway == "noble") {
          clientOptions.scannerType = "noble-websocket";
          clientOptions.scannerOptions = {
            websocketHost: this.gateway_host,
            websocketPort: this.gateway_port,
            websocketAesKey: this.gateway_key,
            websocketUsername: this.gateway_user,
            websocketPassword: this.gateway_pass
          }
        }

        this.client = new TTLockClient(clientOptions);
        this.updateClientLockDataFromStore();

        this.client.on("ready", () => {
          // should not trigger if prepareBTService emits it
          // but useful for when websocket reconnects
          // disable it for now as the reconnection won't re-trigger ready
          // this.startScan(ScanType.AUTOMATIC);
          this.client.startMonitor();
        });
        this.client.on("foundLock", this._onFoundLock.bind(this));
        this.client.on("scanStart", this._onScanStarted.bind(this));
        this.client.on("scanStop", this._onScanStopped.bind(this));
        this.client.on("monitorStart", () => console.log("Monitor started"));
        this.client.on("monitorStop", () => console.log("Monitor stopped"));
        this.client.on("updatedLockData", this._onUpdatedLockData.bind(this));
        const adapterReady = await this.client.prepareBTService();
        if (adapterReady) {
          this.startupStatus = 0;
        } else {
          this.startupStatus = 1;
        }
      } catch (error) {
        console.log(error);
        this.startupStatus = 1;
      }
    }
  }

  updateClientLockDataFromStore() {
    const lockData = store.getLockData();
    this.client.setLockData(lockData);
  }

  setNobleGateway(gateway_host, gateway_port, gateway_key, gateway_user, gateway_pass) {
    this.gateway = "noble";
    this.gateway_host = gateway_host;
    this.gateway_port = gateway_port;
    this.gateway_key = gateway_key;
    this.gateway_user = gateway_user;
    this.gateway_pass = gateway_pass;
  }

  getStartupStatus() {
    return this.startupStatus;
  }

  async startScan() {
    if (!this.scanning) {
      await this.client.stopMonitor();
      const res = await this.client.startScanLock();
      if (res == true) {
        this._scanTimer();
      }
      return res;
    }
    return false;
  }

  async stopScan() {
    if (this.scanning) {
      if (typeof this.scanTimer != "undefined") {
        clearTimeout(this.scanTimer);
        this.scanTimer = undefined;
      }
      return await this.client.stopScanLock();
    }
    return false;
  }

  getIsScanning() {
    return this.scanning;
  }

  getPairedVisible() {
    return this.pairedLocks;
  }

  getNewVisible() {
    return this.newLocks;
  }

  /**
   * Init a new lock
   * @param {string} address MAC address
   * @throws {TTLockError} If lock not found, connection fails, or initialization fails
   */
  async initLock(address) {
    const lock = this.newLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Lock ${address} not found in discoverable locks`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.initLock();
      if (res === false) {
        throw new TTLockError(ErrorCodes.INIT_FAILED, `Failed to initialize lock ${address}`);
      }
      this.pairedLocks.set(lock.getAddress(), lock);
      this.newLocks.delete(lock.getAddress());
      this._bindLockEvents(lock);
      this.emit("lockPaired", lock);
      return true;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.INIT_FAILED, `Lock initialization failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Unlock a paired lock
   * @param {string} address MAC address
   * @throws {TTLockError} If lock not found, connection fails, or unlock fails
   */
  async unlockLock(address) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.unlock();
      if (res === false) {
        throw new TTLockError(ErrorCodes.OPERATION_FAILED, `Failed to unlock ${address}`);
      }
      return res;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.OPERATION_FAILED, `Unlock failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Lock a paired lock
   * @param {string} address MAC address
   * @throws {TTLockError} If lock not found, connection fails, or lock fails
   */
  async lockLock(address) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.lock();
      if (res === false) {
        throw new TTLockError(ErrorCodes.OPERATION_FAILED, `Failed to lock ${address}`);
      }
      return res;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.OPERATION_FAILED, `Lock failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Set auto-lock time for a lock
   * @param {string} address MAC address
   * @param {number} value Auto-lock time in seconds
   * @throws {TTLockError} If lock not found, connection fails, or operation fails
   */
  async setAutoLock(address, value) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.setAutoLockTime(value);
      if (res === false) {
        throw new TTLockError(ErrorCodes.SETTINGS_FAILED, `Failed to set auto-lock for ${address}`);
      }
      this.emit("lockUpdated", lock);
      return res;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.SETTINGS_FAILED, `Set auto-lock failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  async getCredentials(address) {
    const passcodes = await this.getPasscodes(address);
    const cards = await this.getCards(address);
    const fingers = await this.getFingers(address);
    return {
      passcodes: passcodes,
      cards: cards,
      fingers: fingers
    };
  }

  /**
   * Add a passcode to a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async addPasscode(address, type, passCode, startDate, endDate) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasPassCode()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support passcodes`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.addPassCode(type, passCode, startDate, endDate);
      if (res === false) {
        throw new TTLockError(ErrorCodes.PASSCODE_FAILED, `Failed to add passcode to ${address}`);
      }
      return res;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.PASSCODE_FAILED, `Add passcode failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Update a passcode on a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async updatePasscode(address, type, oldPasscode, newPasscode, startDate, endDate) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasPassCode()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support passcodes`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.updatePassCode(type, oldPasscode, newPasscode, startDate, endDate);
      if (res === false) {
        throw new TTLockError(ErrorCodes.PASSCODE_FAILED, `Failed to update passcode on ${address}`);
      }
      return res;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.PASSCODE_FAILED, `Update passcode failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Delete a passcode from a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async deletePasscode(address, type, passCode) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasPassCode()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support passcodes`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.deletePassCode(type, passCode);
      if (res === false) {
        throw new TTLockError(ErrorCodes.PASSCODE_FAILED, `Failed to delete passcode from ${address}`);
      }
      return res;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.PASSCODE_FAILED, `Delete passcode failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Get all passcodes from a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async getPasscodes(address) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasPassCode()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support passcodes`);
    }
    
    await this._connectLock(lock);
    
    try {
      const passcodes = await lock.getPassCodes();
      return passcodes;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.PASSCODE_FAILED, `Get passcodes failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Add a card to a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async addCard(address, startDate, endDate, alias) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasICCard()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support IC cards`);
    }
    
    await this._connectLock(lock);
    
    try {
      const card = await lock.addICCard(startDate, endDate);
      if (!card) {
        throw new TTLockError(ErrorCodes.CARD_FAILED, `Failed to add card to ${address}`);
      }
      store.setCardAlias(card, alias);
      return card;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.CARD_FAILED, `Add card failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Update a card on a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async updateCard(address, card, startDate, endDate, alias) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasICCard()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support IC cards`);
    }
    
    await this._connectLock(lock);
    
    try {
      const result = await lock.updateICCard(card, startDate, endDate);
      if (result === false) {
        throw new TTLockError(ErrorCodes.CARD_FAILED, `Failed to update card on ${address}`);
      }
      store.setCardAlias(card, alias);
      return result;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.CARD_FAILED, `Update card failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Delete a card from a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async deleteCard(address, card) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasICCard()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support IC cards`);
    }
    
    await this._connectLock(lock);
    
    try {
      const result = await lock.deleteICCard(card);
      if (result === false) {
        throw new TTLockError(ErrorCodes.CARD_FAILED, `Failed to delete card from ${address}`);
      }
      store.deleteCardAlias(card);
      return result;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.CARD_FAILED, `Delete card failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Get all cards from a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async getCards(address) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasICCard()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support IC cards`);
    }
    
    await this._connectLock(lock);
    
    try {
      let cards = await lock.getICCards();
      if (cards.length > 0) {
        for (let card of cards) {
          card.alias = store.getCardAlias(card.cardNumber);
        }
      }
      return cards;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.CARD_FAILED, `Get cards failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Add a fingerprint to a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async addFinger(address, startDate, endDate, alias) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasFingerprint()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support fingerprints`);
    }
    
    await this._connectLock(lock);
    
    try {
      const finger = await lock.addFingerprint(startDate, endDate);
      if (!finger) {
        throw new TTLockError(ErrorCodes.FINGERPRINT_FAILED, `Failed to add fingerprint to ${address}`);
      }
      store.setFingerAlias(finger, alias);
      return finger;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.FINGERPRINT_FAILED, `Add fingerprint failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Update a fingerprint on a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async updateFinger(address, finger, startDate, endDate, alias) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasFingerprint()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support fingerprints`);
    }
    
    await this._connectLock(lock);
    
    try {
      const result = await lock.updateFingerprint(finger, startDate, endDate);
      if (result === false) {
        throw new TTLockError(ErrorCodes.FINGERPRINT_FAILED, `Failed to update fingerprint on ${address}`);
      }
      store.setFingerAlias(finger, alias);
      return result;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.FINGERPRINT_FAILED, `Update fingerprint failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Delete a fingerprint from a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async deleteFinger(address, finger) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasFingerprint()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support fingerprints`);
    }
    
    await this._connectLock(lock);
    
    try {
      const result = await lock.deleteFingerprint(finger);
      if (result === false) {
        throw new TTLockError(ErrorCodes.FINGERPRINT_FAILED, `Failed to delete fingerprint from ${address}`);
      }
      store.deleteFingerAlias(finger);
      return result;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.FINGERPRINT_FAILED, `Delete fingerprint failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Get all fingerprints from a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async getFingers(address) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasFingerprint()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support fingerprints`);
    }
    
    await this._connectLock(lock);
    
    try {
      let fingers = await lock.getFingerprints();
      if (fingers.length > 0) {
        for (let finger of fingers) {
          finger.alias = store.getFingerAlias(finger.fpNumber);
        }
      }
      return fingers;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.FINGERPRINT_FAILED, `Get fingerprints failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Set audio on/off for a lock
   * @throws {TTLockError} If lock not found, not supported, connection fails, or operation fails
   */
  async setAudio(address, audio) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    if (!lock.hasLockSound()) {
      throw new TTLockError(ErrorCodes.OPERATION_NOT_SUPPORTED, `Lock ${address} does not support audio settings`);
    }
    
    await this._connectLock(lock);
    
    try {
      const sound = audio == true ? AudioManage.TURN_ON : AudioManage.TURN_OFF;
      const res = await lock.setLockSound(sound);
      if (res === false) {
        throw new TTLockError(ErrorCodes.SETTINGS_FAILED, `Failed to set audio for ${address}`);
      }
      this.emit("lockUpdated", lock);
      return res;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.SETTINGS_FAILED, `Set audio failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Get operation log from a lock
   * @throws {TTLockError} If lock not found, connection fails, or operation fails
   */
  async getOperationLog(address, reload) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    
    if (typeof reload == "undefined") {
      reload = false;
    }
    
    await this._connectLock(lock);
    
    try {
      let operations = JSON.parse(JSON.stringify(await lock.getOperationLog(true, reload)));
      let validOperations = [];
      for (let operation of operations) {
        if (operation) {
          operation.recordTypeName = LogOperateNames[operation.recordType];
          if (LogOperateCategory.LOCK.includes(operation.recordType)) {
            operation.recordTypeCategory = "LOCK";
          } else if (LogOperateCategory.UNLOCK.includes(operation.recordType)) {
            operation.recordTypeCategory = "UNLOCK";
          } else if (LogOperateCategory.FAILED.includes(operation.recordType)) {
            operation.recordTypeCategory = "FAILED";
          } else {
            operation.recordTypeCategory = "OTHER";
          }
          if (typeof operation.password != "undefined") {
            if (LogOperateCategory.IC.includes(operation.recordType)) {
              operation.passwordName = store.getCardAlias(operation.password);
            } else if (LogOperateCategory.FR.includes(operation.recordType)) {
              operation.passwordName = store.getFingerAlias(operation.password);
            }
          }
          validOperations.push(operation);
        }
      }
      return validOperations;
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.OPERATION_FAILED, `Get operation log failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Reset (unpair) a lock
   * @throws {TTLockError} If lock not found, connection fails, or operation fails
   */
  async resetLock(address) {
    const lock = this.pairedLocks.get(address);
    if (!lock) {
      throw new TTLockError(ErrorCodes.LOCK_NOT_FOUND, `Paired lock ${address} not found`);
    }
    
    await this._connectLock(lock);
    
    try {
      const res = await lock.resetLock();
      if (res) {
        lock.removeAllListeners();
        this.pairedLocks.delete(address);
        this.emit("lockListChanged");
        return res;
      }
      throw new TTLockError(ErrorCodes.OPERATION_FAILED, `Failed to reset lock ${address}`);
    } catch (error) {
      if (error instanceof TTLockError) throw error;
      console.error(error);
      throw new TTLockError(ErrorCodes.OPERATION_FAILED, `Reset lock failed: ${error.message}`, { address, originalError: error.message });
    }
  }

  /**
   * Connect to a lock
   * @param {import('ttlock-sdk-js').TTLock} lock 
   * @param {boolean} readData 
   * @throws {TTLockError} If scanning is active or connection fails
   */
  async _connectLock(lock, readData = true) {
    if (this.scanning) {
      throw new TTLockError(ErrorCodes.BLE_SCAN_ACTIVE, 'Cannot connect while scanning is active');
    }
    
    if (!lock.isConnected()) {
      try {
        const res = await lock.connect(!readData);
        if (!res) {
          const address = lock.getAddress();
          console.log("Connect to lock failed", address);
          throw new TTLockError(ErrorCodes.BLE_CONNECTION_FAILED, `Failed to connect to lock ${address}`, { address });
        }
      } catch (error) {
        if (error instanceof TTLockError) throw error;
        console.error(error);
        throw new TTLockError(ErrorCodes.BLE_CONNECTION_FAILED, `Connection failed: ${error.message}`, { originalError: error.message });
      }
    }
    return true;
  }

  async _onScanStarted() {
    this.scanning = true;
    console.log("BLE Scan started");
    this.emit("scanStart");
  }

  async _onScanStopped() {
    this.scanning = false;
    console.log("BLE Scan stopped");
    console.log("Refreshing paired locks");
    for (let address of this.connectQueue) {
      if (this.pairedLocks.has(address)) {
        let lock = this.pairedLocks.get(address);
        console.log("Auto connect to", address);
        const result = await lock.connect();
        if (result === true) {
          await lock.disconnect();
          console.log("Successful connect attempt to paired lock", address);
          this.connectQueue.delete(address);
        } else {
          console.log("Unsuccessful connect attempt to paired lock", address);
        }
      }
    }

    this.emit("scanStop");
    setTimeout(() => {
      this.client.startMonitor();
    }, 200);
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onFoundLock(lock) {
    let listChanged = false;
    if (lock.isPaired()) {
      // check if lock is known
      if (!this.pairedLocks.has(lock.getAddress())) {
        this._bindLockEvents(lock);
        // add it to the list of known locks and connect it
        console.log("Discovered paired lock:", lock.getAddress());
        if (this.client.isMonitoring()) {
          const result = await lock.connect();
          if (result == true) {
            console.log("Successful connect attempt to paired lock", lock.getAddress());
            await this._processOperationLog(lock);
          } else {
            console.log("Unsuccessful connect attempt to paired lock", lock.getAddress());
            this.connectQueue.add(lock.getAddress());
          }
          await lock.disconnect();
        } else {
          // add it to the connect queue
          this.connectQueue.add(lock.getAddress());
        }
        listChanged = true;
      }
    } else if (!lock.isInitialized()) {
      if (!this.newLocks.has(lock.getAddress())) {
        // this._bindLockEvents(lock);
        // check if lock is in pairing mode
        // add it to the list of new locks, ready to be initialized
        console.log("Discovered new lock:", lock.toJSON());
        this.newLocks.set(lock.getAddress(), lock);
        listChanged = true;
        if (this.client.isScanning()) {
          console.log("New lock found, stopping scan");
          await this.stopScan();
        }
      }
    } else {
      console.log("Discovered unknown lock:", lock.toJSON());
    }

    if (listChanged) {
      this.emit("lockListChanged");
    }
  }

  async _onUpdatedLockData() {
    store.setLockData(this.client.getLockData());
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  _bindLockEvents(lock) {
    lock.on("connected", this._onLockConnected.bind(this));
    lock.on("disconnected", this._onLockDisconnected.bind(this));
    lock.on("locked", this._onLockLocked.bind(this));
    lock.on("unlocked", this._onLockUnlocked.bind(this));
    lock.on("updated", this._onLockUpdated.bind(this));
    lock.on("scanICStart", () => this.emit("lockCardScan", lock));
    lock.on("scanFRStart", () => this.emit("lockFingerScan", lock));
    lock.on("scanFRProgress", () => this.emit("lockFingerScanProgress", lock));
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockConnected(lock) {
    if (lock.isPaired()) {
      this.pairedLocks.set(lock.getAddress(), lock);
      console.log("Connected to paired lock " + lock.getAddress());
      this.emit("lockConnected", lock);
    } else {
      console.log("Connected to new lock " + lock.getAddress());
    }
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockDisconnected(lock) {
    console.log("Disconnected from lock " + lock.getAddress());
    this.client.startMonitor();
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockLocked(lock) {
    this.emit("lockLock", lock);
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockUnlocked(lock) {
    this.emit("lockUnlock", lock);
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockUpdated(lock, paramsChanged) {
    console.log("lockUpdated", paramsChanged);
    // if lock has new operations read the operations and send updates
    if (paramsChanged.newEvents == true && lock.hasNewEvents()) {
      if (!lock.isConnected()) {
        const result = await lock.connect();
        // TODO: handle failed connection
      }
      await this._processOperationLog(lock);
    }
    if (paramsChanged.lockedStatus == true) {
      const status = await lock.getLockStatus();
      if (status == LockedStatus.LOCKED) {
        console.log(">>>>>> Lock is now locked from new event <<<<<<");
        this.emit("lockLock", lock);
      }
    }
    if (paramsChanged.batteryCapacity == true) {
      this.emit("lockUpdated", lock);
    }

    await lock.disconnect();
  }

  async _processOperationLog(lock) {
    let operations = await lock.getOperationLog();
    let lastStatus = LockedStatus.UNKNOWN;
    for (let op of operations) {
      if (LogOperateCategory.UNLOCK.includes(op.recordType)) {
        lastStatus = LockedStatus.UNLOCKED;
        console.log(">>>>>> Lock was unlocked <<<<<<");
        this.emit("lockUnlock", lock);
      } else if (LogOperateCategory.LOCK.includes(op.recordType)) {
        lastStatus = LockedStatus.LOCKED;
        console.log(">>>>>> Lock was locked <<<<<<");
        this.emit("lockLock", lock);
      }
    }
    const status = await lock.getLockStatus();
    if (lastStatus != LockedStatus.UNKNOWN && status != lastStatus) {
      if (status == LockedStatus.LOCKED) {
        console.log(">>>>>> Lock is now locked <<<<<<");
        this.emit("lockLock", lock);
      } else if (status == LockedStatus.UNLOCKED) {
        console.log(">>>>>> Lock is now unlocked <<<<<<");
        this.emit("lockUnlock", lock);
      }
    }
  }

  /** Stop scan after 30 seconds */
  async _scanTimer() {
    if (typeof this.scanTimer == "undefined") {
      this.scanTimer = setTimeout(() => {
        this.stopScan();
      }, 30 * 1000);
    }
  }
}

const manager = new Manager();

module.exports = manager;