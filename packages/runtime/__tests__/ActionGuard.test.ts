jest.mock("@qbos/runtime/guard/PolicyEnforcer", () => {
  return {
    PolicyEnforcer: jest.fn().mockImplementation(() => ({
      enforce: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

jest.mock("@qbos/runtime/guard/ApprovalVerifier", () => {
  return {
    ApprovalVerifier: jest.fn().mockImplementation(() => ({
      verifyApproval: jest.fn().mockResolvedValue(true),
    })),
  };
});

import ActionGuard from "@qbos/runtime/guard/ActionGuard";
import fs from "fs";
import path from "path";

beforeEach(() => {
  const dir = path.join(process.cwd(), ".robby", "REGISTRY");
  fs.mkdirSync(dir, { recursive: true });
  const actions = {
    actions: [
      {
        action_id: "test.action",
        requires_brainsmart: false,
        category: "default",
      },
    ],
  };
  fs.writeFileSync(
    path.join(dir, "actions.v1.json"),
    JSON.stringify(actions, null, 2),
  );

  const receiptsDir = path.join(process.cwd(), ".robby", "receipts");
  if (fs.existsSync(receiptsDir)) {
    fs.readdirSync(receiptsDir).forEach((f) =>
      fs.unlinkSync(path.join(receiptsDir, f)),
    );
  }
});

afterEach(() => {
  const reg = path.join(process.cwd(), ".robby", "REGISTRY");
  fs.rmSync(reg, { recursive: true, force: true });
  const receiptsDir = path.join(process.cwd(), ".robby", "receipts");
  fs.rmSync(receiptsDir, { recursive: true, force: true });
});

test("guardAction allows known action", async () => {
  const guard = new ActionGuard();
  const res = await guard.guardAction({
    action_id: "test.action",
    sessionId: "s1",
  });
  expect(res.allowed).toBe(true);
  expect(res.receipts.length).toBeGreaterThanOrEqual(2);
});

test("guardAction denies when registry missing", async () => {
  const reg = path.join(process.cwd(), ".robby", "REGISTRY");
  fs.rmSync(reg, { recursive: true, force: true });
  const guard = new ActionGuard();
  const res = await guard.guardAction({
    action_id: "test.action",
    sessionId: "s1",
  });
  expect(res.allowed).toBe(false);
  expect(res.reason).toBe("registry_missing");
});
