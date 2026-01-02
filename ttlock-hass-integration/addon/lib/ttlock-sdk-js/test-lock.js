'use strict';

/**
 * Script de test directo para cerradura TTLock via gateway ESP32
 * 
 * Uso:
 *   WEBSOCKET_HOST=192.168.1.x WEBSOCKET_PORT=8080 node test-lock.js
 * 
 * Con credenciales:
 *   WEBSOCKET_HOST=192.168.1.x WEBSOCKET_PORT=8080 WEBSOCKET_KEY=xxx node test-lock.js
 */

const { TTLockClient, sleep } = require('./dist');

// Configuración desde variables de entorno
const GATEWAY_HOST = process.env.WEBSOCKET_HOST || '10.67.1.x';  // CAMBIAR
const GATEWAY_PORT = process.env.WEBSOCKET_PORT || '8080';
const GATEWAY_KEY = process.env.WEBSOCKET_KEY || '';
const GATEWAY_USER = process.env.WEBSOCKET_USER || '';
const GATEWAY_PASS = process.env.WEBSOCKET_PASS || '';

console.log('===========================================');
console.log('TTLock Direct Test - v0.6.1');
console.log('===========================================');
console.log(`Gateway: ${GATEWAY_HOST}:${GATEWAY_PORT}`);
console.log('');

async function runTest() {
  const options = {
    lockData: [],
    scannerType: "noble-websocket",
    scannerOptions: {
      websocketHost: GATEWAY_HOST,
      websocketPort: parseInt(GATEWAY_PORT),
    }
  };

  if (GATEWAY_KEY) {
    options.scannerOptions.websocketAesKey = GATEWAY_KEY;
  }
  if (GATEWAY_USER) {
    options.scannerOptions.websocketUser = GATEWAY_USER;
  }
  if (GATEWAY_PASS) {
    options.scannerOptions.websocketPass = GATEWAY_PASS;
  }

  console.log('Inicializando cliente TTLock...');
  const client = new TTLockClient(options);
  
  try {
    await client.prepareBTService();
    console.log('Servicio BLE preparado');
  } catch (err) {
    console.error('Error preparando servicio BLE:', err.message);
    process.exit(1);
  }

  console.log('Iniciando escaneo de cerraduras...');
  client.startScanLock();

  client.on("foundLock", async (lock) => {
    console.log('');
    console.log('===========================================');
    console.log('¡Cerradura encontrada!');
    console.log('===========================================');
    console.log('ID:', lock.id);
    console.log('Nombre:', lock.name);
    console.log('Dirección:', lock.address);
    console.log('RSSI:', lock.rssi);
    console.log('Batería:', lock.batteryCapacity + '%');
    console.log('Modo config:', lock.isSettingMode);
    console.log('Inicializada:', lock.isInitialized());
    console.log('');

    if (!lock.isInitialized() && lock.isSettingMode) {
      console.log('Intentando conectar...');
      
      try {
        const connected = await lock.connect();
        console.log('Conectado:', connected);
        
        if (connected) {
          console.log('');
          console.log('Intentando inicializar cerradura...');
          const inited = await lock.initLock();
          console.log('Inicializada:', inited);
          
          if (inited) {
            console.log('');
            console.log('===========================================');
            console.log('¡ÉXITO! Cerradura inicializada correctamente');
            console.log('===========================================');
            console.log('Datos:', JSON.stringify(lock.getLockData(), null, 2));
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
        console.error(err.stack);
      } finally {
        try {
          await lock.disconnect();
          console.log('Desconectado');
        } catch (e) {}
      }
      
      process.exit(0);
    } else {
      console.log('La cerradura ya está inicializada o no está en modo configuración');
    }
  });

  // Timeout después de 60 segundos
  setTimeout(() => {
    console.log('');
    console.log('Timeout: No se encontró ninguna cerradura en 60 segundos');
    process.exit(1);
  }, 60000);
}

runTest().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
