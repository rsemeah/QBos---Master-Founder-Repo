"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = statusCommand;
// packages/war-room/cli/commands/status.ts
const src_1 = require("../../src");
async function statusCommand() {
    console.log('🏛️  War Room Status\n');
    const status = await src_1.warRoom.status();
    // Freeze status
    if (status.frozen) {
        const freezeState = src_1.warRoom.controls.getFreezeState();
        console.log('⛔ SYSTEM FROZEN');
        console.log(`   Reason: ${freezeState?.reason}`);
        console.log(`   Frozen by: ${freezeState?.frozen_by}`);
        console.log(`   Frozen at: ${freezeState?.frozen_at}\n`);
    }
    else {
        console.log('✅ System operational\n');
    }
    // Overall health
    const overallIcon = getStatusIcon(status.health.overall);
    console.log(`${overallIcon} Overall Health: ${status.health.overall.toUpperCase()}\n`);
    // Constitutional health
    console.log('📜 Constitutional:');
    console.log(`   ${getStatusIcon(status.health.constitutional.status)} Status: ${status.health.constitutional.status}`);
    console.log(`   Receipts/hour: ${status.health.constitutional.receipts_per_hour.toFixed(2)}`);
    console.log(`   Unverified attempts: ${status.health.constitutional.unverified_attempts}`);
    console.log(`   Drift score: ${status.health.constitutional.drift_score.toFixed(3)}\n`);
    // Engines
    console.log('⚙️  Engines:');
    for (const engine of status.health.engines) {
        console.log(`   ${getStatusIcon(engine.status)} ${engine.engine}`);
        if (engine.degraded) {
            console.log(`      Reason: ${engine.reason}`);
        }
    }
    console.log();
    // Robby
    console.log('🤖 Robby PA:');
    console.log(`   ${getStatusIcon(status.robby.status)} Status: ${status.robby.status}`);
    console.log(`   Autonomy level: ${status.robby.autonomy_level}`);
    console.log(`   Blocked actions (24h): ${status.robby.blocked_actions_24h}`);
    console.log(`   Human interrupts (24h): ${status.robby.human_interrupts_24h}`);
    console.log(`   In scope: ${status.robby.in_scope ? '✅' : '❌'}\n`);
    // Cost
    console.log('💰 Cost:');
    console.log(`   ${getStatusIcon(status.cost.status)} Status: ${status.cost.status}`);
    console.log(`   Current rate: $${status.cost.current_spend_rate.toFixed(2)}/hour`);
    console.log(`   Projected monthly: $${status.cost.projected_monthly.toFixed(2)}`);
    console.log(`   Budget remaining: $${status.cost.budget_remaining.toFixed(2)}`);
    console.log(`   At risk: ${status.cost.at_risk ? '⚠️  YES' : '✅ No'}\n`);
    console.log(`Last updated: ${status.health.timestamp}`);
}
function getStatusIcon(severity) {
    switch (severity) {
        case 'green': return '🟢';
        case 'yellow': return '🟡';
        case 'red': return '🔴';
        case 'critical': return '🚨';
        default: return '⚪';
    }
}
//# sourceMappingURL=status.js.map