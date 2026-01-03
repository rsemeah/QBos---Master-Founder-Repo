"use strict";
/**
 * New Build Page - Idea input form
 */
'use client';
/**
 * New Build Page - Idea input form
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NewBuildPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const api_1 = require("../../lib/api");
const link_1 = __importDefault(require("next/link"));
const EXAMPLE_PROMPTS = [
    'A todo list app with categories and priorities',
    'A blog where I can write and publish articles',
    'A dashboard to track my fitness goals',
    'A landing page for my consulting business',
];
function NewBuildPage() {
    const router = (0, navigation_1.useRouter)();
    const [ideaDescription, setIdeaDescription] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (ideaDescription.trim().length < 10) {
            setError('Please describe your idea with at least 10 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await (0, api_1.startBuild)(ideaDescription);
            router.push(`/build/${response.session.id}`);
        }
        catch (err) {
            setError(err.message || 'Failed to start build');
            setLoading(false);
        }
    };
    const handleExampleClick = (example) => {
        setIdeaDescription(example);
    };
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            What do you want to build?
          </h1>
          <p className="text-lg text-gray-600">
            Describe your app idea in plain English. Be specific about what you want it to do.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {error && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>)}

            <div className="mb-6">
              <label htmlFor="idea" className="block text-sm font-medium text-gray-700 mb-2">
                Your Idea
              </label>
              <textarea id="idea" value={ideaDescription} onChange={(e) => setIdeaDescription(e.target.value)} rows={6} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Example: I want a todo list app where I can organize tasks by project, set priorities, and mark them complete..." required/>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {ideaDescription.length} characters (minimum 10)
                </span>
                {ideaDescription.length >= 10 && (<span className="text-xs text-green-600">✓ Ready to build</span>)}
              </div>
            </div>

            {/* Example Prompts */}
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Need inspiration? Try these examples:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EXAMPLE_PROMPTS.map((example, index) => (<button key={index} type="button" onClick={() => handleExampleClick(example)} className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors">
                    {example}
                  </button>))}
              </div>
            </div>

            <button type="submit" disabled={loading || ideaDescription.trim().length < 10} className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg">
              {loading ? 'Starting build...' : 'Start Building'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Tip: The more specific you are, the better your app will match your vision</p>
        </div>
      </main>
    </div>);
}
//# sourceMappingURL=page.js.map