/**
 * Configurar auto-lock de la cerradura
 * Uso: node set-autolock.js [segundos]
 *   0 = desactivar
 *   1-60 = segundos de espera antes de auto-bloquear
 */

const { TTLockClient, sleep } = require("./dist");
const fs = require("fs");
const path = require("path");

const GATEWAY_HOST = "10.67.1.40";
const GATEWAY_PORT = 8080;
const GATEWAY_KEY = "DEF67951D9050971FFF9D670F838EC89";
const LOCK_MAC = "68:e9:cf:47:0a:88";

const NEW_VALUE = parseInt(process.argv[2] || "0", 10);

async function main() {
    console.log("===========================================");
    console.log("CONFIGURAR AUTO-LOCK");
    console.log("===========================================");
    console.log("Nuevo valor:", NEW_VALUE, "segundos", NEW_VALUE === 0 ? "(DESACTIVADO)" : "");
    console.log("");

    const savedData = JSON.parse(fs.readFileSync("./lock-data/68e9cf470a88.json", "utf-8"));

    const client = new TTLockClient({
        lockData: [savedData],
        scannerType: "noble-websocket",
        scannerOptions: {
            websocketHost: GATEWAY_HOST,
            websocketPort: GATEWAY_PORT,
            websocketAesKey: GATEWAY_KEY,
            websocketUsername: "admin",
            websocketPassword: "admin"
        }
    });

    await client.prepareBTService();
    console.log("Cliente conectado");

    let lock = null;
    const foundPromise = new Promise((resolve) => {
        client.on("foundLock", (l) => {
            if (l.getAddress().toLowerCase() === LOCK_MAC) resolve(l);
        });
    });

    client.startScanLock();
    lock = await Promise.race([foundPromise, sleep(10000).then(() => null)]);
    client.stopScanLock();

    if (!lock) {
        console.error("Lock no encontrado");
        process.exit(1);
    }
    console.log("Lock encontrado:", lock.getName());

    console.log("Conectando (leyendo features)...");
    await lock.connect({ skipBasicInfo: false, timeout: 30000 });
    console.log("Conectado");

    const currentValue = await lock.getAutolockTime();
    console.log("Autolock actual:", currentValue, "segundos");

    if (currentValue === NEW_VALUE) {
        console.log("Ya tiene el valor deseado, no hay cambios");
    } else {
        console.log("Configurando autolock a", NEW_VALUE, "segundos...");
        const result = await lock.setAutoLockTime(NEW_VALUE);
        console.log("Resultado:", result);

        const newValue = await lock.getAutolockTime();
        console.log("Nuevo autolock:", newValue, "segundos");
    }

    await lock.disconnect();
    console.log("Listo");
    process.exit(0);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
