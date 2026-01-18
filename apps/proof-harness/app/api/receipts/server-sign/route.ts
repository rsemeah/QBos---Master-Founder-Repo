import { IdentityEngine } from "@qbos/identity-engine-core";
import { ReceiptWriter } from "@qbos/truthserum";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_SERVER_SIGN_TYPES = [
  "build.session.created",
  "build.step.completed",
  "deployment.triggered",
  "template.applied",
  "generation.completed",
  "github.repo.created",
  "vercel.deployment.completed",
  "healthcheck.passed",
  "delegation.progressed",
  "delegation.reverted",
];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    const identityEngine = new IdentityEngine();
    const session = await identityEngine.validateSession(token);

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Invalid or expired session token" },
        { status: 401 },
      );
    }

    const payload = await req.json();

    if (!payload?.type || !ALLOWED_SERVER_SIGN_TYPES.includes(payload.type)) {
      return NextResponse.json(
        {
          error: "Unauthorized receipt type",
          allowedTypes: ALLOWED_SERVER_SIGN_TYPES,
        },
        { status: 403 },
      );
    }

    const details = {
      ...payload.details,
      actor: {
        userId: session.userId,
        orgId: session.orgId || null,
        role: session.role || "user",
      },
      serverSigned: true,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    };

    const receipt = await ReceiptWriter.write({
      sessionId: session.id,
      type: payload.type,
      details,
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("[Server-Sign] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
