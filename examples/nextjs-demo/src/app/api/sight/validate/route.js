"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const nextjs_adapter_1 = require("@qbos/nextjs-adapter");
exports.POST = (0, nextjs_adapter_1.createSightEngineValidateRoute)({
    requireAuth: false, // Set to true in production
    onValidation: async (result) => {
        console.log('✅ Validation complete:', {
            passed: result.passed,
            score: result.score,
            issues: result.issues.length,
        });
    },
});
//# sourceMappingURL=route.js.map