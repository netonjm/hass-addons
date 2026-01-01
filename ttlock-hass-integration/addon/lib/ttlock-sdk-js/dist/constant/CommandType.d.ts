export declare enum CommandType {
    COMM_UNSET = -1,
    COMM_INITIALIZATION = 69,
    COMM_GET_AES_KEY = 25,
    COMM_RESPONSE = 84,
    /**
     * Add management
     */
    COMM_ADD_ADMIN = 86,
    /**
     * Check the administrator
     */
    COMM_CHECK_ADMIN = 65,
    /**
     * Administrator keyboard password
     */
    COMM_SET_ADMIN_KEYBOARD_PWD = 83,
    /**
     * Delete password
     */
    COMM_SET_DELETE_PWD = 68,
    /**
     * Set the lock name
     */
    COMM_SET_LOCK_NAME = 78,
    /**
     * Sync keyboard password
     */
    COMM_SYN_KEYBOARD_PWD = 73,
    /**
     * Verify user time
     */
    COMM_CHECK_USER_TIME = 85,
    /**
     * Get the parking lock alarm record (the parking lock is moved)
     * To determine the completion of operations such as adding and password
     */
    COMM_GET_ALARM_ERRCORD_OR_OPERATION_FINISHED = 87,
    /**
     * Open the door
     */
    COMM_UNLOCK = 71,
    /**
     * close the door
     */
    COMM_LOCK = 76,
    /**
     * Calibration time
     */
    COMM_TIME_CALIBRATE = 67,
    /**
     * Manage keyboard password
     */
    COMM_MANAGE_KEYBOARD_PASSWORD = 3,
    /**
     * Get a valid keyboard password in the lock
     */
    COMM_GET_VALID_KEYBOARD_PASSWORD = 4,
    /**
     * Get operation records
     */
    COMM_GET_OPERATE_LOG = 37,
    /**
     * Random number verification
     */
    COMM_CHECK_RANDOM = 48,
    /**
     * Three generations
     * Password initialization
     */
    COMM_INIT_PASSWORDS = 49,
    /**
     * Read password parameters
     */
    COMM_READ_PWD_PARA = 50,
    /**
     * Modify the number of valid keyboard passwords
     */
    COMM_RESET_KEYBOARD_PWD_COUNT = 51,
    /**
     * Read door lock time
     */
    COMM_GET_LOCK_TIME = 52,
    /**
     * Reset lock
     */
    COMM_RESET_LOCK = 82,
    /**
     * Query device characteristics
     */
    COMM_SEARCHE_DEVICE_FEATURE = 1,
    /**
     * IC card management
     */
    COMM_IC_MANAGE = 5,
    /**
     * Fingerprint management
     */
    COMM_FR_MANAGE = 6,
    /**
     * Get password list
     */
    COMM_PWD_LIST = 7,
    /**
     * Set the bracelet KEY
     */
    COMM_SET_WRIST_BAND_KEY = 53,
    /**
     * Automatic locking management (including door sensor)
     */
    COMM_AUTO_LOCK_MANAGE = 54,
    /**
     * Read device information
     */
    COMM_READ_DEVICE_INFO = 144,
    /**
     * Enter upgrade mode
     */
    COMM_ENTER_DFU_MODE = 2,
    /**
     * Query bicycle status (including door sensor)
     */
    COMM_SEARCH_BICYCLE_STATUS = 20,
    /**
     * Locked
     */
    COMM_FUNCTION_LOCK = 88,
    /**
     * The password is displayed on the screen
     */
    COMM_SHOW_PASSWORD = 89,
    /**
     * Control remote unlocking
     */
    COMM_CONTROL_REMOTE_UNLOCK = 55,
    COMM_AUDIO_MANAGE = 98,
    COMM_REMOTE_CONTROL_DEVICE_MANAGE = 99,
    /**
     * For NB networked door locks, through this command, App tells the address information of the door lock server
     */
    COMM_CONFIGURE_NB_ADDRESS = 18,
    /**
     * Hotel lock parameter configuration
     */
    COMM_CONFIGURE_HOTEL_DATA = 100,
    /**
     * Read the administrator password
     */
    COMM_GET_ADMIN_CODE = 101,
    /**
     * Normally open mode management
     */
    COMM_CONFIGURE_PASSAGE_MODE = 102,
    /**
     * Switch control instructions (privacy lock, tamper-proof alarm, reset lock)
     */
    COMM_SWITCH = 104,
    COMM_FREEZE_LOCK = 97,
    COMM_LAMP = 103,
    /**
     * Deadlock instruction
     */
    COMM_DEAD_LOCK = 105,
    /**
     * Cycle instructions
     */
    COMM_CYCLIC_CMD = 112,
    /**
     * Get accessory battery
     */
    COMM_ACCESSORY_BATTERY = 116,
    COMM_NB_ACTIVATE_CONFIGURATION = 19
}
