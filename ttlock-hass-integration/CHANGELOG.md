# Changelog

## [0.5.3] - 2026-01-01
- **Fix BLE Connection**: Wait if connection already in progress instead of failing
- **Fix MQTT Reconnection**: Restore connected state and resubscribe after reconnection
- Prevent concurrent connection attempts causing errors

## [0.5.2] - 2026-01-01
- **Graceful Shutdown**: Handle SIGTERM/SIGINT for clean addon restart/update
- **Fix UI Lock Visibility**: Lock appears in UI even if initial connection fails
- Close BLE, MQTT, and HTTP connections properly on shutdown

## [0.5.1] - 2026-01-01
- **MQTT API**: New API topic (`ttlock/{id}/api`) for remote management of passcodes, cards, and fingerprints
  - Passcode operations: `getPasscodes`, `addPasscode`, `updatePasscode`, `deletePasscode`
  - IC Card operations: `getCards`, `addCard` (supports remote card registration with cardNumber), `deleteCard`
  - Fingerprint operations: `getFingerprints`, `deleteFingerprint`
  - Lock operations: `lock`, `unlock`, `getOperationLog`, `setAutoLock`
- **Remote Card Registration**: Add NFC/IC cards by card number without physical scan (cardNumber parameter)
- **API Responses**: Responses published to `ttlock/{id}/response` with requestId for correlation

## [0.5.0] - 2026-01-01
- **BLE Connection Management**: Auto disconnect after each operation to prevent connection leaks
- **State Verification**: Check lock state before lock/unlock to avoid redundant operations
- **Retry Logic**: Automatic retries with configurable backoff for BLE connections and operations
- **Error Handling**: New typed error system (TTLockError, ErrorCodes) for better debugging
- **Stability Fix**: Resolve issue where system hangs after multiple lock/unlock operations
- Add `executeWithConnection` helper for consistent connection handling across all operations

## [0.4.13] - 2021-05-06
- New build

## [0.4.11] - 2021-05-06
- Bump SDK in attempt at fixing connect limbo

## [0.4.0] - 2021-03-27
- Monitor advertisement packets to detect lock/unlock status updates (detects unlock events using pin, fingerprint or card)
- Discovery should be more reliable now
- View operation log
- Optimise communication with the lock
- Add lock unpair
- Fixes on settings save

## [0.3.2] - 2021-03-16
- Fix some bugs related to aliases when adding a new card or fingerprint

## [0.3.1] - 2021-03-08
- Add aliases (friendly names) to cards and fingerprints

## [0.3.0] - 2021-01-22
- New layout separating settings and credentials
- Manage lock sound

## [0.2.31] - 2021-01-21
- Bump SDK for fixing gateway disconnection issues

## [0.2.24] - 2021-01-20
- Bump SDK for switch feature fix and remote unlock error during pairing
- Stop scan after a new unpaired lock is found
- Option to debug gateway messages (`gateway_debug: true` in config)

## [0.2.21] - 2021-01-17
- Bump SDK for stability fixes

## [0.2.19] - 2021-01-16
- Auto-lock management

## [0.2.16] - 2021-01-16
- Basic config editing UI for saving/restoring lock pairing data
- Option for communication debug (`debug_communication: true` in config)

## [0.2.12] - 2021-01-16
- Persist device state between HA restarts
- Option for MQTT debug (`debug_mqtt: true` in config)

## [0.2.11] - 2021-01-15
- Filter credentials type availability based on lock features
- Force noble in websocket mode to avoid missing BLE adapter
- Unstable connection fixes from SDK
- Status updates to all clients
- Reduce scan interval
- Option to ignore CRC errors (`ignore_crc: true` in config)

## [0.2.7] - 2021-01-12
- Add support for BLE Gateway (not TTLock G2 gateway)

## [0.1.1] - 2021-01-08
- Possible fix for discovering unpaired locks
- Debug found locks

## [0.1.0] - 2021-01-05
Initial release