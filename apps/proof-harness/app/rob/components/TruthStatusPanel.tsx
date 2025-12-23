/**
 * TruthStatusPanel - Shows TruthSerum evaluation status
 */

'use client';

interface TruthStatusPanelProps {
  truthState: any;
}

export function TruthStatusPanel({ truthState }: TruthStatusPanelProps) {
  if (!truthState) {
    return (
      <div className="p-4 bg-gray-100">
        <p className="text-sm text-gray-500">Evaluating truth state...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Truth Status</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            truthState.state === 'Verified'
              ? 'bg-green-100 text-green-800'
              : truthState.state === 'Blocked'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {truthState.state}
        </span>
      </div>

      {truthState.missingProofs && truthState.missingProofs.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Missing Proofs:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {truthState.missingProofs.map((proof: any, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>{proof.type}: {proof.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {truthState.nextSteps && truthState.nextSteps.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Next Steps:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {truthState.nextSteps.map((step: string, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-500 mr-2">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {truthState.foundProofs && truthState.foundProofs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-green-600">
            ✓ {truthState.foundProofs.length} proof{truthState.foundProofs.length !== 1 ? 's' : ''} verified
          </p>
        </div>
      )}
    </div>
  );
}
