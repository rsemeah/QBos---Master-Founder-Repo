"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const nextjs_adapter_1 = require("@qbos/nextjs-adapter");
const silent_engine_1 = require("@/lib/silent-engine");
exports.POST = (0, nextjs_adapter_1.createSilentEngineRoute)({
    engine: silent_engine_1.silentEngine,
    requireAuth: false, // Set to true in production
    onSuccess: async (result) => {
        console.log('✅ Generation successful:', {
            provider: result.provider,
            model: result.model,
            cost: result.actualCost,
            latency: result.actualLatency,
        });
    },
    onError: async (error) => {
        console.error('❌ Generation failed:', error.message);
    },
});
//# sourceMappingURL=route.js.map