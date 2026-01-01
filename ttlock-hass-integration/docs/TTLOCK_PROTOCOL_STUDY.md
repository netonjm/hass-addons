# TTLock BLE Protocol Study

## Resumen Ejecutivo

Este documento analiza en profundidad el protocolo BLE de TTLock, comparando la implementación del SDK original de Android con la implementación actual en JavaScript (ttlock-sdk-js), identificando diferencias críticas que pueden causar fallos de conexión y comunicación.

---

## 1. Arquitectura del Protocolo

### 1.1 Servicios y Características BLE

El protocolo TTLock utiliza los siguientes servicios y características BLE:

```
Service: 00001910-0000-1000-8000-00805f9b34fb (TTLock Service)
├── UUID_WRITE: 0000fff2-0000-1000-8000-00805f9b34fb (Write commands)
├── UUID_READ:  0000fff4-0000-1000-8000-00805f9b34fb (Read notifications)
└── Descriptor: 00002902-0000-1000-8000-00805f9b34fb (CCCD for notifications)

Service: 0000180a-0000-1000-8000-00805f9b34fb (Device Information)
├── 00002a24: Model Number
├── 00002a26: Firmware Revision
└── 00002a27: Hardware Revision
```

### 1.2 Estructura de Comandos

Los comandos TTLock siguen esta estructura:

```
Header (2 bytes) | Protocol Type | Sub Version | Scene | Organization (2) | Sub Org (2) | Command Type | Encrypt | Length (2) | Data (encrypted) | CRC | CRLF (0x0D 0x0A)
```

- **Header**: Siempre `0x7F 0x5A`
- **Protocol Type**: Versión del protocolo (típicamente 5 para V3)
- **Command Type**: Tipo de operación (ver sección 2)
- **Encrypt**: `0x55` indica datos encriptados con AES-128
- **CRC**: CRC-8/MAXIM del payload
- **CRLF**: Terminador de comando `0x0D 0x0A`

### 1.3 Encriptación

- **AES-128 ECB** para encriptar/desencriptar datos
- **defaultAesKey**: `987623E8A923A1BB3D9E7D0378124588` (usado durante init)
- El lock genera una **aesKey personalizada** durante el pairing que se usa posteriormente

---

## 2. Comandos Principales

### 2.1 Comandos de Inicialización

| Comando | Hex | Descripción |
|---------|-----|-------------|
| COMM_INITIALIZATION | 0x45 ('E') | Inicio de comunicación |
| COMM_GET_AES_KEY | 0x19 | Obtener clave AES del lock |
| COMM_ADD_ADMIN | 0x56 ('V') | Añadir administrador |
| COMM_RESPONSE | 0x54 ('T') | Respuesta genérica |

### 2.2 Comandos de Autenticación

| Comando | Hex | Descripción |
|---------|-----|-------------|
| COMM_CHECK_ADMIN | 0x41 ('A') | Verificar administrador |
| COMM_CHECK_USER_TIME | 0x55 ('U') | Verificar tiempo de usuario |
| COMM_CHECK_RANDOM | ? | Verificar número aleatorio |

### 2.3 Comandos de Operación

| Comando | Hex | Descripción |
|---------|-----|-------------|
| COMM_UNLOCK | 0x55 ('U') | Abrir cerradura |
| COMM_FUNCTION_LOCK | ? | Cerrar cerradura |
| COMM_RESET_LOCK | 0x52 ('R') | Resetear cerradura |

### 2.4 Comandos de Configuración

| Comando | Hex | Descripción |
|---------|-----|-------------|
| COMM_TIME_CALIBRATE | ? | Calibrar hora |
| COMM_SEARCHE_DEVICE_FEATURE | 0x01 | Buscar características |
| COMM_AUTO_LOCK_MANAGE | ? | Gestión auto-lock |
| COMM_AUDIO_MANAGE | ? | Gestión audio |

---

## 3. Flujos de Operación

### 3.1 Flujo de Inicialización (Pairing)

```
1. CONNECT to lock
2. Discover services and characteristics
3. Subscribe to notifications on fff4
4. COMM_INITIALIZATION (with SCIENER vendor)
5. COMM_GET_AES_KEY → recibir aesKey personalizada
6. COMM_ADD_ADMIN → enviar adminPs + unlockKey (números aleatorios de 9 dígitos)
7. COMM_TIME_CALIBRATE → calibrar hora (puede dar CRC malo)
8. COMM_SEARCHE_DEVICE_FEATURE → obtener features del lock
9. [Según features]: audio, autolock, adminCode, etc.
10. COMM_CONTROL_REMOTE_UNLOCK (si soportado)
11. COMM_OPERATE_FINISHED → finalizar operación
12. DISCONNECT
```

### 3.2 Flujo de Unlock/Lock

```
1. CONNECT to lock
2. Discover services and subscribe to notifications
3. COMM_CHECK_USER_TIME → obtener psFromLock (token temporal)
4. COMM_UNLOCK/LOCK → enviar (psFromLock + unlockKey) + timestamp
5. Esperar respuesta
6. DISCONNECT
```

**Importante**: El SDK de Android espera una respuesta del lock después de cada comando. La respuesta contiene:
- Estado de éxito/error
- Capacidad de batería
- Otros datos según el comando

---

## 4. Diferencias Críticas entre Android SDK y JS SDK

### 4.1 ⚠️ DELAY POST-ESCRITURA (2500-5500ms)

**Análisis del SDK Android** (de SDK-Analysis.md):

```
- BluetoothImpl::onCharacteristicWrite
  - cycle android.bluetooth.BluetoothGatt::writeCharacteristic until no data is left
  - delay of 2500ms - 5500ms (probably to wait for a characteristic change before disconnecting ?)
  - BluetoothImpl::disconnect
```

**Implementación JS actual** (TTBluetoothDevice.ts):

```typescript
private async writeCharacteristic(characteristic, data): Promise<boolean> {
    let index = 0;
    do {
        const remaining = data.length - index;
        const written = await characteristic.write(data.subarray(index, index + Math.min(MTU, remaining)), true);
        if (!written) {
            return false;
        }
        // await sleep(10);  ← COMENTADO, solo 10ms
        index += MTU;
    } while (index < data.length);
    return true;
}
```

**Problema**: El SDK JS no tiene el delay de 2500-5500ms que tiene el Android, lo que puede causar que el lock desconecte antes de procesar completamente el comando.

### 4.2 ⚠️ GESTIÓN DE ESTADO DE CONEXIÓN

**SDK Android**:
- Mantiene estado de conexión persistente
- Reintentos automáticos con delays apropiados
- Limpieza de estado en desconexión

**SDK JS** (NobleDevice.ts):

```typescript
async connect(timeout: number = 10): Promise<boolean> {
    // ...
    if (!this.connected) {
        this.peripheral.cancelConnect();  // ← CORROMPE ESTADO PARA REINTENTOS
    }
    // ...
}

onDisconnect(error: string) {
    this.connected = false;
    this.connecting = false;
    this.resetBusy();
    this.services = new Map();
    this.emit("disconnected");
    // ← NO HAY LIMPIEZA DE ESTADO DEL PERIPHERAL
}
```

**Problema**: Cuando una conexión falla o el lock desconecta prematuramente, `cancelConnect()` corrompe el estado del peripheral para futuros reintentos.

### 4.3 ⚠️ ESPERA DE RESPUESTA

**SDK Android**:
- Tiene timeout específico por tipo de comando
- Reintentos con backoff
- Manejo de respuestas parciales

**SDK JS** (TTBluetoothDevice.ts):

```typescript
async sendCommand(command, waitForResponse = true, ignoreCrc = false): Promise<CommandEnvelope | void> {
    // ...
    while (this.responses.length == 0 && this.connected) {
        cycles++;
        await sleep(5);  // ← Solo 5ms por ciclo
    }
    
    if (!this.connected) {
        throw new Error("Disconnected while waiting for response");  // ← ERROR COMÚN
    }
    // ...
}
```

**Problema**: El bucle de espera es muy rápido (5ms) y no tiene timeout absoluto. Si el lock desconecta durante la espera, se pierde el comando sin reintento.

### 4.4 ⚠️ FRAGMENTACIÓN MTU

**SDK Android**:
- Respeta MTU negociado
- Delays entre fragmentos

**SDK JS**:

```typescript
const MTU = 20;  // ← HARDCODED

do {
    const written = await characteristic.write(data.subarray(index, index + Math.min(MTU, remaining)), true);
    // await sleep(10);  ← COMENTADO
    index += MTU;
} while (index < data.length);
```

**Problema**: MTU hardcoded a 20 bytes y sin delays entre fragmentos. En conexiones inestables puede causar pérdida de datos.

---

## 5. Análisis del Gateway ESP32

### 5.1 Arquitectura

```
Home Assistant → WebSocket (8080) → ESP32 → BLE → TTLock
                 └── AES-128 CBC auth
```

### 5.2 Puntos Críticos Identificados

#### 5.2.1 Reconexión BLE

```cpp
// ble_api.cpp - Intentos de conexión
bool BLEApi::connect(BLEPeripheralID id) {
    peripheral->setConnectTimeout(10);  // ← 10 segundos timeout
    do {
        connected = peripheral->connect(address);
        retry--;
        if (!connected && retry > 0) {
            vTaskDelay(1000 / portTICK_PERIOD_MS);  // ← 1 segundo entre reintentos
        }
    } while (!connected && retry > 0);
}
```

**Problema potencial**: El timeout de 10 segundos puede ser insuficiente si el lock está ocupado o en estado de espera.

#### 5.2.2 Notificaciones de Características

```cpp
// ble_api.cpp
void BLEApi::_onCharacteristicNotification(
    NimBLERemoteCharacteristic *characteristic, 
    uint8_t *data, 
    size_t length, 
    bool isNotify) {
    // Reenvía directamente al cliente WebSocket
    _cbOnCharacteristicNotification(id, service, characteristic, data, isNotify);
}
```

**Observación**: Las notificaciones se reenvían inmediatamente sin buffering ni validación.

#### 5.2.3 Gestión de Memoria

```cpp
// Después de desconexión
vTaskDelay(1000 / portTICK_PERIOD_MS);
Serial.println("Dealocating memory");
NimBLEDevice::deleteClient(peripheral);
```

**Observación**: Hay un delay de 1 segundo antes de liberar memoria, lo cual es bueno para estabilidad.

---

## 6. Problemas Documentados (Issues)

### 6.1 Issue #11: "How can it work continuously?"

**Síntoma**: `startScanLock()` devuelve `false` en la segunda ejecución.

**Causa**: `nobleState != "poweredOn"` después de operaciones previas.

**Solución aplicada**: Usar `startMonitor()` en lugar de `startScanLock()` para escucha pasiva.

### 6.2 Issue #20: "ESP32-IDF stuck notifications missing"

**Síntoma**: Después de enviar `COMM_INITIALIZATION`, no se recibe respuesta.

**Posible causa**: La suscripción a notificaciones no se completó correctamente antes de enviar comandos.

### 6.3 Problema CRC Malo

De `Bad CRC quest.md`:

```
Sending command: 7f5a0503010001000107aa10...
Received response: 7f5a0503020001000154aa10...
Bad CRC should be 87 and we got 9
```

**Observación**: Algunos comandos (especialmente `COMM_TIME_CALIBRATE`) devuelven respuestas con CRC incorrecto. El SDK tiene la opción `TTLOCK_IGNORE_CRC=1` para estos casos.

---

## 7. Recomendaciones de Mejora

### 7.1 Añadir Delays Post-Escritura

```javascript
// Propuesta para writeCharacteristic
private async writeCharacteristic(characteristic, data): Promise<boolean> {
    let index = 0;
    do {
        const written = await characteristic.write(
            data.subarray(index, index + Math.min(MTU, remaining)), 
            true
        );
        if (!written) return false;
        
        // AÑADIR: Delay entre fragmentos
        await sleep(20);  
        index += MTU;
    } while (index < data.length);
    
    // AÑADIR: Delay post-escritura como el SDK Android
    await sleep(100);  // Mínimo 100ms, idealmente 500-1000ms para comandos críticos
    
    return true;
}
```

### 7.2 Mejorar Gestión de Reconexión

```javascript
// Propuesta para NobleDevice.connect
async connect(timeout: number = 10): Promise<boolean> {
    if (this.connecting) {
        // Ya hay una conexión en progreso
        await this.waitForConnection(timeout);
        return this.connected;
    }
    
    this.connecting = true;
    
    try {
        // Limpiar estado previo
        if (this.connected) {
            await this.disconnect();
            await sleep(500);  // Dar tiempo al periférico
        }
        
        // Intentar conexión
        await this.peripheral.connectAsync();
        this.connected = true;
        return true;
    } catch (error) {
        this.connected = false;
        // NO llamar cancelConnect() - solo limpiar estado local
        return false;
    } finally {
        this.connecting = false;
    }
}
```

### 7.3 Añadir Timeout Absoluto en Espera de Respuesta

```javascript
async sendCommand(command, waitForResponse = true, timeout = 10000): Promise<CommandEnvelope | void> {
    // ...
    const startTime = Date.now();
    while (this.responses.length == 0 && this.connected) {
        if (Date.now() - startTime > timeout) {
            throw new Error("Command timeout");
        }
        await sleep(50);  // Aumentar de 5ms a 50ms
    }
    // ...
}
```

### 7.4 Serialización de Operaciones

```javascript
// Ya implementado parcialmente en manager.js
const lockOperations = new Map();

async function waitForPendingOperation(lockAddress, maxWait = 30000) {
    const startTime = Date.now();
    while (lockOperations.has(lockAddress)) {
        if (Date.now() - startTime > maxWait) {
            throw new Error(`Timeout waiting for pending operation on ${lockAddress}`);
        }
        await sleep(500);
    }
    lockOperations.set(lockAddress, Date.now());
}
```

### 7.5 Delay Post-Conexión

```javascript
// Añadir después de conexión exitosa
async onConnected() {
    await this.readBasicInfo();
    await this.subscribe();
    
    // AÑADIR: Delay para estabilizar conexión
    await sleep(500);
    
    this.connected = true;
    this.emit("connected");
}
```

---

## 8. Flujo Recomendado para Unlock

```
1. Verificar que no hay operaciones pendientes
2. Marcar lock como "en operación"
3. CONNECT (con timeout 10s, reintentos 3)
4. DELAY 500ms post-conexión
5. Discover services
6. Subscribe to notifications on fff4
7. DELAY 100ms para estabilizar
8. COMM_CHECK_USER_TIME → obtener psFromLock
9. DELAY 50ms
10. COMM_UNLOCK (psFromLock + unlockKey)
11. ESPERAR respuesta (timeout 10s)
12. DELAY 500ms post-comando (como Android SDK)
13. DISCONNECT
14. DELAY 500ms post-desconexión
15. Liberar lock de "en operación"
```

---

## 9. Próximos Pasos

1. **Implementar delays** según especificación del SDK Android
2. **Mejorar gestión de errores** para reconexión automática
3. **Añadir logging detallado** para diagnosticar problemas
4. **Probar con diferentes modelos** de cerraduras TTLock
5. **Documentar timeouts específicos** por tipo de comando

---

## 10. Referencias

- [ttlock-sdk-js](https://github.com/kind3r/ttlock-sdk-js)
- [esp32-ble-gateway](https://github.com/kind3r/esp32-ble-gateway)
- [SDK-Analysis.md](https://github.com/kind3r/ttlock-sdk-js/blob/main/docs/SDK-Analysis.md)
- [Bad CRC quest.md](https://github.com/kind3r/ttlock-sdk-js/blob/main/docs/Bad%20CRC%20quest.md)
- [Issue #11](https://github.com/kind3r/ttlock-sdk-js/issues/11)
- [Issue #20](https://github.com/kind3r/ttlock-sdk-js/issues/20)
