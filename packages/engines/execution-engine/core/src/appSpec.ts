export interface AppSpec {
  appName: string;
  description?: string;
  archetype: string;
  goals: string[];
  stack?: {
    frontend?: string;
    backend?: string;
    database?: string;
  };
  deployment?: {
    targets: string[];
  };
  capabilities?: string[];
}

export interface AppSpecValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateAppSpec(spec: unknown): AppSpecValidationResult {
  const errors: string[] = [];

  if (!spec || typeof spec !== "object") {
    return { ok: false, errors: ["AppSpec must be an object."] };
  }

  const candidate = spec as AppSpec;

  if (!candidate.appName || typeof candidate.appName !== "string") {
    errors.push("appName is required.");
  }

  if (!candidate.archetype || typeof candidate.archetype !== "string") {
    errors.push("archetype is required.");
  }

  if (!Array.isArray(candidate.goals) || candidate.goals.length === 0) {
    errors.push("goals must contain at least one goal.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
