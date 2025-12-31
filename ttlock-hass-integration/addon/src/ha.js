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

      await this.client.subscribe("ttlock/+/set");
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
    } else if (process.env.MQTT_DEBUG == "1") {
      console.log("Topic:", topic);
      console.log("Message:", message.toString('utf8'));
    }
  }
}

module.exports = HomeAssistant;