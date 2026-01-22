"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regressCommand = regressCommand;
// packages/war-room/cli/commands/regress.ts
const src_1 = require("../../src");
async function regressCommand(profile) {
    if (profile) {
        console.log(`🧪 Running regression for profile: ${profile}...\n`);
        const result = await src_1.warRoom.regression.run(profile);
        console.log(`Result: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Duration: ${result.duration_ms}ms`);
        console.log(`Diffs: ${result.diffs.length}`);
        if (result.diffs.length > 0) {
            console.log('\nDifferences:');
            for (const diff of result.diffs) {
                console.log(`  ${diff.severity.toUpperCase()}: ${diff.path} (${diff.type})`);
            }
        }
        console.log(`\nReceipt ID: ${result.receipt_id}`);
    }
    else {
        console.log('🧪 Running all regression tests...\n');
        const results = await src_1.warRoom.regression.runAll();
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        console.log(`\nResults:`);
        console.log(`  Total: ${results.length}`);
        console.log(`  Passed: ${passed}`);
        console.log(`  Failed: ${failed}`);
        if (failed > 0) {
            console.log('\nFailed profiles:');
            for (const result of results.filter(r => !r.passed)) {
                console.log(`  ❌ ${result.profile} (${result.diffs.length} diffs)`);
            }
        }
    }
}
//# sourceMappingURL=regress.js.map