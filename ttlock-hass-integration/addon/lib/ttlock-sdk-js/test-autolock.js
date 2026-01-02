/**
 * Test de auto-lock: unlock y esperar a que el auto-lock se active
 */

const { TTLockClient, sleep } = require("./dist");
const fs = require("fs");

const GATEWAY_HOST = "10.67.1.40";
const GATEWAY_PORT = 8080;
const GATEWAY_KEY = "DEF67951D9050971FFF9D670F838EC89";
const LOCK_ADDRESS = "68:e9:cf:47:0a:88";
const DATA_FILE = "./lock-data/68e9cf470a88.json";

async function main() {
  console.log("===========================================");
  console.log("TEST AUTO-LOCK");
  console.log("===========================================\n");

  const savedData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log("✓ Datos cargados\n");

  const options = {
    lockData: [savedData],
    scannerType: "noble-websocket",
    scannerOptions: {
      websocketHost: GATEWAY_HOST,
      websocketPort: GATEWAY_PORT,
      websocketAesKey: GATEWAY_KEY,
      websocketUsername: "admin",
      websocketPassword: "admin"
    }
  };

  const client = new TTLockClient(options);
  await client.prepareBTService();
  console.log("✓ Cliente conectado\n");

  let lock = null;
  client.on("foundLock", (l) => {
    if (l.getAddress().toLowerCase() === LOCK_ADDRESS) lock = l;
  });

  console.log("Buscando cerradura...");
  client.startScanLock();
  while (!lock) await sleep(100);
  client.stopScanLock();
  console.log("✓ Cerradura encontrada\n");

  // Conectar
  console.log("Conectando...");
  await lock.connect({ skipBasicInfo: false });
  console.log("✓ Conectado");
  console.log("Auto-lock time:", lock.autoLockTime, "segundos\n");

  if (lock.autoLockTime <= 0) {
    console.log("⚠️ Auto-lock no está activado. Actívalo con: node set-autolock.js 5");
    await lock.disconnect();
    process.exit(1);
  }

  // Test 1: Unlock y esperar auto-lock
  console.log("--- Test 1: Unlock y esperar auto-lock ---");
  console.log("Haciendo unlock...");
  const unlockStart = Date.now();
  await lock.unlock();
  console.log(`✓ Unlock completado en ${Date.now() - unlockStart}ms`);
  
  console.log(`Esperando ${lock.autoLockTime + 1}s para que el auto-lock se active...`);
  await sleep((lock.autoLockTime + 1) * 1000);
  console.log("✓ Tiempo de espera completado\n");

  // Test 2: Hacer otro unlock (debería esperar al pending auto-lock si existe)
  console.log("--- Test 2: Segundo unlock (debe esperar pending auto-lock) ---");
  const unlock2Start = Date.now();
  await lock.unlock();
  console.log(`✓ Segundo unlock completado en ${Date.now() - unlock2Start}ms\n`);

  // Test 3: Hacer lock inmediatamente después de unlock
  console.log("--- Test 3: Lock inmediato después de unlock ---");
  const lockStart = Date.now();
  await lock.lock();
  console.log(`✓ Lock completado en ${Date.now() - lockStart}ms\n`);

  // Desconectar
  await lock.disconnect();
  console.log("✓ Desconectado");
  
  console.log("\n===========================================");
  console.log("TEST COMPLETADO");
  console.log("===========================================");
  
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
