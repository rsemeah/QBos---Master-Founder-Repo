"use strict";
/**
 * Mock for @octokit/rest package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Octokit = void 0;
class Octokit {
    repos = {
        createUsingTemplate: jest.fn().mockResolvedValue({
            data: { html_url: 'https://github.com/test/repo' },
        }),
        createWebhook: jest.fn(),
    };
}
exports.Octokit = Octokit;
//# sourceMappingURL=rest.js.map