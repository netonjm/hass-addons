'use strict';

/**
 * Test directo a la cerradura S562_880a47
 * 
 * Si no existe el fichero de datos, inicializa la cerradura y lo guarda.
 * Si existe, lo lee y ejecuta comandos de abrir/cerrar.
 * 
 * Uso:
 *   node test-lock-direct.js          - Auto: init si no hay datos, info si hay
 *   node test-lock-direct.js init     - Forzar inicialización
 *   node test-lock-direct.js unlock   - Abrir cerradura
 *   node test-lock-direct.js lock     - Cerrar cerradura
 *   node test-lock-direct.js status   - Ver estado
 */

const fs = require('fs');
const path = require('path');
const { TTLockClient, TTLock, sleep } = require('./dist');

const GATEWAY_HOST = process.env.WEBSOCKET_HOST || '10.67.1.40';
const GATEWAY_PORT = process.env.WEBSOCKET_PORT || '8080';
const GATEWAY_KEY = process.env.WEBSOCKET_KEY || 'DEF67951D9050971FFF9D670F838EC89';
const GATEWAY_USER = process.env.WEBSOCKET_USER || 'admin';
const GATEWAY_PASS = process.env.WEBSOCKET_PASS || 'admin';

// Dirección conocida de la cerradura
const LOCK_ADDRESS = '68:e9:cf:47:0a:88';
const LOCK_UUID = '68e9cf470a88';

// Carpeta y fichero de datos
const DATA_DIR = path.join(__dirname, 'lock-data');
const DATA_FILE = path.join(DATA_DIR, `${LOCK_ADDRESS.replace(/:/g, '')}.json`);

// Comando a ejecutar: 'init', 'unlock', 'lock', 'status', 'auto'
const COMMAND = process.argv[2] || 'auto';

console.log('===========================================');
console.log('TTLock Direct Connection Test - v0.6.1');
console.log('===========================================');
console.log(`Gateway: ${GATEWAY_HOST}:${GATEWAY_PORT}`);
console.log(`Lock: ${LOCK_ADDRESS}`);
console.log(`Data file: ${DATA_FILE}`);
console.log(`Command: ${COMMAND}`);
console.log('');

// Verificar si existe el fichero de datos
function loadLockData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log('✓ Datos de cerradura cargados desde fichero');
      return data;
    } catch (err) {
      console.error('Error leyendo fichero de datos:', err.message);
    }
  }
  return null;
}

// Guardar datos de la cerradura
function saveLockData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('✓ Datos de cerradura guardados en:', DATA_FILE);
    return true;
  } catch (err) {
    console.error('Error guardando datos:', err.message);
    return false;
  }
}

async function runTest() {
  const existingData = loadLockData();
  
  const options = {
    lockData: existingData ? [existingData] : [],
    scannerType: "noble-websocket",
    scannerOptions: {
      websocketHost: GATEWAY_HOST,
      websocketPort: parseInt(GATEWAY_PORT),
      websocketAesKey: GATEWAY_KEY,
      websocketUsername: GATEWAY_USER,
      websocketPassword: GATEWAY_PASS
    }
  };

  console.log('Inicializando cliente TTLock...');
  const client = new TTLockClient(options);
  
  try {
    await client.prepareBTService();
    console.log('Servicio BLE preparado');
  } catch (err) {
    console.error('Error preparando servicio BLE:', err.message);
    process.exit(1);
  }

  // Determinar modo de operación
  const needsInit = !existingData || COMMAND === 'init';
  
  if (needsInit) {
    console.log('');
    console.log('>>> MODO INICIALIZACIÓN <<<');
    console.log('Esperando cerradura en modo configuración...');
    console.log('(Toca la cerradura para despertarla)');
  } else {
    console.log('');
    console.log('>>> MODO COMANDO <<<');
    console.log(`Comando a ejecutar: ${COMMAND}`);
  }

  console.log('');
  console.log('Buscando cerradura...');
  
  let lockFound = false;
  
  client.on("foundLock", async (lock) => {
    const address = lock.getAddress();
    
    console.log('');
    console.log('=== LOCK FOUND ===');
    console.log('Address:', address);
    console.log('Name:', lock.getName());
    console.log('Setting Mode:', lock.device?.isSettingMode);
    console.log('Initialized:', lock.isInitialized());
    console.log('');
    
    if (address && address.toLowerCase() === LOCK_ADDRESS.toLowerCase()) {
      if (lockFound) return; // Evitar doble procesamiento
      lockFound = true;
      
      console.log('¡Cerradura encontrada!');
      
      if (needsInit) {
        await initializeLock(lock, client);
      } else {
        await executeCommand(lock, client, COMMAND);
      }
    }
  });

  client.startScanLock();
  console.log('Escaneo iniciado...');

  // Timeout
  setTimeout(() => {
    if (!lockFound) {
      console.log('');
      console.log('❌ Timeout: No se encontró la cerradura');
      console.log('Asegúrate de que esté despierta (toca el teclado)');
    }
    process.exit(1);
  }, 120000);
}

async function initializeLock(lock, client) {
  console.log('');
  console.log('===========================================');
  console.log('INICIALIZANDO CERRADURA...');
  console.log('===========================================');
  
  try {
    // Verificar que está en modo configuración
    if (!lock.device?.isSettingMode) {
      console.log('');
      console.log('⚠️  La cerradura NO está en modo configuración');
      console.log('Para resetear: mantén presionado el botón de reset');
      console.log('hasta que escuches el pitido de confirmación.');
      console.log('');
      console.log('Intentando conectar de todas formas...');
    }
    
    console.log('Conectando (modo rápido)...');
    const connected = await lock.connect(true); // skipDataRead = true para velocidad
    console.log('Resultado connect():', connected);
    
    if (connected) {
      console.log('');
      console.log('¡CONECTADO! Inicializando...');
      
      try {
        const inited = await lock.initLock();
        console.log('Resultado initLock():', inited);
        
        if (inited) {
          console.log('');
          console.log('===========================================');
          console.log('✅ ¡¡¡ÉXITO!!! Cerradura inicializada');
          console.log('===========================================');
          
          const data = lock.getLockData();
          console.log('');
          console.log('Lock Data:', JSON.stringify(data, null, 2));
          
          // Guardar datos
          saveLockData(data);
          
          console.log('');
          console.log('Ahora puedes ejecutar comandos:');
          console.log('  node test-lock-direct.js unlock  - Abrir');
          console.log('  node test-lock-direct.js lock    - Cerrar');
          console.log('  node test-lock-direct.js status  - Estado');
        } else {
          console.log('❌ initLock() devolvió false');
        }
      } catch (err) {
        console.error('Error en initLock:', err.message);
        console.error(err.stack);
      }
    } else {
      console.log('❌ Conexión fallida');
      console.log('Asegúrate de que la cerradura esté despierta');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    try {
      await lock.disconnect();
      console.log('Desconectado');
    } catch (e) {
      console.log('Error desconectando:', e.message);
    }
    process.exit(0);
  }
}

async function executeCommand(lock, client, command) {
  console.log('');
  console.log('===========================================');
  console.log(`EJECUTANDO COMANDO: ${command.toUpperCase()}`);
  console.log('===========================================');
  
  try {
    console.log('Conectando...');
    const connected = await lock.connect(true); // skipDataRead = true para más velocidad
    console.log('Resultado connect():', connected);
    
    if (!connected) {
      console.log('❌ Conexión fallida');
      console.log('Asegúrate de que la cerradura esté despierta');
      process.exit(1);
    }
    
    console.log('¡CONECTADO!');
    console.log('');
    
    let result;
    
    switch (command.toLowerCase()) {
      case 'unlock':
        console.log('Abriendo cerradura...');
        result = await lock.unlock();
        console.log('Resultado unlock():', result);
        if (result) {
          console.log('');
          console.log('🔓 ¡¡¡CERRADURA ABIERTA!!!');
        }
        break;
        
      case 'lock':
        console.log('Cerrando cerradura...');
        result = await lock.lock();
        console.log('Resultado lock():', result);
        if (result) {
          console.log('');
          console.log('🔒 ¡¡¡CERRADURA CERRADA!!!');
        }
        break;
        
      case 'status':
        console.log('Obteniendo estado...');
        const status = await lock.getLockStatus();
        console.log('');
        console.log('Estado de la cerradura:');
        console.log('  Locked:', status);
        console.log('  Battery:', lock.getBattery(), '%');
        console.log('  RSSI:', lock.getRssi());
        break;
        
      case 'auto':
        // En modo auto con datos existentes, mostrar estado
        console.log('Modo auto - mostrando información...');
        console.log('');
        console.log('Información de la cerradura:');
        console.log('  Address:', lock.getAddress());
        console.log('  Name:', lock.getName());
        console.log('  Battery:', lock.getBattery(), '%');
        console.log('  Connected:', lock.isConnected());
        console.log('');
        console.log('Comandos disponibles:');
        console.log('  node test-lock-direct.js unlock  - Abrir');
        console.log('  node test-lock-direct.js lock    - Cerrar');
        console.log('  node test-lock-direct.js status  - Estado');
        console.log('  node test-lock-direct.js init    - Re-inicializar');
        break;
        
      case 'autolock':
        const seconds = parseInt(process.argv[3] || "0", 10);
        console.log('Configurando auto-lock a', seconds, 'segundos...');
        const currentAutolock = await lock.getAutolockTime();
        console.log('  Valor actual:', currentAutolock, 'segundos');
        if (currentAutolock === seconds) {
          console.log('  Ya tiene el valor deseado');
        } else {
          const setResult = await lock.setAutoLockTime(seconds);
          console.log('  Resultado:', setResult);
          const newAutolock = await lock.getAutolockTime();
          console.log('  Nuevo valor:', newAutolock, 'segundos');
        }
        break;
        
      case 'getautolock':
        console.log('Obteniendo configuración de auto-lock...');
        const autolockTime = await lock.getAutolockTime();
        console.log('  Auto-lock:', autolockTime, 'segundos', autolockTime === 0 ? '(DESACTIVADO)' : '');
        break;
        
      case 'mute':
        console.log('Silenciando el lock...');
        // Ensure featureList is available (needed for audio management)
        if (!lock.featureList) {
          console.log('  Obteniendo features del lock...');
          lock.featureList = await lock.searchDeviceFeatureCommand();
        }
        console.log('  featureList:', lock.featureList);
        console.log('  Has AUDIO_MANAGEMENT:', lock.featureList?.has(15));
        const muteResult = await lock.setLockSound(0); // 0 = TURN_OFF
        console.log('  Resultado:', muteResult ? 'Silenciado' : 'Error');
        break;
        
      case 'unmute':
        console.log('Activando sonido del lock...');
        // Ensure featureList is available
        if (!lock.featureList) {
          console.log('  Obteniendo features del lock...');
          lock.featureList = await lock.searchDeviceFeatureCommand();
        }
        const unmuteResult = await lock.setLockSound(1); // 1 = TURN_ON
        console.log('  Resultado:', unmuteResult ? 'Activado' : 'Error');
        break;
        
      case 'getsound':
        console.log('Obteniendo estado del sonido...');
        // Ensure featureList is available
        if (!lock.featureList) {
          console.log('  Obteniendo features del lock...');
          lock.featureList = await lock.searchDeviceFeatureCommand();
        }
        const sound = await lock.getLockSound(true);
        console.log('  Sonido:', sound === 1 ? 'Activado' : sound === 0 ? 'Silenciado' : 'Desconocido');
        break;
        
      default:
        console.log('Comando no reconocido:', command);
        console.log('Comandos válidos: unlock, lock, status, init, mute, unmute, getsound, autolock, getautolock');
    }
    
  } catch (err) {
    console.error('Error ejecutando comando:', err.message);
    console.error(err.stack);
  } finally {
    try {
      await lock.disconnect();
      console.log('');
      console.log('Desconectado');
    } catch (e) {
      console.log('Error desconectando:', e.message);
    }
    process.exit(0);
  }
}

runTest().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
