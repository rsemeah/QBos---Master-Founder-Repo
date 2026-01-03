"use strict";
/**
 * Chat API - TruthSerum-first chat endpoint
 * Pipeline: auth → billing → persist user message → evaluate intent → AI generate → sanitize → persist
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const truthserum_1 = require("@qbos/truthserum");
const templateRouter_1 = require("./templateRouter");
const receiptWriter = new truthserum_1.ReceiptWriter({
    localFallbackPath: './proof/local_receipts.jsonl',
});
async function POST(request) {
    try {
        const { message, sessionId, userId } = await request.json();
        if (!message || !sessionId) {
            return server_1.NextResponse.json({ error: 'Missing message or sessionId' }, { status: 400 });
        }
        // Step 1: Write user message receipt
        await receiptWriter.writeReceipt({
            sessionId,
            type: 'chat.user_message',
            details: { message, userId },
        });
        // Step 2: Read all receipts for session
        const receipts = await receiptWriter.readReceipts(sessionId);
        // Step 3: Evaluate session.ready intent
        const sessionReadyEval = truthserum_1.TruthSerum.evaluateIntent(truthserum_1.IntentsRegistry['session.ready'], receipts);
        // Step 4: If not ready, return truthful response
        if (sessionReadyEval.state !== 'Verified') {
            const response = buildNotReadyResponse(sessionReadyEval);
            await receiptWriter.writeReceipt({
                sessionId,
                type: 'chat.assistant_message',
                details: {
                    message: response.message,
                    state: sessionReadyEval.state,
                    missingProofs: sessionReadyEval.missingProofs,
                },
            });
            return server_1.NextResponse.json(response);
        }
        const suggestedTemplate = (0, templateRouter_1.suggestTemplate)(message);
        const selectedTemplate = (0, templateRouter_1.detectTemplateSelection)(message);
        if (suggestedTemplate) {
            await receiptWriter.writeReceipt({
                sessionId,
                type: 'template.suggested',
                details: suggestedTemplate,
            });
        }
        if (selectedTemplate) {
            await receiptWriter.writeReceipt({
                sessionId,
                type: 'template.selected',
                details: selectedTemplate,
            });
        }
        const templateList = (0, templateRouter_1.listTemplates)()
            .map((template) => `- ${template.name}`)
            .join('\n');
        // Step 5: Generate AI response (mock for now - integrate SilentEngine)
        const draftResponse = `${buildAcknowledgement(message)}${buildTemplateNote(suggestedTemplate, selectedTemplate)}\n\nAvailable templates:\n${templateList}`;
        // Step 6: Sanitize with TruthSerum
        const verdict = truthserum_1.TruthSerum.sanitizeClaims(draftResponse, receipts, 'Unknown');
        const finalResponse = verdict.sanitizedText || draftResponse;
        // Step 7: Write assistant message receipt
        await receiptWriter.writeReceipt({
            sessionId,
            type: 'chat.assistant_message',
            details: {
                message: finalResponse,
                sanitized: verdict.sanitizedText !== undefined,
                missingProofs: verdict.missingProofs,
            },
        });
        return server_1.NextResponse.json({
            message: finalResponse,
            state: verdict.state,
            missingProofs: verdict.missingProofs,
            nextActions: verdict.nextActions,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Chat error:', error);
        return server_1.NextResponse.json({
            message: 'Status unknown - error processing message',
            error: 'Processing failed',
            nextActions: ['Try again or check server logs'],
        }, { status: 500 });
    }
}
function buildAcknowledgement(message) {
    return `Thanks! I can help with that. You said:\n"${message.trim()}"\n`;
}
function buildTemplateNote(suggestedTemplate, selectedTemplate) {
    if (selectedTemplate) {
        return `\nTemplate locked in: ${selectedTemplate.templateName}.`;
    }
    if (suggestedTemplate) {
        return `\nSuggested template: ${suggestedTemplate.templateName}. Reply “use ${suggestedTemplate.templateName}” to confirm.`;
    }
    return `\nTell me which template you want to use, or describe the app and I will suggest one.`;
}
function buildNotReadyResponse(evaluation) {
    const missingSteps = evaluation.nextSteps.map((step) => step.replace('Obtain proof: ', '').split(' - ')[0]);
    return {
        message: `I'd love to help, but I need a few things first:\n\n${evaluation.nextSteps.map((step, i) => `${i + 1}. ${step.split(' - ')[1] || step}`).join('\n')}\n\nLet's get those sorted first!`,
        state: evaluation.state,
        missingProofs: missingSteps,
        nextActions: evaluation.nextSteps,
    };
}
//# sourceMappingURL=route.js.map