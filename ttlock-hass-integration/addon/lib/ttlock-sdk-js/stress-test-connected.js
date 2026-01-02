/**
 * Test de estrés SIN desconectar entre ciclos
 * Mantiene la conexión BLE abierta para medir tiempos reales de comandos
 */

const { TTLockClient, sleep } = require("./dist");
const fs = require("fs");

const GATEWAY_HOST = "10.67.1.40";
const GATEWAY_PORT = 8080;
const GATEWAY_KEY = "DEF67951D9050971FFF9D670F838EC89";
const GATEWAY_USER = "admin";
const GATEWAY_PASS = "admin";
const LOCK_ADDRESS = "68:e9:cf:47:0a:88";
const DATA_FILE = "./lock-data/68e9cf470a88.json";
const CYCLES = 5;

async function main() {
  console.log("===========================================");
  console.log(`TEST SIN DESCONECTAR: ${CYCLES} ciclos UNLOCK/LOCK`);
  console.log("===========================================\n");

  // Cargar datos guardados
  const savedData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log("✓ Datos cargados\n");

  // Inicializar cliente
  const options = {
    lockData: [savedData],
    scannerType: "noble-websocket",
    scannerOptions: {
      websocketHost: GATEWAY_HOST,
      websocketPort: GATEWAY_PORT,
      websocketAesKey: GATEWAY_KEY,
      websocketUsername: GATEWAY_USER,
      websocketPassword: GATEWAY_PASS
    }
  };

  const client = new TTLockClient(options);
  await client.prepareBTService();
  console.log("✓ Cliente conectado\n");

  // Buscar cerradura
  let lock = null;
  client.on("foundLock", (l) => {
    const addr = l.getAddress();
    if (addr && addr.toLowerCase() === LOCK_ADDRESS) {
      lock = l;
    }
  });

  console.log("Buscando cerradura...");
  client.startScanLock();
  while (!lock) await sleep(100);
  client.stopScanLock();
  console.log("✓ Cerradura encontrada\n");

  // Conectar UNA SOLA VEZ
  console.log("Conectando...");
  const connectStart = Date.now();
  const connected = await lock.connect({ skipBasicInfo: true });
  const connectTime = Date.now() - connectStart;
  
  if (!connected) {
    console.error("No se pudo conectar");
    process.exit(1);
  }
  console.log(`✓ Conectado en ${connectTime}ms\n`);

  const results = { success: 0, fail: 0, times: [] };

  for (let i = 1; i <= CYCLES; i++) {
    console.log(`--- Ciclo ${i}/${CYCLES} ---`);
    const cycleStart = Date.now();

    try {
      // Reconectar si es necesario
      if (!lock.isConnected()) {
        console.log("  ⚠️ Reconectando...");
        await lock.connect({ skipBasicInfo: true });
      }

      // Unlock
      const unlockStart = Date.now();
      await lock.unlock();
      const unlockTime = Date.now() - unlockStart;
      console.log(`  🔓 UNLOCK: ${unlockTime}ms`);

      // Lock
      const lockStart = Date.now();
      await lock.lock();
      const lockTime = Date.now() - lockStart;
      console.log(`  🔒 LOCK: ${lockTime}ms`);
      
      // Small delay after lock to allow connection to stabilize
      await sleep(300);

      const cycleTime = Date.now() - cycleStart;
      results.times.push({ cycle: i, unlock: unlockTime, lock: lockTime, total: cycleTime });
      results.success++;
      console.log(`  ✅ Ciclo: ${cycleTime}ms\n`);

    } catch (err) {
      results.fail++;
      console.log(`  ❌ ERROR: ${err.message}`);
      // Intentar desconectar limpiamente y reconectar en siguiente ciclo
      try { await lock.disconnect(); } catch (e) {}
      console.log("");
    }
  }

  // Desconectar al final
  console.log("Desconectando...");
  await lock.disconnect();

  // Resumen
  console.log("\n===========================================");
  console.log("RESUMEN");
  console.log("===========================================");
  console.log(`Exitosos: ${results.success}/${CYCLES}`);
  console.log(`Fallidos: ${results.fail}/${CYCLES}`);
  console.log(`Tiempo conexión inicial: ${connectTime}ms`);

  if (results.times.length > 0) {
    const avgUnlock = Math.round(results.times.reduce((s, t) => s + t.unlock, 0) / results.times.length);
    const avgLock = Math.round(results.times.reduce((s, t) => s + t.lock, 0) / results.times.length);
    const avgTotal = Math.round(results.times.reduce((s, t) => s + t.total, 0) / results.times.length);
    
    const minTotal = Math.min(...results.times.map(t => t.total));
    const maxTotal = Math.max(...results.times.map(t => t.total));

    console.log(`\nTiempos promedio (solo comandos):`);
    console.log(`  Unlock: ${avgUnlock}ms`);
    console.log(`  Lock: ${avgLock}ms`);
    console.log(`  Ciclo (unlock+lock): ${avgTotal}ms (min: ${minTotal}ms, max: ${maxTotal}ms)`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
