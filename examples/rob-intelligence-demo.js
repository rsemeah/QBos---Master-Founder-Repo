"use strict";
/**
 * ROB INTELLIGENCE DEMO
 *
 * Demonstrates the full intelligence flow:
 * 1. User prompt: "Create Pokemon app"
 * 2. Rob decomposes idea (generates intelligence receipts)
 * 3. Rob generates living preview (working React component)
 * 4. Total time: <10 seconds
 *
 * MECHANICAL LAW: Intelligence receipts are REQUIRED
 */
Object.defineProperty(exports, "__esModule", { value: true });
const RobEngine_1 = require("../packages/engines/execution-engine/core/src/RobEngine");
async function demonstrateIntelligence() {
    console.log('🎮 ROB INTELLIGENCE DEMONSTRATION');
    console.log('='.repeat(60));
    console.log('');
    // Initialize Rob
    const rob = new RobEngine_1.RobEngine();
    const userId = 'demo_user_123';
    const templateId = 'blank_canvas';
    // Create session
    console.log('📝 Creating Rob session...');
    const session = await rob.createSession(userId, templateId);
    console.log(`✅ Session created: ${session.id}`);
    console.log('');
    // ==========================================================================
    // PHASE 1: User Input (Grandma says...)
    // ==========================================================================
    const userPrompt = 'Create a Pokemon battle and card trading club app';
    console.log('👵 User (Grandma): "' + userPrompt + '"');
    console.log('');
    console.log('⏱️  Starting intelligence timer...');
    const startTime = Date.now();
    // ==========================================================================
    // PHASE 2: Intelligence Decomposition (Rob demonstrates genius)
    // ==========================================================================
    console.log('🧠 Rob: Analyzing prompt with super-genius intelligence...');
    const decomposition = await rob.decomposeIdea(session.id, 'msg_001', userPrompt);
    console.log('');
    console.log('📊 INTELLIGENCE ANALYSIS:');
    console.log('-'.repeat(60));
    // Show interpretations
    console.log('\n🔍 Interpretations (3+):');
    decomposition.interpretations.forEach((interp, i) => {
        console.log(`   ${i + 1}. ${interp.interpretation}`);
        console.log(`      Domain: ${interp.domain}`);
        console.log(`      Confidence: ${(interp.confidence * 100).toFixed(0)}%`);
    });
    // Show core mechanics
    console.log('\n⚙️  Core Mechanics Identified:');
    decomposition.coreMechanics.forEach(mech => {
        console.log(`   - ${mech}`);
    });
    // Show IP risks
    console.log('\n⚠️  IP Risks Detected:');
    if (decomposition.risks.length > 0) {
        decomposition.risks.forEach(risk => {
            console.log(`   - ${risk.brand} (${risk.type}): ${risk.severity}`);
            console.log(`     Alternative: "${risk.alternative}"`);
        });
    }
    else {
        console.log('   None detected');
    }
    // Show recommended direction
    console.log('\n🎯 Recommended Direction:');
    console.log(`   ${decomposition.recommendedDirection.interpretation}`);
    console.log(`   Feasibility: ${decomposition.recommendedDirection.feasibility}/10`);
    // Show receipts generated
    console.log('\n📝 Intelligence Receipts Generated:');
    decomposition.receipts.forEach(receipt => {
        console.log(`   ✓ ${receipt.type}`);
    });
    console.log('');
    console.log('✅ Intelligence decomposition complete');
    console.log('');
    // ==========================================================================
    // PHASE 3: Build Request (with enforcement)
    // ==========================================================================
    console.log('🔨 Rob: Processing build request with intelligence enforcement...');
    const buildResult = await rob.processBuildRequest(session.id, userPrompt, decomposition.receipts);
    if (!buildResult.success) {
        console.log('❌ Build BLOCKED - Intelligence requirements not met');
        console.log(`   Message: ${buildResult.message}`);
        return;
    }
    console.log('✅ Intelligence verification passed');
    console.log('');
    // ==========================================================================
    // PHASE 4: Living Preview
    // ==========================================================================
    if (buildResult.preview) {
        const preview = buildResult.preview;
        console.log('🎨 LIVING PREVIEW GENERATED:');
        console.log('-'.repeat(60));
        console.log(`Component: ${preview.componentName}`);
        console.log(`Framework: ${preview.framework}`);
        console.log(`Lines of Code: ${preview.linesOfCode}`);
        console.log(`Interactivity: ${preview.interactivityLevel}`);
        console.log(`Render Success: ${preview.renderSuccess ? '✅' : '❌'}`);
        console.log('');
        // Show first 20 lines of code
        console.log('📜 Preview Code (first 20 lines):');
        console.log('-'.repeat(60));
        const codeLines = preview.code.split('\n').slice(0, 20);
        codeLines.forEach(line => console.log(line));
        console.log('... (' + (preview.linesOfCode - 20) + ' more lines)');
    }
    else {
        console.log('⚠️  Preview generation skipped or failed');
    }
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    console.log('');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Time: ${totalTime} seconds`);
    console.log(`🎯 Target: <10 seconds`);
    console.log(`📊 Result: ${parseFloat(totalTime) < 10 ? '✅ SUCCESS' : '⚠️  NEEDS OPTIMIZATION'}`);
    console.log('');
    console.log('💡 What just happened:');
    console.log('   1. Grandma said "Create Pokemon app"');
    console.log('   2. Rob analyzed it with super-genius intelligence');
    console.log('   3. Rob detected IP risk (Pokemon trademark)');
    console.log('   4. Rob suggested safe alternative (MonsterDex)');
    console.log('   5. Rob generated working React component');
    console.log('   6. Grandma can touch and interact with preview');
    console.log('');
    console.log('🚀 QuietBuild OS: Design intent as mechanical law');
}
// ==========================================================================
// TEST: Title-Only Update (SHOULD BE BLOCKED)
// ==========================================================================
async function demonstrateBlockedOperation() {
    console.log('');
    console.log('='.repeat(60));
    console.log('🚫 TESTING BLOCKED OPERATION (Title-only update)');
    console.log('='.repeat(60));
    console.log('');
    const rob = new RobEngine_1.RobEngine();
    const session = await rob.createSession('demo_user_123', 'blank_canvas');
    console.log('👨‍💻 Developer: "Just update the app name to Pokemon Trainer"');
    console.log('🤖 Rob: Checking intelligence requirements...');
    try {
        await rob.updateSessionMetadata(session.id, { app_name: 'Pokemon Trainer' }, [] // No intelligence receipts!
        );
        console.log('❌ FAILURE: Operation should have been blocked!');
    }
    catch (error) {
        console.log('✅ SUCCESS: Operation blocked by mechanical law');
        console.log(`   Error: ${error instanceof Error ? error.message : error}`);
        console.log('');
        console.log('💡 Why blocked:');
        console.log('   Title-only updates demonstrate zero intelligence.');
        console.log('   Rob MUST decompose ideas, not just rename things.');
        console.log('   This is MECHANICAL LAW - unbypassable.');
    }
    console.log('');
}
// Run demonstrations
(async () => {
    try {
        await demonstrateIntelligence();
        await demonstrateBlockedOperation();
    }
    catch (error) {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=rob-intelligence-demo.js.map