'use strict';

console.log('===========================================');
console.log('TTLock Addon v0.6.1 - CCCD descriptor fix');
console.log('===========================================');

// Catch errors from noble
process.on('uncaughtException', (error, promise) => {
  console.error('uncaughtException catch:', promise);
  console.error(error);
  const manager = require("./src/manager");
  manager.startupStatus = 1;
});

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }
  isShuttingDown = true;
  console.log(`Received ${signal}, starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000); // 10 second timeout

  try {
    const manager = require("./src/manager");
    const initModule = require("./src/init");
    
    // Stop BLE scanning/monitoring
    if (manager.client) {
      console.log('Stopping BLE monitor...');
      try {
        manager.client.stopMonitor();
        manager.client.stopScan();
      } catch (e) {
        console.error('Error stopping BLE:', e.message);
      }
    }

    // Disconnect all locks
    console.log('Disconnecting locks...');
    for (const [address, lock] of manager.pairedLocks) {
      try {
        if (lock.isConnected()) {
          console.log(`Disconnecting lock ${address}...`);
          await lock.disconnect();
        }
      } catch (e) {
        console.error(`Error disconnecting lock ${address}:`, e.message);
      }
    }

    // Close MQTT connection
    const ha = initModule.ha();
    if (ha && ha.client && ha.connected) {
      console.log('Closing MQTT connection...');
      try {
        await ha.client.end();
      } catch (e) {
        console.error('Error closing MQTT:', e.message);
      }
    }

    // Close HTTP server
    const server = initModule.server();
    if (server) {
      console.log('Closing HTTP server...');
      try {
        server.close();
      } catch (e) {
        console.error('Error closing HTTP server:', e.message);
      }
    }

    clearTimeout(shutdownTimeout);
    console.log('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const { init } = require("./src/init");
init({
 // options go here
  settingsPath: process.env.DATA_PATH || "/data",
  mqttHost: process.env.MQTT_HOST,
  mqttPort: process.env.MQTT_PORT,
  mqttSSL: process.env.MQTT_SSL,
  mqttUser: process.env.MQTT_USER,
  mqttPass: process.env.MQTT_PASS,
  gateway: process.env.GATEWAY || "none",
  gateway_host: process.env.GATEWAY_HOST || "127.0.0.1",
  gateway_port: process.env.GATEWAY_PORT || 2846,
  gateway_key: process.env.GATEWAY_KEY,
  gateway_user: process.env.GATEWAY_USER,
  gateway_pass: process.env.GATEWAY_PASS
});
