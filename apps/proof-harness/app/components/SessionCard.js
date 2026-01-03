"use strict";
/**
 * SessionCard - Reusable session display card
 * Used in dashboard to show build sessions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCard = SessionCard;
const link_1 = __importDefault(require("next/link"));
const BuildStateIndicator_1 = require("./BuildStateIndicator");
const ReadinessTierBadge_1 = require("./ReadinessTierBadge");
function SessionCard({ session }) {
    const appName = session.config?.app_name || 'Untitled App';
    const createdDate = new Date(session.created_at).toLocaleDateString();
    return (<link_1.default href={`/build/${session.id}`} className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{appName}</h3>
        <ReadinessTierBadge_1.ReadinessTierBadge tier={session.readiness_tier}/>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{session.idea_description}</p>

      <div className="flex items-center justify-between">
        <BuildStateIndicator_1.BuildStateIndicator state={session.current_state}/>
        <span className="text-xs text-gray-500">{createdDate}</span>
      </div>
    </link_1.default>);
}
//# sourceMappingURL=SessionCard.js.map