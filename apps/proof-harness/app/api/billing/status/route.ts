/**
 * Billing Status API - Returns billing state from receipts
 * NO optimistic claims - only what receipts prove
 */

import { ReceiptWriter, TruthState } from "@qbos/truthserum";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const receiptWriter = ReceiptWriter;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Read receipts
    const receipts = await receiptWriter.readReceipts(sessionId);

    // Find billing proofs
    const billingActive = receipts.find((r: any) => r.type === "billing.active");
    const capCheck = receipts.find((r: any) => r.type === "billing.cap_not_exceeded",
    );
    const capWarning = receipts.find((r: any) => r.type === "billing.cap_warning");

    let state: TruthState = "Unknown";
    const missingProofs: string[] = [];

    if (billingActive && capCheck) {
      state = "Verified";
    } else {
      if (!billingActive) missingProofs.push("billing.active");
      if (!capCheck) missingProofs.push("billing.cap_not_exceeded");
    }

    if (capWarning) {
      state = "Blocked";
    }

    return NextResponse.json({
      state,
      billingActive: Boolean(billingActive),
      capExceeded: Boolean(capWarning),
      missingProofs,
      receipts: receipts.filter((r: any) => r.type.startsWith("billing.")),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Billing status error:", error);
    return NextResponse.json(
      {
        state: "Unknown",
        error: "Could not determine billing status",
        nextActions: ["Check server logs", "Ensure receipts are being written"],
      },
      { status: 500 },
    );
  }
}
