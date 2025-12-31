'use strict';

const fs = require('fs').promises;
const EventEmitter = require('events');
const { TTLockError, ErrorCodes } = require('./errors');

class Store extends EventEmitter {
  constructor() {
    super();
    this.settingsPath = "/data";
    this.lockData = [];
    this.aliasData = {
      lock: {},
      card: {},
      finger: {}
    };
    this.lastError = null;
  }

  setDataPath(path) {
    this.settingsPath = path;
  }

  getDataPath() {
    return this.settingsPath;
  }

  setLockData(newData) {
    this.lockData = newData;
    this.saveData();
  }

  getLockData() {
    return this.lockData;
  }

  setLockAlias(address, alias) {
    this.aliasData.lock[address] = alias;
    this.saveData();
  }

  getLockAlias(address, defaultValue = false) {
    if (typeof this.aliasData.lock[address] != "undefined") {
      return this.aliasData.lock[address];
    } else {
      return defaultValue;
    }
  }

  setCardAlias(card, alias) {
    if (typeof alias != "undefined" && alias != "") {
      this.aliasData.card[card] = alias;
      this.saveData();
    }
  }

  getCardAlias(card) {
    if (typeof this.aliasData.card[card] != "undefined") {
      return this.aliasData.card[card];
    } else {
      return card;
    }
  }

  deleteCardAlias(card) {
    delete this.aliasData.card[card];
    this.saveData();
  }

  setFingerAlias(finger, alias) {
    this.aliasData.finger[finger] = alias;
    this.saveData();
  }

  getFingerAlias(finger) {
    if (typeof this.aliasData.finger[finger] != "undefined") {
      return this.aliasData.finger[finger];
    } else {
      return finger;
    }
  }

  deleteFingerAlias(finger) {
    delete this.aliasData.finger[finger];
    this.saveData();
  }

  /**
   * Load saved data from disk
   * @returns {Promise<Array>} Lock data array
   * @emits error When loading fails
   */
  async loadData() {
    let lockDataLoaded = false;
    let aliasDataLoaded = false;

    // Load lock data
    try {
      await fs.access(this.settingsPath + "/lockData.json");
      const lockDataTxt = (await fs.readFile(this.settingsPath + "/lockData.json")).toString();
      this.lockData = JSON.parse(lockDataTxt);
      lockDataLoaded = true;
      console.log("Store: Lock data loaded successfully");
    } catch (error) {
      this.lockData = [];
      if (error.code === 'ENOENT') {
        console.log("Store: No existing lock data found, starting fresh");
      } else {
        const storeError = new TTLockError(
          ErrorCodes.STORE_LOAD_FAILED,
          `Failed to load lock data: ${error.message}`,
          { file: 'lockData.json', originalError: error.message }
        );
        this.lastError = storeError;
        this.emit('error', storeError);
        console.error("Store: Failed to load lock data:", error.message);
      }
    }

    // Load alias data
    try {
      await fs.access(this.settingsPath + "/aliasData.json");
      const aliasDataTxt = (await fs.readFile(this.settingsPath + "/aliasData.json")).toString();
      this.aliasData = JSON.parse(aliasDataTxt);
      aliasDataLoaded = true;
      console.log("Store: Alias data loaded successfully");
    } catch (error) {
      this.aliasData = {
        lock: {},
        card: {},
        finger: {}
      };
      if (error.code === 'ENOENT') {
        console.log("Store: No existing alias data found, starting fresh");
      } else {
        const storeError = new TTLockError(
          ErrorCodes.STORE_LOAD_FAILED,
          `Failed to load alias data: ${error.message}`,
          { file: 'aliasData.json', originalError: error.message }
        );
        this.lastError = storeError;
        this.emit('error', storeError);
        console.error("Store: Failed to load alias data:", error.message);
      }
    }

    return this.lockData;
  }

  /**
   * Save data to disk
   * @returns {Promise<boolean>} True if save was successful
   * @emits error When saving fails
   * @emits saved When save is successful
   */
  async saveData() {
    let lockDataSaved = false;
    let aliasDataSaved = false;

    // Save lock data
    try {
      await fs.writeFile(this.settingsPath + "/lockData.json", Buffer.from(JSON.stringify(this.lockData, null, 2)));
      lockDataSaved = true;
    } catch (error) {
      const storeError = new TTLockError(
        ErrorCodes.STORE_SAVE_FAILED,
        `Failed to save lock data: ${error.message}`,
        { file: 'lockData.json', originalError: error.message }
      );
      this.lastError = storeError;
      this.emit('error', storeError);
      console.error("Store: Failed to save lock data:", error.message);
    }

    // Save alias data
    try {
      await fs.writeFile(this.settingsPath + "/aliasData.json", Buffer.from(JSON.stringify(this.aliasData, null, 2)));
      aliasDataSaved = true;
    } catch (error) {
      const storeError = new TTLockError(
        ErrorCodes.STORE_SAVE_FAILED,
        `Failed to save alias data: ${error.message}`,
        { file: 'aliasData.json', originalError: error.message }
      );
      this.lastError = storeError;
      this.emit('error', storeError);
      console.error("Store: Failed to save alias data:", error.message);
    }

    const success = lockDataSaved && aliasDataSaved;
    if (success) {
      this.emit('saved');
    }
    return success;
  }

  /**
   * Get the last error that occurred
   * @returns {TTLockError|null}
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Clear the last error
   */
  clearLastError() {
    this.lastError = null;
  }
}

const store = new Store();

module.exports = store;