/**
 * Script para verificar configuración de auto-lock
 */

const { TTLockClient, sleep } = require("./dist");
const fs = require("fs");
const path = require("path");

const GATEWAY_HOST = "10.67.1.40";
const GATEWAY_PORT = 8080;
const GATEWAY_KEY = "DEF67951D9050971FFF9D670F838EC89";
const LOCK_DATA_DIR = path.join(__dirname, "lock-data");
const LOCK_MAC = "68:e9:cf:47:0a:88";

async function main() {
    console.log("===========================================");
    console.log("VERIFICAR CONFIGURACIÓN AUTO-LOCK");
    console.log("===========================================\n");

    // Cargar datos guardados
    const dataFile = path.join(LOCK_DATA_DIR, LOCK_MAC.replace(/:/g, "").toLowerCase() + ".json");
    if (!fs.existsSync(dataFile)) {
        console.error("No hay datos guardados. Ejecuta primero: node test-lock-direct.js init");
        process.exit(1);
    }
    
    const savedData = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
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

    // Buscar la cerradura con timeout
    console.log("Buscando cerradura...");
    
    let lock = null;
    const foundPromise = new Promise((resolve) => {
        client.on("foundLock", (l) => {
            if (l.getAddress().toLowerCase() === LOCK_MAC.toLowerCase()) {
                resolve(l);
            }
        });
    });
    
    client.startScanLock();
    lock = await Promise.race([foundPromise, sleep(15000).then(() => null)]);
    client.stopScanLock();
    
    if (!lock) {
        console.error("Cerradura no encontrada");
        process.exit(1);
    }
    console.log("✓ Cerradura encontrada:", lock.getName());

    // Conectar (ya tiene credenciales por lockData)
    console.log("\nConectando...");
    const connected = await lock.connect({ skipBasicInfo: false });
    if (!connected) {
        console.error("No se pudo conectar");
        process.exit(1);
    }
    console.log("✓ Conectado\n");

    // Verificar capacidades
    console.log("=== CAPACIDADES DEL LOCK ===");
    console.log("Has Autolock:", lock.hasAutolock ? lock.hasAutolock() : "N/A");
    
    // Leer configuración de auto-lock
    if (lock.getAutolockTime) {
        try {
            const autolockTime = await lock.getAutolockTime();
            console.log("Autolock Time:", autolockTime, "segundos");
            
            if (autolockTime > 0) {
                console.log("\n⚠️  AUTO-LOCK ACTIVADO!");
                console.log("   La cerradura se bloqueará automáticamente", autolockTime, "segundos después de desbloquear.");
                console.log("   Esto explica las notificaciones SearchBicycleStatusCommand inesperadas.");
            } else {
                console.log("\n✓ Auto-lock desactivado (valor = 0)");
            }
        } catch (error) {
            console.error("Error leyendo autolock time:", error.message);
        }
    } else {
        console.log("getAutolockTime: No disponible en este lock");
    }

    // Mostrar features del lock
    console.log("\n=== FEATURES DEL LOCK ===");
    if (lock.getFeatures) {
        const features = lock.getFeatures();
        console.log("Features:", features);
    }
    
    // Mostrar featureValue si existe
    console.log("\n=== FEATURE VALUE ===");
    if (lock.privateData && lock.privateData.featureValue) {
        console.log("Feature Value:", lock.privateData.featureValue);
    } else if (lock.featureValue) {
        console.log("Feature Value:", lock.featureValue);
    }

    // Desconectar
    await lock.disconnect();
    console.log("\n✓ Desconectado");
    
    process.exit(0);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
