"use strict";
/**
 * Build Progress Page - Real-time build status with polling
 */
'use client';
/**
 * Build Progress Page - Real-time build status with polling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BuildProgressPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const api_1 = require("../../lib/api");
const BuildStateIndicator_1 = require("../../components/BuildStateIndicator");
const ReadinessTierBadge_1 = require("../../components/ReadinessTierBadge");
const link_1 = __importDefault(require("next/link"));
function BuildProgressPage({ params }) {
    const router = (0, navigation_1.useRouter)();
    const [session, setSession] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        loadSession();
        const interval = setInterval(loadSession, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [params.sessionId]);
    const loadSession = async () => {
        try {
            setError('');
            const data = await (0, api_1.getBuildSession)(params.sessionId);
            setSession(data);
            setLoading(false);
            // Stop polling if complete or failed
            if (data.current_state === 'COMPLETE' || data.current_state === 'FAILED') {
                // No need to clear interval here, useEffect cleanup handles it
            }
        }
        catch (err) {
            setError(err.message || 'Failed to load session');
            setLoading(false);
        }
    };
    const getProgressSteps = () => {
        if (!session)
            return [];
        const stateOrder = [
            'IDEA_CAPTURE',
            'TEMPLATE_MATCH',
            'CONFIG_QUESTIONS',
            'PAYMENT_REQUIRED',
            'PAYMENT_PROCESSING',
            'CODE_GENERATING',
            'CODE_DEPLOYING',
            'ACCESS_GRANTING',
            'COMPLETE',
        ];
        const currentIndex = stateOrder.indexOf(session.current_state);
        return [
            { label: 'Idea Captured', state: 'IDEA_CAPTURE', completed: currentIndex >= 0, current: currentIndex === 0 },
            { label: 'Template Matched', state: 'TEMPLATE_MATCH', completed: currentIndex >= 1, current: currentIndex === 1 },
            { label: 'Payment Required', state: 'PAYMENT_REQUIRED', completed: currentIndex >= 4, current: currentIndex >= 2 && currentIndex <= 4 },
            { label: 'Generating Code', state: 'CODE_GENERATING', completed: currentIndex >= 5, current: currentIndex === 5 },
            { label: 'Deploying', state: 'CODE_DEPLOYING', completed: currentIndex >= 6, current: currentIndex === 6 },
            { label: 'Granting Access', state: 'ACCESS_GRANTING', completed: currentIndex >= 7, current: currentIndex === 7 },
            { label: 'Complete!', state: 'COMPLETE', completed: currentIndex >= 8, current: currentIndex === 8 },
        ];
    };
    const showPaymentButton = session?.current_state === 'PAYMENT_REQUIRED';
    const showCompleteButton = session?.current_state === 'COMPLETE';
    if (loading && !session) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading build...</p>
        </div>
      </div>);
    }
    if (error && !session) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Build</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <link_1.default href="/dashboard" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
            Back to Dashboard
          </link_1.default>
        </div>
      </div>);
    }
    if (!session)
        return null;
    const steps = getProgressSteps();
    const appName = session.config?.app_name || 'Your App';
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{appName}</h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <BuildStateIndicator_1.BuildStateIndicator state={session.current_state}/>
            <ReadinessTierBadge_1.ReadinessTierBadge tier={session.readiness_tier}/>
          </div>
          <p className="text-gray-600">{session.idea_description}</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Build Progress</h2>
          <div className="space-y-4">
            {steps.map((step, index) => (<div key={index} className="flex items-center gap-4">
                {/* Status Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500' : step.current ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  {step.completed ? (<span className="text-white text-lg">✓</span>) : step.current ? (<div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>) : (<span className="text-gray-400">{index + 1}</span>)}
                </div>

                {/* Step Label */}
                <div className="flex-1">
                  <span className={`font-medium ${step.completed ? 'text-green-600' : step.current ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (<div className={`absolute left-8 h-full w-0.5 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} style={{ marginTop: '2rem' }}></div>)}
              </div>))}
          </div>
        </div>

        {/* Action Buttons */}
        {showPaymentButton && (<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Build</h3>
            <p className="text-gray-600 mb-4">Complete payment to generate your app</p>
            <link_1.default href={`/build/${session.id}/payment`} className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 font-medium">
              Complete Payment ($49)
            </link_1.default>
          </div>)}

        {showCompleteButton && (<div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Complete! 🎉</h3>
            <p className="text-gray-600 mb-4">Your app is ready to use</p>
            <link_1.default href={`/build/${session.id}/complete`} className="inline-block bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 font-medium">
              View Your App
            </link_1.default>
          </div>)}
      </main>
    </div>);
}
//# sourceMappingURL=page.js.map