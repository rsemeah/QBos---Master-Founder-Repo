export { ActionGuard } from "./guard/ActionGuard";
export { ApprovalVerifier } from "./guard/ApprovalVerifier";
export { PolicyEnforcer } from "./guard/PolicyEnforcer";

export async function guardAction(
  args: Parameters<typeof ActionGuard.prototype.guardAction>[0],
) {
  const g = new (await import("./guard/ActionGuard")).ActionGuard();
  return g.guardAction(args as any);
}
