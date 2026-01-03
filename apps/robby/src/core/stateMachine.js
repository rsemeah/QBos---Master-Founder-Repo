"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_TRANSITIONS = exports.VerdictState = exports.ExecutionState = exports.IntentState = exports.RobbyPhase = void 0;
exports.isValidTransition = isValidTransition;
var RobbyPhase;
(function (RobbyPhase) {
    RobbyPhase["INTENT"] = "INTENT";
    RobbyPhase["EXECUTION"] = "EXECUTION";
    RobbyPhase["VERDICT"] = "VERDICT";
})(RobbyPhase || (exports.RobbyPhase = RobbyPhase = {}));
var IntentState;
(function (IntentState) {
    IntentState["COLLECTING"] = "collecting";
    IntentState["REFINING"] = "refining";
    IntentState["CONFIRMING"] = "confirming";
    IntentState["LOCKED"] = "locked";
})(IntentState || (exports.IntentState = IntentState = {}));
var ExecutionState;
(function (ExecutionState) {
    ExecutionState["QUEUED"] = "queued";
    ExecutionState["RUNNING"] = "running";
    ExecutionState["BLOCKED"] = "blocked";
    ExecutionState["COMPLETED"] = "completed";
})(ExecutionState || (exports.ExecutionState = ExecutionState = {}));
var VerdictState;
(function (VerdictState) {
    VerdictState["ANALYZING"] = "analyzing";
    VerdictState["READY"] = "ready";
    VerdictState["ACCEPTED"] = "accepted";
    VerdictState["REJECTED"] = "rejected";
})(VerdictState || (exports.VerdictState = VerdictState = {}));
exports.VALID_TRANSITIONS = {
    'INTENT.collecting → INTENT.refining': true,
    'INTENT.refining → INTENT.confirming': true,
    'INTENT.confirming → INTENT.locked': true,
    'INTENT.locked → EXECUTION.queued': true,
    'EXECUTION.queued → EXECUTION.running': true,
    'EXECUTION.running → EXECUTION.blocked': true,
    'EXECUTION.running → EXECUTION.completed': true,
    'EXECUTION.blocked → VERDICT.analyzing': true,
    'EXECUTION.completed → VERDICT.analyzing': true,
    'VERDICT.analyzing → VERDICT.ready': true,
    'VERDICT.ready → VERDICT.accepted': true,
    'VERDICT.ready → VERDICT.rejected': true,
    'VERDICT.rejected → INTENT.collecting': true,
    'EXECUTION.blocked → INTENT.collecting': true
};
function isValidTransition(fromPhase, fromState, toPhase, toState) {
    const key = `${fromPhase}.${fromState} → ${toPhase}.${toState}`;
    return !!exports.VALID_TRANSITIONS[key];
}
//# sourceMappingURL=stateMachine.js.map