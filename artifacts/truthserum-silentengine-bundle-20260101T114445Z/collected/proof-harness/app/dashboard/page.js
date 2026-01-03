"use strict";
/**
 * Dashboard Page - User's build sessions list
 */
'use client';
/**
 * Dashboard Page - User's build sessions list
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = DashboardPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const SessionCard_1 = require("../components/SessionCard");
const api_1 = require("../lib/api");
const link_1 = __importDefault(require("next/link"));
exports.dynamic = 'force-dynamic';
function DashboardPage() {
    const router = (0, navigation_1.useRouter)();
    const [sessions, setSessions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [user, setUser] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const getUser = async () => {
            const { createClientComponentClient } = await Promise.resolve().then(() => __importStar(require('@supabase/auth-helpers-nextjs')));
            const supabase = createClientComponentClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);
    (0, react_1.useEffect)(() => {
        loadSessions();
    }, []);
    const loadSessions = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await (0, api_1.getUserSessions)();
            setSessions(data);
        }
        catch (err) {
            setError(err.message || 'Failed to load sessions');
        }
        finally {
            setLoading(false);
        }
    };
    const handleLogout = async () => {
        const { createClientComponentClient } = await Promise.resolve().then(() => __importStar(require('@supabase/auth-helpers-nextjs')));
        const supabase = createClientComponentClient();
        await supabase.auth.signOut();
        router.push('/login');
    };
    return (<div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">QuietBuild OS</h1>
          <div className="flex items-center gap-4">
            {user && (<span className="text-sm text-gray-600">{user.email}</span>)}
            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Builds</h2>
            <p className="text-gray-600 mt-1">Manage and track your app builds</p>
          </div>
          <link_1.default href="/build/new" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium">
            + Start New Build
          </link_1.default>
        </div>

        {/* Error State */}
        {error && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>)}

        {/* Loading State */}
        {loading && (<div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your builds...</p>
          </div>)}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (<div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No builds yet</h3>
            <p className="text-gray-600 mb-6">Start your first app build to get started</p>
            <link_1.default href="/build/new" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium">
              Start Building
            </link_1.default>
          </div>)}

        {/* Sessions Grid */}
        {!loading && sessions.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (<SessionCard_1.SessionCard key={session.id} session={session}/>))}
          </div>)}
      </main>
    </div>);
}
//# sourceMappingURL=page.js.map