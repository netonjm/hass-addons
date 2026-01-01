'use strict';

const mqtt = require('async-mqtt');
const manager = require('./manager');
const { LockedStatus } = require('ttlock-sdk-js');
const { TTLockError, ErrorCodes } = require('./errors');

class HomeAssistant {
  /**
   * 
   * @param {import('./manager')} manager 
   * @param {Object} options
   * @param {string} options.mqttUrl 
   * @param {string} options.mqttUser 
   * @param {string} options.mqttPass 
   * @param {string} options.discovery_prefix 
   */
  constructor(options) {
    this.mqttUrl = options.mqttUrl;
    this.mqttUser = options.mqttUser;
    this.mqttPass = options.mqttPass;
    this.discovery_prefix = options.discovery_prefix || "homeassistant";
    this.configuredLocks = new Set();

    this.connected = false;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds

    manager.on("lockPaired", this._onLockPaired.bind(this));
    manager.on("lockConnected", this._onLockConnected.bind(this));
    manager.on("lockUnlock", this._onLockUnlock.bind(this));
    manager.on("lockLock", this._onLockLock.bind(this));
    manager.on("lockBatteryUpdated", this._onLockBatteryUpdated.bind(this));
  }

  async connect() {
    if (this.connected) {
      return true;
    }

    try {
      this.client = await mqtt.connectAsync(this.mqttUrl, {
        username: this.mqttUser,
        password: this.mqttPass,
        reconnectPeriod: this.reconnectDelay,
        connectTimeout: 30000
      });

      // Setup event handlers
      this.client.on("message", this._onMQTTMessage.bind(this));
      this.client.on("error", this._onMQTTError.bind(this));
      this.client.on("offline", this._onMQTTOffline.bind(this));
      this.client.on("reconnect", this._onMQTTReconnect.bind(this));
      this.client.on("close", this._onMQTTClose.bind(this));
      this.client.on("connect", this._onMQTTConnect.bind(this));

      await this.client.subscribe("ttlock/+/set");
      await this.client.subscribe("ttlock/+/api");
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log("MQTT connected to", this.mqttUrl);
      return true;
    } catch (error) {
      console.error("MQTT connection failed:", error.message);
      this.connected = false;
      this._scheduleReconnect();
      return false;
    }
  }

  /**
   * Handle MQTT errors
   * @param {Error} error
   */
  _onMQTTError(error) {
    console.error("MQTT error:", error.message);
  }

  /**
   * Handle MQTT offline event
   */
  _onMQTTOffline() {
    console.warn("MQTT connection offline");
    this.connected = false;
  }

  /**
   * Handle MQTT reconnect event
   */
  _onMQTTReconnect() {
    this.reconnectAttempts++;
    console.log(`MQTT reconnecting... (attempt ${this.reconnectAttempts})`);
  }

  /**
   * Handle MQTT connect/reconnect success
   */
  async _onMQTTConnect() {
    console.log("MQTT connected/reconnected");
    this.connected = true;
    this.reconnectAttempts = 0;
    // Re-subscribe after reconnection
    try {
      await this.client.subscribe("ttlock/+/set");
      await this.client.subscribe("ttlock/+/api");
    } catch (e) {
      console.error("MQTT: Failed to resubscribe:", e.message);
    }
  }

  /**
   * Handle MQTT close event
   */
  _onMQTTClose() {
    console.warn("MQTT connection closed");
    this.connected = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  _scheduleReconnect() {
    if (this.reconnecting) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`MQTT: Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempts++;
    console.log(`MQTT: Scheduling reconnect in ${this.reconnectDelay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      this.reconnecting = false;
      await this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Construct a unique ID for a lock, based on the MAC address
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  getLockId(lock) {
    const address = lock.getAddress();
    return address.split(":").join("").toLowerCase();
  }

  /**
   * Configure a lock device in HA
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async configureLock(lock) {
    if (!this.connected) {
      console.warn("MQTT not connected, skipping lock configuration");
      return;
    }
    
    if (this.configuredLocks.has(lock.getAddress())) {
      return;
    }

    try {
      // setup lock entity
      const id = this.getLockId(lock);
      const name = lock.getName();
      const device = {
        identifiers: [
          "ttlock_" + id
        ],
        "name": name,
        "manufacturer": lock.getManufacturer(),
        "model": lock.getModel(),
        "sw_version": lock.getFirmware()
      };

      // setup lock state
      const configLockTopic = this.discovery_prefix + "/lock/" + id + "/lock/config";
      const lockPayload = {
        unique_id: "ttlock_" + id,
        name: name,
        device: device,
        state_topic: "ttlock/" + id,
        command_topic: "ttlock/" + id + "/set",
        payload_lock: "LOCK",
        payload_unlock: "UNLOCK",
        state_locked: "LOCK",
        state_unlocked: "UNLOCK",
        value_template: "{{ value_json.state }}",
        optimistic: false,
        retain: false
      }
      if (process.env.MQTT_DEBUG == "1") {
        console.log("MQTT Publish", configLockTopic, JSON.stringify(lockPayload));
      }
      await this.client.publish(configLockTopic, JSON.stringify(lockPayload), { retain: true });

      // setup battery sensor
      const configBatteryTopic = this.discovery_prefix + "/sensor/" + id + "/battery/config";
      const batteryPayload = {
        unique_id: "ttlock_" + id + "_battery",
        name: name + " Battery",
        device: device,
        device_class: "battery",
        unit_of_measurement: "%",
        state_topic: "ttlock/" + id,
        value_template: "{{ value_json.battery }}",
      }
      if (process.env.MQTT_DEBUG == "1") {
        console.log("MQTT Publish", configBatteryTopic, JSON.stringify(batteryPayload));
      }
      await this.client.publish(configBatteryTopic, JSON.stringify(batteryPayload), { retain: true });

      // setup rssi sensor
      const configRssiTopic = this.discovery_prefix + "/sensor/" + id + "/rssi/config";
      const rssiPayload = {
        unique_id: "ttlock_" + id + "_rssi",
        name: name + " RSSI",
        device: device,
        unit_of_measurement: "dB",
        icon: "mdi:signal",
        state_topic: "ttlock/" + id,
        value_template: "{{ value_json.rssi }}",
      }
      if (process.env.MQTT_DEBUG == "1") {
        console.log("MQTT Publish", configRssiTopic, JSON.stringify(rssiPayload));
      }
      await this.client.publish(configRssiTopic, JSON.stringify(rssiPayload), { retain: true });

      this.configuredLocks.add(lock.getAddress());
      console.log("MQTT: Lock configured:", lock.getAddress());
    } catch (error) {
      console.error("MQTT: Failed to configure lock:", lock.getAddress(), error.message);
    }
  }

  /**
   * Update the readings of a lock in HA
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async updateLockState(lock) {
    if (!this.connected) {
      console.warn("MQTT not connected, skipping state update");
      return;
    }

    try {
      const id = this.getLockId(lock);
      const stateTopic = "ttlock/" + id;
      const lockedStatus = await lock.getLockStatus();
      let statePayload = {
        battery: lock.getBattery(),
        rssi: lock.getRssi(),
      }
      if (lockedStatus != LockedStatus.UNKNOWN) {
        statePayload.state = lockedStatus == LockedStatus.LOCKED ? "LOCK" : "UNLOCK";
      }

      if (process.env.MQTT_DEBUG == "1") {
        console.log("MQTT Publish", stateTopic, JSON.stringify(statePayload));
      }
      await this.client.publish(stateTopic, JSON.stringify(statePayload), { retain: true });
    } catch (error) {
      console.error("MQTT: Failed to update lock state:", lock.getAddress(), error.message);
    }
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockPaired(lock) {
    await this.configureLock(lock);
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockConnected(lock) {
    await this.configureLock(lock);
    await this.updateLockState(lock);
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockUnlock(lock) {
    await this.updateLockState(lock);
  }

  /**
   * 
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockLock(lock) {
    await this.updateLockState(lock);
  }

  /**
   * @param {import('ttlock-sdk-js').TTLock} lock 
   */
  async _onLockBatteryUpdated(lock) {
    await this.updateLockState(lock);
  }

  /**
   * Handle incoming MQTT messages (lock/unlock commands from HA)
   * @param {string} topic 
   * @param {Buffer} message 
   */
  async _onMQTTMessage(topic, message) {
    /**
     * Topic: ttlock/e1581b3a605e/set
       Message: UNLOCK
     */
    let topicArr = topic.split("/");
    if (topicArr.length == 3 && topicArr[0] == "ttlock" && topicArr[2] == "set" && topicArr[1].length == 12) {
      let address = "";
      for (let i = 0; i < topicArr[1].length; i++) {
        address += topicArr[1][i];
        if (i < topicArr[1].length - 1 && i % 2 == 1) {
          address += ":";
        }
      }
      address = address.toUpperCase();
      const command = message.toString('utf8');
      if (process.env.MQTT_DEBUG == "1") {
        console.log("MQTT command:", address, command);
      }
      
      try {
        switch (command) {
          case "LOCK":
            await manager.lockLock(address);
            console.log("MQTT: Lock command successful for", address);
            break;
          case "UNLOCK":
            await manager.unlockLock(address);
            console.log("MQTT: Unlock command successful for", address);
            break;
          default:
            console.warn("MQTT: Unknown command:", command);
        }
      } catch (error) {
        console.error("MQTT: Command failed:", command, address, error.message);
        // Optionally publish error state back to HA
        if (error instanceof TTLockError) {
          console.error("MQTT: Error code:", error.code);
        }
      }
    } else if (topicArr.length == 3 && topicArr[0] == "ttlock" && topicArr[2] == "api" && topicArr[1].length == 12) {
      // API commands for passcodes, cards, fingerprints
      await this._onMQTTApiMessage(topicArr[1], message.toString('utf8'));
    } else if (process.env.MQTT_DEBUG == "1") {
      console.log("Topic:", topic);
      console.log("Message:", message.toString('utf8'));
    }
  }

  /**
   * Convert lock ID to MAC address
   * @param {string} lockId - Lock ID (12 hex chars without colons)
   * @returns {string} MAC address with colons
   */
  _lockIdToAddress(lockId) {
    let address = "";
    for (let i = 0; i < lockId.length; i++) {
      address += lockId[i];
      if (i < lockId.length - 1 && i % 2 == 1) {
        address += ":";
      }
    }
    return address.toUpperCase();
  }

  /**
   * Publish API response
   * @param {string} lockId - Lock ID
   * @param {string} requestId - Request ID for correlation
   * @param {boolean} success - Whether the operation was successful
   * @param {*} data - Response data
   * @param {string} error - Error message if failed
   */
  async _publishApiResponse(lockId, requestId, success, data = null, error = null) {
    if (!this.connected) return;

    const responseTopic = `ttlock/${lockId}/response`;
    const response = {
      requestId,
      success,
      timestamp: new Date().toISOString()
    };

    if (success && data !== null) {
      response.data = data;
    }
    if (!success && error) {
      response.error = error;
    }

    try {
      await this.client.publish(responseTopic, JSON.stringify(response), { retain: false });
      if (process.env.MQTT_DEBUG == "1") {
        console.log("MQTT API Response:", responseTopic, JSON.stringify(response));
      }
    } catch (err) {
      console.error("MQTT: Failed to publish API response:", err.message);
    }
  }

  /**
   * Handle API messages for passcodes, cards, fingerprints
   * @param {string} lockId - Lock ID (12 hex chars)
   * @param {string} messageStr - JSON message string
   */
  async _onMQTTApiMessage(lockId, messageStr) {
    const address = this._lockIdToAddress(lockId);
    let request;

    try {
      request = JSON.parse(messageStr);
    } catch (e) {
      console.error("MQTT API: Invalid JSON:", messageStr);
      await this._publishApiResponse(lockId, null, false, null, "Invalid JSON");
      return;
    }

    const { type, requestId } = request;
    if (!type) {
      await this._publishApiResponse(lockId, requestId, false, null, "Missing 'type' field");
      return;
    }

    console.log(`MQTT API: ${type} for ${address}`, requestId ? `(${requestId})` : "");

    try {
      let result;

      switch (type) {
        // ===== PASSCODE OPERATIONS =====
        case "getPasscodes":
          result = await manager.getPasscodes(address);
          break;

        case "addPasscode": {
          // passcodeType: 1=permanent, 2=limited uses, 3=timed period, 4=cyclic
          // For timed passcodes (type 3), startDate and endDate are required
          const { passcode, startDate, endDate, passcodeType, name } = request;
          if (!passcode) {
            throw new Error("Missing required field: passcode");
          }
          const pType = passcodeType || 3; // Default to timed period
          if (pType === 3 && (!startDate || !endDate)) {
            throw new Error("Missing required fields for timed passcode: startDate, endDate");
          }
          result = await manager.addPasscode(
            address,
            pType,
            passcode,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
          );
          break;
        }

        case "updatePasscode": {
          // oldPasscode is required to identify which passcode to update
          const { oldPasscode, newPasscode, startDate, endDate, passcodeType } = request;
          if (!oldPasscode) {
            throw new Error("Missing required field: oldPasscode");
          }
          const pType = passcodeType || 3;
          result = await manager.updatePasscode(
            address,
            pType,
            oldPasscode,
            newPasscode || oldPasscode,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
          );
          break;
        }

        case "deletePasscode": {
          const { passcode, passcodeType } = request;
          if (!passcode) {
            throw new Error("Missing required field: passcode");
          }
          const pType = passcodeType || 3;
          result = await manager.deletePasscode(address, pType, passcode);
          break;
        }

        // ===== IC CARD OPERATIONS =====
        case "getCards":
          result = await manager.getCards(address);
          break;

        case "addCard": {
          const { cardNumber, startDate, endDate, name } = request;
          if (!startDate || !endDate) {
            throw new Error("Missing required fields: startDate, endDate");
          }
          // cardNumber is optional - if not provided, card must be scanned physically
          result = await manager.addCard(
            address,
            new Date(startDate),
            new Date(endDate),
            cardNumber || undefined,
            name || undefined
          );
          break;
        }

        case "deleteCard": {
          const { cardId } = request;
          if (!cardId) {
            throw new Error("Missing required field: cardId");
          }
          result = await manager.deleteCard(address, cardId);
          break;
        }

        // ===== FINGERPRINT OPERATIONS =====
        case "getFingerprints":
          result = await manager.getFingers(address);
          break;

        case "deleteFingerprint": {
          const { fingerprintId } = request;
          if (!fingerprintId) {
            throw new Error("Missing required field: fingerprintId");
          }
          result = await manager.deleteFinger(address, fingerprintId);
          break;
        }

        // ===== LOCK OPERATIONS =====
        case "lock":
          await manager.lockLock(address);
          result = { state: "locked" };
          break;

        case "unlock":
          await manager.unlockLock(address);
          result = { state: "unlocked" };
          break;

        case "getOperationLog": {
          const { logType } = request;
          result = await manager.getOperationLog(address, logType);
          break;
        }

        case "setAutoLock": {
          const { seconds } = request;
          if (seconds === undefined) {
            throw new Error("Missing required field: seconds");
          }
          result = await manager.setAutoLock(address, seconds);
          break;
        }

        default:
          throw new Error(`Unknown API command: ${type}`);
      }

      await this._publishApiResponse(lockId, requestId, true, result);
      console.log(`MQTT API: ${type} successful for ${address}`);

    } catch (error) {
      console.error(`MQTT API: ${type} failed for ${address}:`, error.message);
      const errorMessage = error instanceof TTLockError 
        ? `${error.message} (code: ${error.code})`
        : error.message;
      await this._publishApiResponse(lockId, requestId, false, null, errorMessage);
    }
  }
}

module.exports = HomeAssistant;