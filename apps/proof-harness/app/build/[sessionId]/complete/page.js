"use strict";
/**
 * Completion Page - Build success with links to repo and deployment
 */
'use client';
/**
 * Completion Page - Build success with links to repo and deployment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CompletePage;
const react_1 = require("react");
const api_1 = require("../../../lib/api");
const link_1 = __importDefault(require("next/link"));
function CompletePage({ params }) {
    const [session, setSession] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        loadSession();
    }, [params.sessionId]);
    const loadSession = async () => {
        try {
            const data = await (0, api_1.getBuildSession)(params.sessionId);
            setSession(data);
            setLoading(false);
        }
        catch (err) {
            setError(err.message || 'Failed to load session');
            setLoading(false);
        }
    };
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>);
    }
    if (error || !session) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Session not found'}</p>
          <link_1.default href="/dashboard" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
            Back to Dashboard
          </link_1.default>
        </div>
      </div>);
    }
    const appName = session.config?.app_name || 'Your App';
    const hasRepo = Boolean(session.github_repo_url);
    const hasDeployment = Boolean(session.vercel_deployment_url);
    return (<div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <link_1.default href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </link_1.default>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Build Complete!</h1>
          <p className="text-xl text-gray-600 mb-4">{appName} is ready to use</p>
          <p className="text-gray-500">{session.idea_description}</p>
        </div>

        {/* Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* GitHub Repository */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white text-2xl">
                <span>{'</>'}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">GitHub Repository</h3>
                <p className="text-sm text-gray-500">View and edit your code</p>
              </div>
            </div>
            {hasRepo ? (<>
                <p className="text-sm text-gray-600 mb-4">
                  Your code is ready! You've been invited as an admin collaborator.
                </p>
                <a href={session.github_repo_url} target="_blank" rel="noopener noreferrer" className="inline-block w-full text-center bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 font-medium">
                  Open Repository →
                </a>
              </>) : (<p className="text-sm text-gray-500">Repository access pending...</p>)}
          </div>

          {/* Vercel Deployment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white text-xl">
                <span>▲</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Live Deployment</h3>
                <p className="text-sm text-gray-500">Your app is online</p>
              </div>
            </div>
            {hasDeployment ? (<>
                <p className="text-sm text-gray-600 mb-4">
                  Your app is deployed and accessible online right now!
                </p>
                <a href={session.vercel_deployment_url} target="_blank" rel="noopener noreferrer" className="inline-block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium">
                  View Live App →
                </a>
              </>) : (<p className="text-sm text-gray-500">Deployment in progress...</p>)}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="font-medium text-gray-900">Check your email</p>
                <p className="text-sm text-gray-600">You'll receive GitHub repository and Vercel project invitations</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="font-medium text-gray-900">Accept invitations</p>
                <p className="text-sm text-gray-600">Click the invitation links to gain full access</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <p className="font-medium text-gray-900">Customize your app</p>
                <p className="text-sm text-gray-600">Clone the repository and make it your own</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <link_1.default href="/build/new" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 font-medium text-center">
            Build Another App
          </link_1.default>
          <link_1.default href="/dashboard" className="inline-block bg-white text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50 border border-gray-300 font-medium text-center">
            View All Builds
          </link_1.default>
        </div>
      </main>
    </div>);
}
//# sourceMappingURL=page.js.map