'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandType = void 0;
var CommandType;
(function (CommandType) {
    CommandType[CommandType["COMM_UNSET"] = -1] = "COMM_UNSET";
    CommandType[CommandType["COMM_INITIALIZATION"] = 69] = "COMM_INITIALIZATION";
    CommandType[CommandType["COMM_GET_AES_KEY"] = 25] = "COMM_GET_AES_KEY";
    CommandType[CommandType["COMM_RESPONSE"] = 84] = "COMM_RESPONSE";
    /**
     * Add management
     */
    CommandType[CommandType["COMM_ADD_ADMIN"] = 86] = "COMM_ADD_ADMIN";
    /**
     * Check the administrator
     */
    CommandType[CommandType["COMM_CHECK_ADMIN"] = 65] = "COMM_CHECK_ADMIN";
    /**
     * Administrator keyboard password
     */
    CommandType[CommandType["COMM_SET_ADMIN_KEYBOARD_PWD"] = 83] = "COMM_SET_ADMIN_KEYBOARD_PWD";
    /**
     * Delete password
     */
    CommandType[CommandType["COMM_SET_DELETE_PWD"] = 68] = "COMM_SET_DELETE_PWD";
    /**
     * Set the lock name
     */
    CommandType[CommandType["COMM_SET_LOCK_NAME"] = 78] = "COMM_SET_LOCK_NAME";
    /**
     * Sync keyboard password
     */
    CommandType[CommandType["COMM_SYN_KEYBOARD_PWD"] = 73] = "COMM_SYN_KEYBOARD_PWD";
    /**
     * Verify user time
     */
    CommandType[CommandType["COMM_CHECK_USER_TIME"] = 85] = "COMM_CHECK_USER_TIME";
    /**
     * Get the parking lock alarm record (the parking lock is moved)
     * To determine the completion of operations such as adding and password
     */
    CommandType[CommandType["COMM_GET_ALARM_ERRCORD_OR_OPERATION_FINISHED"] = 87] = "COMM_GET_ALARM_ERRCORD_OR_OPERATION_FINISHED";
    /**
     * Open the door
     */
    CommandType[CommandType["COMM_UNLOCK"] = 71] = "COMM_UNLOCK";
    /**
     * close the door
     */
    CommandType[CommandType["COMM_LOCK"] = 76] = "COMM_LOCK";
    /**
     * Calibration time
     */
    CommandType[CommandType["COMM_TIME_CALIBRATE"] = 67] = "COMM_TIME_CALIBRATE";
    /**
     * Manage keyboard password
     */
    CommandType[CommandType["COMM_MANAGE_KEYBOARD_PASSWORD"] = 3] = "COMM_MANAGE_KEYBOARD_PASSWORD";
    /**
     * Get a valid keyboard password in the lock
     */
    CommandType[CommandType["COMM_GET_VALID_KEYBOARD_PASSWORD"] = 4] = "COMM_GET_VALID_KEYBOARD_PASSWORD";
    /**
     * Get operation records
     */
    CommandType[CommandType["COMM_GET_OPERATE_LOG"] = 37] = "COMM_GET_OPERATE_LOG";
    /**
     * Random number verification
     */
    CommandType[CommandType["COMM_CHECK_RANDOM"] = 48] = "COMM_CHECK_RANDOM";
    /**
     * Three generations
     * Password initialization
     */
    CommandType[CommandType["COMM_INIT_PASSWORDS"] = 49] = "COMM_INIT_PASSWORDS";
    /**
     * Read password parameters
     */
    CommandType[CommandType["COMM_READ_PWD_PARA"] = 50] = "COMM_READ_PWD_PARA";
    /**
     * Modify the number of valid keyboard passwords
     */
    CommandType[CommandType["COMM_RESET_KEYBOARD_PWD_COUNT"] = 51] = "COMM_RESET_KEYBOARD_PWD_COUNT";
    /**
     * Read door lock time
     */
    CommandType[CommandType["COMM_GET_LOCK_TIME"] = 52] = "COMM_GET_LOCK_TIME";
    /**
     * Reset lock
     */
    CommandType[CommandType["COMM_RESET_LOCK"] = 82] = "COMM_RESET_LOCK";
    /**
     * Query device characteristics
     */
    CommandType[CommandType["COMM_SEARCHE_DEVICE_FEATURE"] = 1] = "COMM_SEARCHE_DEVICE_FEATURE";
    /**
     * IC card management
     */
    CommandType[CommandType["COMM_IC_MANAGE"] = 5] = "COMM_IC_MANAGE";
    /**
     * Fingerprint management
     */
    CommandType[CommandType["COMM_FR_MANAGE"] = 6] = "COMM_FR_MANAGE";
    /**
     * Get password list
     */
    CommandType[CommandType["COMM_PWD_LIST"] = 7] = "COMM_PWD_LIST";
    /**
     * Set the bracelet KEY
     */
    CommandType[CommandType["COMM_SET_WRIST_BAND_KEY"] = 53] = "COMM_SET_WRIST_BAND_KEY";
    /**
     * Automatic locking management (including door sensor)
     */
    CommandType[CommandType["COMM_AUTO_LOCK_MANAGE"] = 54] = "COMM_AUTO_LOCK_MANAGE";
    /**
     * Read device information
     */
    CommandType[CommandType["COMM_READ_DEVICE_INFO"] = 144] = "COMM_READ_DEVICE_INFO";
    /**
     * Enter upgrade mode
     */
    CommandType[CommandType["COMM_ENTER_DFU_MODE"] = 2] = "COMM_ENTER_DFU_MODE";
    /**
     * Query bicycle status (including door sensor)
     */
    CommandType[CommandType["COMM_SEARCH_BICYCLE_STATUS"] = 20] = "COMM_SEARCH_BICYCLE_STATUS";
    /**
     * Locked
     */
    CommandType[CommandType["COMM_FUNCTION_LOCK"] = 88] = "COMM_FUNCTION_LOCK";
    /**
     * The password is displayed on the screen
     */
    CommandType[CommandType["COMM_SHOW_PASSWORD"] = 89] = "COMM_SHOW_PASSWORD";
    /**
     * Control remote unlocking
     */
    CommandType[CommandType["COMM_CONTROL_REMOTE_UNLOCK"] = 55] = "COMM_CONTROL_REMOTE_UNLOCK";
    CommandType[CommandType["COMM_AUDIO_MANAGE"] = 98] = "COMM_AUDIO_MANAGE";
    CommandType[CommandType["COMM_REMOTE_CONTROL_DEVICE_MANAGE"] = 99] = "COMM_REMOTE_CONTROL_DEVICE_MANAGE";
    /**
     * For NB networked door locks, through this command, App tells the address information of the door lock server
     */
    CommandType[CommandType["COMM_CONFIGURE_NB_ADDRESS"] = 18] = "COMM_CONFIGURE_NB_ADDRESS";
    /**
     * Hotel lock parameter configuration
     */
    CommandType[CommandType["COMM_CONFIGURE_HOTEL_DATA"] = 100] = "COMM_CONFIGURE_HOTEL_DATA";
    /**
     * Read the administrator password
     */
    CommandType[CommandType["COMM_GET_ADMIN_CODE"] = 101] = "COMM_GET_ADMIN_CODE";
    /**
     * Normally open mode management
     */
    CommandType[CommandType["COMM_CONFIGURE_PASSAGE_MODE"] = 102] = "COMM_CONFIGURE_PASSAGE_MODE";
    /**
     * Switch control instructions (privacy lock, tamper-proof alarm, reset lock)
     */
    CommandType[CommandType["COMM_SWITCH"] = 104] = "COMM_SWITCH";
    CommandType[CommandType["COMM_FREEZE_LOCK"] = 97] = "COMM_FREEZE_LOCK";
    CommandType[CommandType["COMM_LAMP"] = 103] = "COMM_LAMP";
    /**
     * Deadlock instruction
     */
    CommandType[CommandType["COMM_DEAD_LOCK"] = 105] = "COMM_DEAD_LOCK";
    /**
     * Cycle instructions
     */
    CommandType[CommandType["COMM_CYCLIC_CMD"] = 112] = "COMM_CYCLIC_CMD";
    /**
     * Get accessory battery
     */
    CommandType[CommandType["COMM_ACCESSORY_BATTERY"] = 116] = "COMM_ACCESSORY_BATTERY";
    CommandType[CommandType["COMM_NB_ACTIVATE_CONFIGURATION"] = 19] = "COMM_NB_ACTIVATE_CONFIGURATION";
})(CommandType = exports.CommandType || (exports.CommandType = {}));
