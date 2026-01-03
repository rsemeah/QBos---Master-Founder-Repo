"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotFound;
const link_1 = __importDefault(require("next/link"));
function NotFound() {
    return (<main style={{
            fontFamily: 'system-ui',
            padding: '3rem',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
        }}>
      <div style={{
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '3rem 2rem',
            backgroundColor: '#fffbeb',
        }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: '#f59e0b' }}>⚠️</h1>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0', color: '#333' }}>
          This page isn't ready yet
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#666', margin: '0 0 2rem 0' }}>
          Status: <strong>Unknown</strong>
        </p>
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
          The route you're looking for hasn't been implemented yet, or may have been moved.
          This is a truthful response—not an error, just incomplete coverage.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <link_1.default href="/" style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
        }}>
            ← Back to Dashboard
          </link_1.default>
          <link_1.default href="/api/health" style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
        }}>
            Check System Health
          </link_1.default>
        </div>

        <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#78350f',
        }}>
          <strong>Next Action:</strong> If you expected this page to exist, verify the route in the
          route manifest or contact the development team.
        </div>
      </div>
    </main>);
}
//# sourceMappingURL=not-found.js.map