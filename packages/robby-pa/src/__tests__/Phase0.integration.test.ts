/**
 * Phase 0 Integration Test: Session Initialization
 *
 * Tests that sessions can be created and consent flow works
 */

import { beforeEach, describe, expect, test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { createReceipt } from "../receipt";
import InMemoryStore from "../store/inMemoryStore";
import { InMemorySessionStore } from "../store/sessionStore";

describe("Phase 0: Session Initialization", () => {
  let sessionStore: any;
  let receiptStore: any;
  let sessionId: string;
  const userId = "test-user-123";

  beforeEach(() => {
    sessionStore = new InMemorySessionStore();
    receiptStore = new InMemoryStore();
    sessionId = uuidv4();
    process.env.ROBBY_RECEIPT_MAC_SECRET = "test-secret-phase-0";
  });

  test("Create session and emit session.visited receipt", async () => {
    // Create session
    const session = await sessionStore.createSession({
      id: sessionId,
      user_id: userId,
      phase: "CONSENT",
      sub_state: "awaiting_approval",
      ux_state: "shaping",
    });

    expect(session).toBeDefined();
    expect(session.id).toBe(sessionId);
    expect(session.phase).toBe("CONSENT");

    // Emit session.visited receipt
    const receipt = await createReceipt({
      sessionId,
      type: "session.visited",
      payload: {
        userId,
        timestamp: new Date().toISOString(),
      },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    expect(receipt).toBeDefined();
    expect(receipt.type).toBe("session.visited");
    expect(receipt.payload.userId).toBe(userId);
    expect(receipt.hash).toBeTruthy();
    expect(receipt.mac).toBeTruthy();
  });

  test("Emit consent.approved receipt and transition state", async () => {
    // Create initial session
    const session = await sessionStore.createSession({
      id: sessionId,
      user_id: userId,
      phase: "CONSENT",
      sub_state: "awaiting_approval",
    });

    // Emit consent.approved receipt
    const receipt = await createReceipt({
      sessionId,
      type: "consent.approved",
      payload: {
        approved: true,
        userId,
        timestamp: new Date().toISOString(),
      },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    // Transition state
    await sessionStore.updateSession(sessionId, {
      phase: "INTENT",
      sub_state: "collecting",
    } as any);

    const updated = await sessionStore.getSession(sessionId);
    expect(updated.phase).toBe("INTENT");
    expect(receipt.type).toBe("consent.approved");
  });

  test("Emit consent.declined receipt", async () => {
    await sessionStore.createSession({
      id: sessionId,
      user_id: userId,
      phase: "CONSENT",
      sub_state: "awaiting_approval",
    });

    const receipt = await createReceipt({
      sessionId,
      type: "consent.declined",
      payload: {
        approved: false,
        userId,
        timestamp: new Date().toISOString(),
      },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    expect(receipt.type).toBe("consent.declined");
    expect(receipt.payload.approved).toBe(false);
  });

  test("Receipt chain maintains sequence", async () => {
    const session = await sessionStore.createSession({
      id: sessionId,
      user_id: userId,
    });

    // Receipt 1: session.visited
    const receipt1 = await createReceipt({
      sessionId,
      type: "session.visited",
      payload: { userId },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    expect(receipt1.seq).toBe(0);
    expect(receipt1.prevHash).toBeNull();

    // Receipt 2: consent.approved
    const receipt2 = await createReceipt({
      sessionId,
      type: "consent.approved",
      payload: { approved: true, userId },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    expect(receipt2.seq).toBe(1);
    expect(receipt2.prevHash).toBe(receipt1.hash);
  });

  test("Get all receipts for session", async () => {
    await sessionStore.createSession({ id: sessionId, user_id: userId });

    await createReceipt({
      sessionId,
      type: "session.visited",
      payload: { userId },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    await createReceipt({
      sessionId,
      type: "consent.approved",
      payload: { approved: true, userId },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    const receipts = await receiptStore.getReceiptsForSession(sessionId);
    expect(receipts).toHaveLength(2);
    expect(receipts[0].type).toBe("session.visited");
    expect(receipts[1].type).toBe("consent.approved");
  });

  test("Receipt hashes are valid", async () => {
    await sessionStore.createSession({ id: sessionId, user_id: userId });

    const receipt = await createReceipt({
      sessionId,
      type: "session.visited",
      payload: { userId },
      store: {
        getLastReceiptForSession:
          receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
      },
    } as any);

    // Hash should be 64 characters (SHA256 hex)
    expect(receipt.hash.length).toBe(64);

    // MAC should exist
    expect(receipt.mac).toBeTruthy();
    expect(receipt.mac.length).toBe(64);
  });

  test("Cannot create receipt without MAC secret", async () => {
    delete process.env.ROBBY_RECEIPT_MAC_SECRET;

    await sessionStore.createSession({ id: sessionId, user_id: userId });

    await expect(
      createReceipt({
        sessionId,
        type: "session.visited",
        payload: { userId },
        store: {
          getLastReceiptForSession:
            receiptStore.getLastReceiptForSession.bind(receiptStore),
          insertReceipt: receiptStore.insertReceipt.bind(receiptStore),
        },
      } as any)
    ).rejects.toThrow("ROBBY_RECEIPT_MAC_SECRET not configured");
  });
});
