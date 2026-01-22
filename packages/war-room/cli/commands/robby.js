"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.robbyCommand = robbyCommand;
// packages/war-room/cli/commands/robby.ts
const src_1 = require("../../src");
async function robbyCommand(action, ...args) {
    switch (action) {
        case 'status':
            await robbyStatus();
            break;
        case 'downgrade':
            const downgradeLevel = parseInt(args[0]);
            const downgradeReason = args.slice(1).join(' ') || 'Manual downgrade';
            await robbyDowngrade(downgradeLevel, downgradeReason);
            break;
        case 'upgrade':
            const upgradeLevel = parseInt(args[0]);
            const upgradeReason = args.slice(1).join(' ') || 'Manual upgrade';
            await robbyUpgrade(upgradeLevel, upgradeReason);
            break;
        case 'kill':
            const killReason = args.join(' ') || 'Manual kill';
            await robbyKill(killReason);
            break;
        default:
            console.log('Usage: robby <status|downgrade|upgrade|kill> [args...]');
            console.log('\nExamples:');
            console.log('  robby status');
            console.log('  robby downgrade 1 "High error rate detected"');
            console.log('  robby upgrade 3 "System stable"');
            console.log('  robby kill "Emergency stop"');
    }
}
async function robbyStatus() {
    const health = await src_1.warRoom.robby.getHealth();
    console.log('🤖 Robby PA Status\n');
    console.log(`Status: ${health.status.toUpperCase()}`);
    console.log(`Autonomy level: ${health.autonomy_level}`);
    console.log(`Blocked actions (24h): ${health.blocked_actions_24h}`);
    console.log(`Human interrupts (24h): ${health.human_interrupts_24h}`);
    console.log(`Confidence delta: ${health.confidence_delta.toFixed(3)}`);
    console.log(`In scope: ${health.in_scope ? '✅' : '❌'}`);
}
async function robbyDowngrade(level, reason) {
    const current = src_1.warRoom.robby.getAutonomyLevel();
    console.log(`🔽 Downgrading Robby from level ${current} to ${level}...`);
    console.log(`Reason: ${reason}\n`);
    await src_1.warRoom.robby.downgrade(level, reason);
    console.log('✅ Autonomy level downgraded');
}
async function robbyUpgrade(level, reason) {
    const current = src_1.warRoom.robby.getAutonomyLevel();
    console.log(`🔼 Upgrading Robby from level ${current} to ${level}...`);
    console.log(`Reason: ${reason}\n`);
    await src_1.warRoom.robby.upgrade(level, reason);
    console.log('✅ Autonomy level upgraded');
}
async function robbyKill(reason) {
    console.log('🚨 KILLING ROBBY PA...');
    console.log(`Reason: ${reason}\n`);
    await src_1.warRoom.robby.kill(reason);
    console.log('✅ Robby PA killed (autonomy level set to 0)');
}
//# sourceMappingURL=robby.js.map