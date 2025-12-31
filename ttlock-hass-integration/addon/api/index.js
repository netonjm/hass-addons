'use strict';

const { sleep } = require('ttlock-sdk-js');
const WebSocket = require('ws');
const manager = require("../src/manager");
const store = require('../src/store');
const { TTLockError, ErrorCodes } = require('../src/errors');
const Message = require("./Message");
const WsApi = require("./WsApi");

module.exports = async (server) => {
  const wss = new WebSocket.Server({
    server: server,
    path: "/api"
  });

  async function sendStatusUpdate() {
    WsApi.sendStatus(wss);
  }

  async function sendLockStatusUpdate(lock) {
    WsApi.sendLockStatus(wss, lock);
  }

  manager.on("lockListChanged", sendStatusUpdate);
  manager.on("lockPaired", sendStatusUpdate);
  manager.on("lockConnected", sendLockStatusUpdate);
  manager.on("lockLock", sendLockStatusUpdate);
  manager.on("lockUnlock", sendLockStatusUpdate);
  manager.on("lockUpdated", sendLockStatusUpdate);
  manager.on("scanStart", sendStatusUpdate);
  manager.on("scanStop", sendStatusUpdate);

  wss.on('connection', (ws) => {

    const api = new WsApi(ws);

    ws.on('message', async (message) => {
      const msg = new Message(message);
      if (msg.isValid()) {
        switch (msg.type) {

          case "status": // send status
            sendStatusUpdate();
            break;

          case "scan": // start scanning
            manager.startScan();
            break;

          case "pair": // pair a lock
            if (msg.data && msg.data.address) {
              try {
                await manager.initLock(msg.data.address);
              } catch (error) {
                const locks = manager.getNewVisible();
                const lock = locks.get(msg.data.address);
                if (lock) {
                  WsApi.sendLockStatus(wss, lock);
                }
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: error.message, code: ErrorCodes.UNKNOWN_ERROR }, msg);
              }
            }
            break;

          case "lock": // lock a lock
            if (msg.data && msg.data.address) {
              try {
                await manager.lockLock(msg.data.address);
              } catch (error) {
                const locks = manager.getPairedVisible();
                const lock = locks.get(msg.data.address);
                if (lock) {
                  WsApi.sendLockStatus(wss, lock);
                }
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: error.message, code: ErrorCodes.UNKNOWN_ERROR }, msg);
              }
            }
            break;

          case "unlock": // unlock a lock
            if (msg.data && msg.data.address) {
              try {
                await manager.unlockLock(msg.data.address);
              } catch (error) {
                const locks = manager.getPairedVisible();
                const lock = locks.get(msg.data.address);
                if (lock) {
                  WsApi.sendLockStatus(wss, lock);
                }
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: error.message, code: ErrorCodes.UNKNOWN_ERROR }, msg);
              }
            }
            break;

          case "credentials": // read all credentials from lock
            if (msg.data && msg.data.address) {
              if (process.env.DEV_MODE) {
                WsApi._devSendCredentials(ws);
                break;
              }

              try {
                const credentials = await manager.getCredentials(msg.data.address);
                api.sendCredentials(msg.data.address, credentials);
              } catch (error) {
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: "Failed fetching credentials", code: ErrorCodes.OPERATION_FAILED }, msg);
              }
            }
            break;

          case "passcode":
            if (msg.data && msg.data.address && msg.data.passcode) {
              if (process.env.DEV_MODE) {
                WsApi._devSendCredentials(ws);
                break;
              }

              const passcode = msg.data.passcode;
              try {
                if (passcode.passCode == -1) { // add
                  await manager.addPasscode(msg.data.address, passcode.type, passcode.newPassCode, passcode.startDate, passcode.endDate);
                } else if (passcode.newPassCode == -1) { // delete
                  await manager.deletePasscode(msg.data.address, passcode.type, passcode.passCode);
                } else { // update
                  await manager.updatePasscode(msg.data.address, passcode.type, passcode.passCode, passcode.newPassCode, passcode.startDate, passcode.endDate);
                }
                // send updated passcode list
                const passcodes = await manager.getPasscodes(msg.data.address);
                api.sendPasscodes(msg.data.address, passcodes);
              } catch (error) {
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: "PIN operation failed", code: ErrorCodes.PASSCODE_FAILED }, msg);
              }
            }
            break;

          case "card":
            if (msg.data && msg.data.address && msg.data.card) {
              if (process.env.DEV_MODE) {
                WsApi._devSendCredentials(ws);
                break;
              }

              const card = msg.data.card;
              try {
                if (card.cardNumber == -1) { // add new card
                  await manager.addCard(msg.data.address, card.startDate, card.endDate, card.alias);
                } else if (card.startDate == -1) { // delete
                  await manager.deleteCard(msg.data.address, card.cardNumber);
                } else { // update
                  await manager.updateCard(msg.data.address, card.cardNumber, card.startDate, card.endDate, card.alias);
                }
                // send updated cards list
                const cards = await manager.getCards(msg.data.address);
                api.sendCards(msg.data.address, cards);
              } catch (error) {
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: "Card operation failed", code: ErrorCodes.CARD_FAILED }, msg);
              }
            }
            break;

          case "finger":
            if (msg.data && msg.data.address && msg.data.finger) {
              if (process.env.DEV_MODE) {
                WsApi._devSendCredentials(ws);
                break;
              }

              const finger = msg.data.finger;
              try {
                if (finger.fpNumber == -1) { // add new finger
                  await manager.addFinger(msg.data.address, finger.startDate, finger.endDate, finger.alias);
                } else if (finger.startDate == -1) { // delete
                  await manager.deleteFinger(msg.data.address, finger.fpNumber);
                } else { // update
                  await manager.updateFinger(msg.data.address, finger.fpNumber, finger.startDate, finger.endDate, finger.alias);
                }
                // send updated fingerprints list
                const fingers = await manager.getFingers(msg.data.address);
                api.sendFingers(msg.data.address, fingers);
              } catch (error) {
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: "Fingerprint operation failed", code: ErrorCodes.FINGERPRINT_FAILED }, msg);
              }
            }
            break;

          case "settings":
            if (msg.data && msg.data.address && msg.data.settings) {
              const settings = msg.data.settings;
              let confirmedSettings = {};

              try {
                if (typeof settings.autolock != "undefined") {
                  await manager.setAutoLock(msg.data.address, parseInt(settings.autolock));
                  confirmedSettings.autolock = true;
                }

                if (typeof settings.audio != "undefined") {
                  await manager.setAudio(msg.data.address, settings.audio);
                  confirmedSettings.audio = true;
                }

                if (confirmedSettings.autolock || confirmedSettings.audio) {
                  // allow lock status update to be sent before sending configuration confirmation
                  await sleep(10);
                }

                api.sendSettingsConfirmation(msg.data.address, confirmedSettings);
              } catch (error) {
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: "Settings update failed", code: ErrorCodes.SETTINGS_FAILED }, msg);
              }
            }
            break;
            
          case "config":
            if (msg.data) {
              if (msg.data.get) {
                api.sendConfig();
              } else if (msg.data.set) {
                try {
                  const lockData = JSON.parse(msg.data.set);
                  store.setLockData(lockData);
                  manager.updateClientLockDataFromStore();
                  manager.startScan();
                  api.sendConfigConfirm();
                } catch (error) {
                  api.sendConfigConfirm("Failed to set config");
                }
              }
            }
            break;

          case "operations":
            if (msg.data && msg.data.address) {
              try {
                const operations = await manager.getOperationLog(msg.data.address);
                api.sendOperationLog(msg.data.address, operations);
              } catch (error) {
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: "Failed getting operation log", code: ErrorCodes.OPERATION_FAILED }, msg);
              }
            }
            break;

          case "unpair":
            if (msg.data && msg.data.address) {
              try {
                await manager.resetLock(msg.data.address);
                // list update will handle the update
              } catch (error) {
                api.sendError(error instanceof TTLockError ? error.toJSON() : { message: "Failed to unpair lock", code: ErrorCodes.OPERATION_FAILED }, msg);
              }
            }
        }
      }
    });

    async function sendLockCardScan(lock) {
      api.sendCardScan(lock.getAddress());
    }
  
    async function sendLockFingerScan(lock) {
      api.sendFingerScan(lock.getAddress());
    }
  
    async function sendLockFingerScanProgress(lock) {
      api.sendFingerScanProgress(lock.getAddress());
    }
    
    manager.on("lockCardScan", sendLockCardScan);
    manager.on("lockFingerScan", sendLockFingerScan);
    manager.on("lockFingerScanProgress", sendLockFingerScanProgress);
  
    ws.on("close", async () => {
      manager.off("lockCardScan", sendLockCardScan);
      manager.off("lockFingerScan", sendLockFingerScan);
      manager.off("lockFingerScanProgress", sendLockFingerScanProgress);
    });

    WsApi.sendStatus(wss);
  });
}