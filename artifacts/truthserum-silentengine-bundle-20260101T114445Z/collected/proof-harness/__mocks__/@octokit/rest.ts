/**
 * Mock for @octokit/rest package
 */

export class Octokit {
  repos = {
    createUsingTemplate: jest.fn().mockResolvedValue({
      data: { html_url: 'https://github.com/test/repo' },
    }),
    createWebhook: jest.fn(),
  };
}
