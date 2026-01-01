# Correcciones Propuestas para TTLock SDK

## Resumen de Problemas Identificados

Basado en el análisis del protocolo TTLock (ver [TTLOCK_PROTOCOL_STUDY.md](./TTLOCK_PROTOCOL_STUDY.md)), se han identificado las siguientes diferencias críticas entre el SDK de Android (que funciona) y la implementación JS actual:

### Problema Principal: Falta de Delays

El SDK de Android tiene un **delay de 2500-5500ms** después de escribir comandos, mientras que el SDK JS no tiene ningún delay significativo. Esto causa que el lock desconecte antes de completar el procesamiento del comando.

---

## Corrección 1: Delay Post-Escritura en writeCharacteristic

### Archivo: `dist/device/TTBluetoothDevice.js`

### Cambio Propuesto:

```javascript
async writeCharacteristic(characteristic, data) {
    if (process.env.TTLOCK_DEBUG_COMM == "1") {
        console.log("Sending command:", data.toString("hex"));
    }
    let index = 0;
    do {
        const remaining = data.length - index;
        const written = await characteristic.write(
            data.subarray(index, index + Math.min(MTU, remaining)), 
            true
        );
        if (!written) {
            return false;
        }
        // AÑADIR: Delay entre fragmentos MTU
        if (index + MTU < data.length) {
            await timingUtil_1.sleep(20);
        }
        index += MTU;
    } while (index < data.length);
    
    // AÑADIR: Delay post-escritura (similar al SDK Android)
    await timingUtil_1.sleep(100);
    
    return true;
}
```

---

## Corrección 2: Aumentar Delay en Bucle de Espera

### Archivo: `dist/device/TTBluetoothDevice.js`

### Problema:
El bucle de espera usa `sleep(5)` que es demasiado agresivo y no da tiempo al lock.

### Cambio Propuesto:

```javascript
async sendCommand(command, waitForResponse = true, ignoreCrc = false) {
    // ... código existente ...
    
    // CAMBIAR: Aumentar sleep de 5ms a 50ms
    let cycles = 0;
    const maxCycles = 200; // Timeout de 10 segundos (200 * 50ms)
    while (this.responses.length == 0 && this.connected && cycles < maxCycles) {
        cycles++;
        await timingUtil_1.sleep(50);  // CAMBIAR: de 5 a 50
    }
    
    // AÑADIR: Check de timeout
    if (cycles >= maxCycles) {
        this.waitingForResponse = false;
        this.responses = [];
        throw new Error("Command timeout waiting for response");
    }
    
    // ... resto del código ...
}
```

---

## Corrección 3: Delay Post-Conexión

### Archivo: `dist/device/TTBluetoothDevice.js`

### Problema:
No hay delay después de establecer la conexión para que el lock se estabilice.

### Cambio Propuesto en `connect()`:

```javascript
async connect() {
    if (typeof this.device != "undefined" && this.device.connectable) {
        await this.scanner.stopScan();
        if (await this.device.connect()) {
            console.log("BLE Device reading basic info");
            await this.readBasicInfo();
            console.log("BLE Device read basic info");
            const subscribed = await this.subscribe();
            console.log("BLE Device subscribed");
            if (!subscribed) {
                await this.device.disconnect();
                return false;
            }
            else {
                // AÑADIR: Delay post-conexión para estabilizar
                await timingUtil_1.sleep(500);
                
                this.connected = true;
                this.emit("connected");
                return true;
            }
        }
        // ...
    }
    // ...
}
```

---

## Corrección 4: Limpieza de Estado en onDeviceDisconnected

### Archivo: `dist/device/TTBluetoothDevice.js`

### Estado Actual (YA IMPLEMENTADO - ✅):

```javascript
async onDeviceDisconnected() {
    this.connected = false;
    // Reset state to prevent "Command already in progress" errors
    this.waitingForResponse = false;
    this.responses = [];
    this.incomingDataBuffer = Buffer.from([]);
    this.emit("disconnected");
}
```

---

## Corrección 5: Delay Entre Reintentos en sendCommand

### Archivo: `dist/device/TTBluetoothDevice.js`

### Estado Actual:
```javascript
if (retry > 0) {
    await timingUtil_1.sleep(200);
}
```

### Cambio Propuesto:
```javascript
if (retry > 0) {
    // CAMBIAR: Aumentar delay de reintento de 200ms a 500ms
    await timingUtil_1.sleep(500);
    console.log(`Retry ${retry} after delay`);
}
```

---

## Implementación Consolidada

### Archivo Modificado Completo: `TTBluetoothDevice.js`

Las modificaciones principales son:

1. **writeCharacteristic**: Añadir delay de 20ms entre fragmentos y 100ms post-escritura
2. **sendCommand**: Aumentar sleep a 50ms, añadir timeout absoluto, aumentar delay de reintento
3. **connect**: Añadir delay de 500ms post-suscripción

---

## Script de Parche

Para aplicar las correcciones, se puede usar el siguiente script bash:

```bash
#!/bin/bash
# patch-ttlock-sdk.sh

SDK_FILE="addon/lib/ttlock-sdk-js/dist/device/TTBluetoothDevice.js"

# Backup
cp "$SDK_FILE" "${SDK_FILE}.backup"

# Aplicar parches usando sed
# (Implementar según necesidad)

echo "Parches aplicados"
```

---

## Verificación

Después de aplicar las correcciones, verificar:

1. **Init Lock**: Debería completarse sin "Disconnected while waiting for response"
2. **Unlock**: Debería obtener respuesta de checkUserTime y completar unlock
3. **Reintentos**: No deberían fallar con "connection canceled"

### Comando de Prueba:

```bash
# Activar debug
export TTLOCK_DEBUG_COMM=1

# Reiniciar addon y observar logs
```

---

## Próximos Pasos

1. Aplicar correcciones al SDK local
2. Probar con el lock
3. Ajustar tiempos según resultados
4. Si funciona, hacer PR al repositorio upstream
