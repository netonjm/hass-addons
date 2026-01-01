'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.APICommand = void 0;
var APICommand;
(function (APICommand) {
    APICommand[APICommand["OP_GET_LOCK_VERSION"] = 1] = "OP_GET_LOCK_VERSION";
    APICommand[APICommand["OP_ADD_ADMIN"] = 2] = "OP_ADD_ADMIN";
    APICommand[APICommand["OP_UNLOCK_ADMIN"] = 3] = "OP_UNLOCK_ADMIN";
    APICommand[APICommand["OP_UNLOCK_EKEY"] = 4] = "OP_UNLOCK_EKEY";
    APICommand[APICommand["OP_SET_KEYBOARD_PASSWORD"] = 5] = "OP_SET_KEYBOARD_PASSWORD";
    APICommand[APICommand["OP_CALIBRATE_TIME"] = 6] = "OP_CALIBRATE_TIME";
    APICommand[APICommand["OP_SET_NORMAL_USER_PASSWORD"] = 7] = "OP_SET_NORMAL_USER_PASSWORD";
    APICommand[APICommand["OP_READ_NORMAL_USER_PASSWORD"] = 8] = "OP_READ_NORMAL_USER_PASSWORD";
    APICommand[APICommand["OP_CLEAR_NORMAL_USER_PASSWORD"] = 9] = "OP_CLEAR_NORMAL_USER_PASSWORD";
    APICommand[APICommand["OP_REMOVE_SINGLE_NORMAL_USER_PASSWORD"] = 10] = "OP_REMOVE_SINGLE_NORMAL_USER_PASSWORD";
    APICommand[APICommand["OP_RESET_KEYBOARD_PASSWORD"] = 11] = "OP_RESET_KEYBOARD_PASSWORD";
    APICommand[APICommand["OP_SET_DELETE_PASSWORD"] = 12] = "OP_SET_DELETE_PASSWORD";
    APICommand[APICommand["OP_LOCK_ADMIN"] = 13] = "OP_LOCK_ADMIN";
    APICommand[APICommand["OP_LOCK_EKEY"] = 14] = "OP_LOCK_EKEY";
    APICommand[APICommand["OP_RESET_EKEY"] = 15] = "OP_RESET_EKEY";
    /**
     * Initialization password
     */
    APICommand[APICommand["OP_INIT_PWD"] = 16] = "OP_INIT_PWD";
    //Set the lock name
    APICommand[APICommand["OP_SET_LOCK_NAME"] = 17] = "OP_SET_LOCK_NAME";
    //Read door lock time
    APICommand[APICommand["OP_GET_LOCK_TIME"] = 18] = "OP_GET_LOCK_TIME";
    //reset
    APICommand[APICommand["OP_RESET_LOCK"] = 19] = "OP_RESET_LOCK";
    /**
     * Add a one-time password, start time and end time are required
     */
    APICommand[APICommand["OP_ADD_ONCE_KEYBOARD_PASSWORD"] = 20] = "OP_ADD_ONCE_KEYBOARD_PASSWORD";
    /**
     * Add permanent keyboard password, need start time
     */
    APICommand[APICommand["OP_ADD_PERMANENT_KEYBOARD_PASSWORD"] = 21] = "OP_ADD_PERMANENT_KEYBOARD_PASSWORD";
    /**
     * Add period password
     */
    APICommand[APICommand["OP_ADD_PERIOD_KEYBOARD_PASSWORD"] = 22] = "OP_ADD_PERIOD_KEYBOARD_PASSWORD";
    /**
     * change Password
     */
    APICommand[APICommand["OP_MODIFY_KEYBOARD_PASSWORD"] = 23] = "OP_MODIFY_KEYBOARD_PASSWORD";
    /**
     * Delete a single password
     */
    APICommand[APICommand["OP_REMOVE_ONE_PASSWORD"] = 24] = "OP_REMOVE_ONE_PASSWORD";
    /**
     * Delete all passwords in the lock
     */
    APICommand[APICommand["OP_REMOVE_ALL_KEYBOARD_PASSWORD"] = 25] = "OP_REMOVE_ALL_KEYBOARD_PASSWORD";
    /**
     * Get operation log
     */
    APICommand[APICommand["OP_GET_OPERATE_LOG"] = 26] = "OP_GET_OPERATE_LOG";
    /**
     * Query device characteristics
     */
    APICommand[APICommand["OP_SEARCH_DEVICE_FEATURE"] = 27] = "OP_SEARCH_DEVICE_FEATURE";
    /**
     * Query IC card number
     */
    APICommand[APICommand["OP_SEARCH_IC_CARD_NO"] = 28] = "OP_SEARCH_IC_CARD_NO";
    /**
     * Add IC card
     */
    APICommand[APICommand["OP_ADD_IC"] = 29] = "OP_ADD_IC";
    /**
     * Modify the validity period of the IC card
     */
    APICommand[APICommand["OP_MODIFY_IC_PERIOD"] = 30] = "OP_MODIFY_IC_PERIOD";
    /**
     * Delete IC card
     */
    APICommand[APICommand["OP_DELETE_IC"] = 31] = "OP_DELETE_IC";
    /**
     * Clear IC card
     */
    APICommand[APICommand["OP_CLEAR_IC"] = 32] = "OP_CLEAR_IC";
    /**
     * Set the bracelet KEY
     */
    APICommand[APICommand["OP_SET_WRIST_KEY"] = 33] = "OP_SET_WRIST_KEY";
    /**
     * Add fingerprint
     */
    APICommand[APICommand["OP_ADD_FR"] = 34] = "OP_ADD_FR";
    /**
     * Modify fingerprint validity period
     */
    APICommand[APICommand["OP_MODIFY_FR_PERIOD"] = 35] = "OP_MODIFY_FR_PERIOD";
    /**
     * Delete fingerprint
     */
    APICommand[APICommand["OP_DELETE_FR"] = 36] = "OP_DELETE_FR";
    /**
     * Clear fingerprint
     */
    APICommand[APICommand["OP_CLEAR_FR"] = 37] = "OP_CLEAR_FR";
    /**
     * Query the shortest and longest lockout time
     */
    APICommand[APICommand["OP_SEARCH_AUTO_LOCK_PERIOD"] = 38] = "OP_SEARCH_AUTO_LOCK_PERIOD";
    /**
     * Set the blocking time
     */
    APICommand[APICommand["OP_SET_AUTO_LOCK_TIME"] = 39] = "OP_SET_AUTO_LOCK_TIME";
    /**
     * Enter upgrade mode
     */
    APICommand[APICommand["OP_ENTER_DFU_MODE"] = 40] = "OP_ENTER_DFU_MODE";
    /**
     * Delete passwords in batch
     */
    APICommand[APICommand["OP_BATCH_DELETE_PASSWORD"] = 41] = "OP_BATCH_DELETE_PASSWORD";
    /**
     * Locking function
     */
    APICommand[APICommand["OP_LOCK"] = 42] = "OP_LOCK";
    /**
     * Show hidden password
     */
    APICommand[APICommand["OP_SHOW_PASSWORD_ON_SCREEN"] = 43] = "OP_SHOW_PASSWORD_ON_SCREEN";
    /**
     * Data recovery
     */
    APICommand[APICommand["OP_RECOVERY_DATA"] = 44] = "OP_RECOVERY_DATA";
    /**
     * Read password parameters
     */
    APICommand[APICommand["OP_READ_PWD_PARA"] = 45] = "OP_READ_PWD_PARA";
    /**
     * Query fingerprint list
     */
    APICommand[APICommand["OP_SEARCH_FR"] = 46] = "OP_SEARCH_FR";
    /**
     * Query password list
     */
    APICommand[APICommand["OP_SEARCH_PWD"] = 47] = "OP_SEARCH_PWD";
    /**
     * Control remote unlock switch
     */
    APICommand[APICommand["OP_CONTROL_REMOTE_UNLOCK"] = 48] = "OP_CONTROL_REMOTE_UNLOCK";
    /**
     * Get battery
     */
    APICommand[APICommand["OP_GET_POW"] = 49] = "OP_GET_POW";
    APICommand[APICommand["OP_AUDIO_MANAGEMENT"] = 50] = "OP_AUDIO_MANAGEMENT";
    APICommand[APICommand["OP_REMOTE_CONTROL_DEVICE_MANAGEMENT"] = 51] = "OP_REMOTE_CONTROL_DEVICE_MANAGEMENT";
    /**
     * Door sensor operation
     */
    APICommand[APICommand["OP_DOOR_SENSOR"] = 52] = "OP_DOOR_SENSOR";
    /**
     * Detection door sensor
     */
    APICommand[APICommand["OP_DETECT_DOOR_SENSOR"] = 53] = "OP_DETECT_DOOR_SENSOR";
    /**
     * Get lock switch status
     */
    APICommand[APICommand["OP_GET_LOCK_SWITCH_STATE"] = 54] = "OP_GET_LOCK_SWITCH_STATE";
    /**
     * Read device information
     */
    APICommand[APICommand["OP_GET_DEVICE_INFO"] = 55] = "OP_GET_DEVICE_INFO";
    /**
     * Configure NB lock server address
     */
    APICommand[APICommand["OP_CONFIGURE_NB_SERVER_ADDRESS"] = 56] = "OP_CONFIGURE_NB_SERVER_ADDRESS";
    APICommand[APICommand["OP_GET_ADMIN_KEYBOARD_PASSWORD"] = 57] = "OP_GET_ADMIN_KEYBOARD_PASSWORD";
    APICommand[APICommand["OP_WRITE_FR"] = 58] = "OP_WRITE_FR";
    APICommand[APICommand["OP_QUERY_PASSAGE_MODE"] = 59] = "OP_QUERY_PASSAGE_MODE";
    APICommand[APICommand["OP_ADD_OR_MODIFY_PASSAGE_MODE"] = 60] = "OP_ADD_OR_MODIFY_PASSAGE_MODE";
    APICommand[APICommand["OP_DELETE_PASSAGE_MODE"] = 61] = "OP_DELETE_PASSAGE_MODE";
    APICommand[APICommand["OP_CLEAR_PASSAGE_MODE"] = 62] = "OP_CLEAR_PASSAGE_MODE";
    APICommand[APICommand["OP_FREEZE_LOCK"] = 63] = "OP_FREEZE_LOCK";
    APICommand[APICommand["OP_LOCK_LAMP"] = 64] = "OP_LOCK_LAMP";
    APICommand[APICommand["OP_SET_HOTEL_DATA"] = 65] = "OP_SET_HOTEL_DATA";
    APICommand[APICommand["OP_SET_SWITCH"] = 66] = "OP_SET_SWITCH";
    APICommand[APICommand["OP_GET_SWITCH"] = 67] = "OP_GET_SWITCH";
    APICommand[APICommand["OP_SET_HOTEL_CARD_SECTION"] = 68] = "OP_SET_HOTEL_CARD_SECTION";
    APICommand[APICommand["OP_DEAD_LOCK"] = 69] = "OP_DEAD_LOCK";
    APICommand[APICommand["OP_SET_ELEVATOR_CONTROL_FLOORS"] = 70] = "OP_SET_ELEVATOR_CONTROL_FLOORS";
    APICommand[APICommand["OP_SET_ELEVATOR_WORK_MODE"] = 71] = "OP_SET_ELEVATOR_WORK_MODE";
    APICommand[APICommand["OP_SET_NB_ACTIVATE_CONFIG"] = 72] = "OP_SET_NB_ACTIVATE_CONFIG";
    APICommand[APICommand["OP_GET_NB_ACTIVATE_CONFIG"] = 73] = "OP_GET_NB_ACTIVATE_CONFIG";
    APICommand[APICommand["OP_SET_NB_ACTIVATE_MODE"] = 74] = "OP_SET_NB_ACTIVATE_MODE";
    APICommand[APICommand["OP_GET_NB_ACTIVATE_MODE"] = 75] = "OP_GET_NB_ACTIVATE_MODE";
})(APICommand = exports.APICommand || (exports.APICommand = {}));
