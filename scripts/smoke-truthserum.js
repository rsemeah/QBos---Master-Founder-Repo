"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const keystore_1 = __importDefault(require("../packages/truthserum/src/keystore"));
const ReceiptWriter_1 = __importDefault(require("../packages/truthserum/src/ReceiptWriter"));
async function run() {
    try {
        console.log('Initializing keystore...');
        keystore_1.default.init();
        console.log('Creating ReceiptWriter instance...');
        const writer = ReceiptWriter_1.default;
        console.log('Writing signed receipt (local fallback expected)...');
        const receipt = await writer.writeReceipt({
            sessionId: 'smoke-test',
            type: 'smoke.test',
            details: { message: 'hello truthserum', ts: new Date().toISOString() }
        });
        console.log('Signed receipt:');
        console.log(JSON.stringify(receipt, null, 2));
        console.log('Verifying receipt...');
        const ok = await writer.verifyReceipt(receipt);
        console.log('Verification result:', ok);
        console.log('If using local fallback, sample file: proof/local_receipts.jsonl');
    }
    catch (e) {
        console.error('Smoke test failed:', e);
        process.exit(2);
    }
}
run();
//# sourceMappingURL=smoke-truthserum.js.map