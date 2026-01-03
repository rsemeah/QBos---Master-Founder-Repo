"use strict";
/**
 * Intents Registry - Canonical definitions of what constitutes "ready"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentsRegistry = void 0;
exports.getIntent = getIntent;
exports.listIntents = listIntents;
exports.IntentsRegistry = {
    "session.ready": {
        intentId: "session.ready",
        name: "Session Ready",
        description: "Session is ready to accept build instructions",
        requiredProofs: [
            {
                type: "identity.authenticated",
                required: true,
                description: "User identity verified"
            },
            {
                type: "billing.active",
                required: true,
                description: "User has active billing"
            },
            {
                type: "session.created",
                required: true,
                description: "Session record exists"
            }
        ]
    },
    "rob.ready": {
        intentId: "rob.ready",
        name: "Rob Ready",
        description: "Rob can generate code",
        requiredProofs: [
            {
                type: "identity.authenticated",
                required: true,
                description: "User authenticated"
            },
            {
                type: "billing.cap_not_exceeded",
                required: true,
                description: "User has not exceeded AI usage cap"
            },
            {
                type: "safety.passed",
                required: true,
                description: "Request passed safety checks"
            }
        ]
    },
    "deploy.ready": {
        intentId: "deploy.ready",
        name: "Deploy Ready",
        description: "App is ready to deploy",
        requiredProofs: [
            {
                type: "build.passed",
                required: true,
                description: "Build completed successfully"
            },
            {
                type: "preview.rendered",
                required: true,
                description: "Preview rendered without errors"
            },
            {
                type: "safety.passed",
                required: true,
                description: "Safety checks passed"
            }
        ]
    },
    "deploy.completed": {
        intentId: "deploy.completed",
        name: "Deploy Completed",
        description: "App successfully deployed and live",
        requiredProofs: [
            {
                type: "github.repo_created",
                required: true,
                description: "GitHub repo created"
            },
            {
                type: "github.commit_pushed",
                required: true,
                description: "Code pushed to GitHub"
            },
            {
                type: "vercel.deploy_success",
                required: true,
                description: "Vercel deployment succeeded"
            },
            {
                type: "vercel.healthcheck_ok",
                required: true,
                description: "Health check returned 200"
            }
        ]
    }
};
function getIntent(intentId) {
    return exports.IntentsRegistry[intentId];
}
function listIntents() {
    return Object.values(exports.IntentsRegistry);
}
//# sourceMappingURL=registry.js.map