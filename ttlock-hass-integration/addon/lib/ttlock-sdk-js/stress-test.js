/**
 * Test de estrés: 10 ciclos de UNLOCK/LOCK
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
  console.log(`TEST DE ESTRÉS: ${CYCLES} ciclos UNLOCK/LOCK`);
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

  const results = { success: 0, fail: 0, times: [] };

  for (let i = 1; i <= CYCLES; i++) {
    console.log(`--- Ciclo ${i}/${CYCLES} ---`);
    const cycleStart = Date.now();

    try {
      // Conectar (reintentos automáticos en el SDK)
      const connected = await lock.connect({ skipBasicInfo: true });
      if (!connected) {
        throw new Error("No se pudo conectar");
      }

      // Unlock
      const unlockStart = Date.now();
      await lock.unlock();
      const unlockTime = Date.now() - unlockStart;
      console.log(`  🔓 UNLOCK: ${unlockTime}ms`);

      // Lock (pausa incluida en SDK después de unlock)
      const lockStart = Date.now();
      await lock.lock();
      const lockTime = Date.now() - lockStart;
      console.log(`  🔒 LOCK: ${lockTime}ms`);

      // Desconectar (pausa automática en el SDK)
      await lock.disconnect();

      const cycleTime = Date.now() - cycleStart;
      results.times.push({ cycle: i, unlock: unlockTime, lock: lockTime, total: cycleTime });
      results.success++;
      console.log(`  ✅ Ciclo completado en ${cycleTime}ms\n`);

      // Pausa entre ciclos
      if (i < CYCLES) await sleep(1000);

    } catch (err) {
      results.fail++;
      console.log(`  ❌ ERROR: ${err.message}\n`);
      try { await lock.disconnect(); } catch (e) {}
      await sleep(2000);
    }
  }

  // Resumen
  console.log("===========================================");
  console.log("RESUMEN");
  console.log("===========================================");
  console.log(`Exitosos: ${results.success}/${CYCLES}`);
  console.log(`Fallidos: ${results.fail}/${CYCLES}`);

  if (results.times.length > 0) {
    const avgUnlock = Math.round(results.times.reduce((s, t) => s + t.unlock, 0) / results.times.length);
    const avgLock = Math.round(results.times.reduce((s, t) => s + t.lock, 0) / results.times.length);
    const avgTotal = Math.round(results.times.reduce((s, t) => s + t.total, 0) / results.times.length);
    
    const minTotal = Math.min(...results.times.map(t => t.total));
    const maxTotal = Math.max(...results.times.map(t => t.total));

    console.log(`\nTiempos promedio:`);
    console.log(`  Unlock: ${avgUnlock}ms`);
    console.log(`  Lock: ${avgLock}ms`);
    console.log(`  Ciclo total: ${avgTotal}ms (min: ${minTotal}ms, max: ${maxTotal}ms)`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Error fatal:", e);
  process.exit(1);
});
