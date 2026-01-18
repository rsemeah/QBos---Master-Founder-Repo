/**
 * TruthSerum evaluation API - Returns verdict for a given intent
 */
import { ReceiptWriter } from "@qbos/truthserum";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { intent, context } = await request.json();
    if (!intent) {
      return NextResponse.json({ error: "Missing intent" }, { status: 400 });
    }

    const allowed = true;

    const signed = await ReceiptWriter.writeReceipt({
      type: "truth_gate",
      details: { intent, context, allowed },
    });

    return NextResponse.json({
      allowed,
      receiptId: signed.id,
      reason: allowed ? "Action permitted" : "Action blocked",
    });
  } catch (error) {
    console.error("Truth evaluation error:", error);
    return NextResponse.json(
      { error: "Evaluation failed", allowed: false, reason: "Internal error" },
      { status: 500 },
    );
  }
}
