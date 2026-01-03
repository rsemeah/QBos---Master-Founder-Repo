"use strict";
/**
 * BuildStateIndicator - Visual indicator for build state
 * Maps technical state to user-friendly text with color coding
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildStateIndicator = BuildStateIndicator;
const STATE_CONFIG = {
    IDEA_CAPTURE: { label: 'Capturing idea...', color: 'text-gray-600', emoji: '💡' },
    TEMPLATE_MATCH: { label: 'Finding template...', color: 'text-blue-600', emoji: '🔍' },
    CONFIG_QUESTIONS: { label: 'Configuring...', color: 'text-blue-600', emoji: '⚙️' },
    PAYMENT_REQUIRED: { label: 'Payment required', color: 'text-yellow-600', emoji: '💳' },
    PAYMENT_PROCESSING: { label: 'Processing payment...', color: 'text-yellow-600', emoji: '⏳' },
    CODE_GENERATING: { label: 'Generating code...', color: 'text-purple-600', emoji: '⚡' },
    CODE_DEPLOYING: { label: 'Deploying app...', color: 'text-purple-600', emoji: '🚀' },
    ACCESS_GRANTING: { label: 'Granting access...', color: 'text-green-600', emoji: '🔑' },
    COMPLETE: { label: 'Complete!', color: 'text-green-600', emoji: '✅' },
    FAILED: { label: 'Failed', color: 'text-red-600', emoji: '❌' },
};
function BuildStateIndicator({ state, className = '' }) {
    const config = STATE_CONFIG[state] || { label: state, color: 'text-gray-600', emoji: '❓' };
    return (<div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl">{config.emoji}</span>
      <span className={`font-medium ${config.color}`}>{config.label}</span>
    </div>);
}
//# sourceMappingURL=BuildStateIndicator.js.map