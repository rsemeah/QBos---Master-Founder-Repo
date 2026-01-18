import ActionGuard from "./packages/runtime/src/guard/ActionGuard";

async function run() {
  const guard = new ActionGuard();
  const res = await guard.guardAction({
    action_id: "test.action",
    sessionId: "s-123",
  });
  console.log("Guard result:", res);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
