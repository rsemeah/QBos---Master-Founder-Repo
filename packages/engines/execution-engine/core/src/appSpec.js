"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAppSpec = validateAppSpec;
function validateAppSpec(spec) {
    const errors = [];
    if (!spec || typeof spec !== "object") {
        return { ok: false, errors: ["AppSpec must be an object."] };
    }
    const candidate = spec;
    if (!candidate.appName || typeof candidate.appName !== "string") {
        errors.push("appName is required.");
    }
    if (!candidate.archetype || typeof candidate.archetype !== "string") {
        errors.push("archetype is required.");
    }
    if (!Array.isArray(candidate.goals) || candidate.goals.length === 0) {
        errors.push("goals must contain at least one goal.");
    }
    return {
        ok: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=appSpec.js.map