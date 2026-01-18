/**
 * Chat API - TruthSerum-first chat endpoint
 * Pipeline: auth → billing → persist user message → evaluate intent → AI generate → sanitize → persist
 */

import { IntentsRegistry, ReceiptWriter, TruthSerum } from "@qbos/truthserum";
import { NextRequest, NextResponse } from "next/server";
import {
    detectTemplateSelection,
    listTemplates,
    suggestTemplate,
} from "./templateRouter";

const receiptWriter = ReceiptWriter;

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, userId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "Missing message or sessionId" },
        { status: 400 },
      );
    }

    // Step 1: Write user message receipt
    await receiptWriter.writeReceipt({
      sessionId,
      type: "chat.user_message" as any,
      details: { message, userId },
    });

    // Step 2: Read all receipts for session
    const receipts = await receiptWriter.readReceipts(sessionId);

    // Step 3: Normalize receipts and evaluate session.ready intent
    const normalizedReceipts = receipts.map((r) => ({
      ...r,
      sessionId: r.sessionId ?? undefined,
    }));
    const sessionReadyEval = TruthSerum.evaluateIntent(
      IntentsRegistry["session.ready"],
      normalizedReceipts,
    );

    // Step 4: If not ready, return truthful response
    if (sessionReadyEval.state !== "Verified") {
      const response = buildNotReadyResponse(sessionReadyEval);

      await receiptWriter.writeReceipt({
        sessionId,
        type: "chat.assistant_message" as any,
        details: {
          message: response.message,
          state: sessionReadyEval.state,
          missingProofs: sessionReadyEval.missingProofs,
        },
      });

      return NextResponse.json(response);
    }

    const suggestedTemplate = suggestTemplate(message);
    const selectedTemplate = detectTemplateSelection(message);

    if (suggestedTemplate) {
      await receiptWriter.writeReceipt({
        sessionId,
        type: "template.suggested" as any,
        details: suggestedTemplate,
      });
    }

    if (selectedTemplate) {
      await receiptWriter.writeReceipt({
        sessionId,
        type: "template.selected" as any,
        details: selectedTemplate,
      });
    }

    const templateList = listTemplates()
      .map((template) => `- ${template.name}`)
      .join("\n");

    // Step 5: Generate AI response (mock for now - integrate SilentEngine)
    const draftResponse = `${buildAcknowledgement(message)}${buildTemplateNote(
      suggestedTemplate,
      selectedTemplate,
    )}\n\nAvailable templates:\n${templateList}`;

    // Step 6: Sanitize with TruthSerum
    const verdict = TruthSerum.sanitizeClaims(
      draftResponse,
      normalizedReceipts,
      "Unknown",
    );

    const finalResponse = verdict.sanitizedText || draftResponse;

    // Step 7: Write assistant message receipt
    await receiptWriter.writeReceipt({
      sessionId,
      type: "chat.assistant_message" as any,
      details: {
        message: finalResponse,
        sanitized: verdict.sanitizedText !== undefined,
        missingProofs: verdict.missingProofs,
      },
    });

    return NextResponse.json({
      message: finalResponse,
      state: verdict.state,
      missingProofs: verdict.missingProofs,
      nextActions: verdict.nextActions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        message: "Status unknown - error processing message",
        error: "Processing failed",
        nextActions: ["Try again or check server logs"],
      },
      { status: 500 },
    );
  }
}

function buildAcknowledgement(message: string) {
  return `Thanks! I can help with that. You said:\n"${message.trim()}"\n`;
}

function buildTemplateNote(
  suggestedTemplate: { templateName: string } | null,
  selectedTemplate: { templateName: string } | null,
) {
  if (selectedTemplate) {
    return `\nTemplate locked in: ${selectedTemplate.templateName}.`;
  }
  if (suggestedTemplate) {
    return `\nSuggested template: ${suggestedTemplate.templateName}. Reply “use ${suggestedTemplate.templateName}” to confirm.`;
  }
  return `\nTell me which template you want to use, or describe the app and I will suggest one.`;
}

function buildNotReadyResponse(evaluation: any) {
  const missingSteps = evaluation.nextSteps.map(
    (step: string) => step.replace("Obtain proof: ", "").split(" - ")[0],
  );

  return {
    message: `I'd love to help, but I need a few things first:\n\n${evaluation.nextSteps
      .map(
        (step: string, i: number) =>
          `${i + 1}. ${step.split(" - ")[1] || step}`,
      )
      .join("\n")}\n\nLet's get those sorted first!`,
    state: evaluation.state,
    missingProofs: missingSteps,
    nextActions: evaluation.nextSteps,
  };
}
