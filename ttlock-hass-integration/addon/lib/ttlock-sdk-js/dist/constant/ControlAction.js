'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlAction = void 0;
var ControlAction;
(function (ControlAction) {
    ControlAction[ControlAction["UNLOCK"] = 3] = "UNLOCK";
    ControlAction[ControlAction["LOCK"] = 6] = "LOCK";
    /**
     * Volume gate
     */
    ControlAction[ControlAction["ROLLING_GATE_UP"] = 1] = "ROLLING_GATE_UP";
    ControlAction[ControlAction["ROLLING_GATE_DOWN"] = 2] = "ROLLING_GATE_DOWN";
    ControlAction[ControlAction["ROLLING_GATE_PAUSE"] = 4] = "ROLLING_GATE_PAUSE";
    ControlAction[ControlAction["ROLLING_GATE_LOCK"] = 8] = "ROLLING_GATE_LOCK";
    /**
     *
     */
    ControlAction[ControlAction["HOLD"] = 24] = "HOLD";
})(ControlAction = exports.ControlAction || (exports.ControlAction = {}));
