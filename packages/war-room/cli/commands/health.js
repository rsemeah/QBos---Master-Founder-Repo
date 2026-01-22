"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCommand = healthCommand;
// packages/war-room/cli/commands/health.ts
const src_1 = require("../../src");
async function healthCommand() {
    console.log('🏥 Running health check...\n');
    const health = await src_1.warRoom.health.getStatus();
    console.log(`Overall: ${health.overall.toUpperCase()}`);
    console.log(`\nDetailed Report:`);
    console.log(JSON.stringify(health, null, 2));
}
//# sourceMappingURL=health.js.map