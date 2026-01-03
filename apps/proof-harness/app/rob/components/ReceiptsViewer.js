"use strict";
/**
 * ReceiptsViewer - Displays receipt log
 */
'use client';
/**
 * ReceiptsViewer - Displays receipt log
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptsViewer = ReceiptsViewer;
const react_1 = require("react");
function ReceiptsViewer({ receipts }) {
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    return (<div className="border-t border-gray-200">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-semibold text-gray-700">
          Receipts ({receipts.length})
        </span>
        <span className="text-gray-500">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (<div className="max-h-64 overflow-y-auto bg-white">
          {receipts.length === 0 ? (<div className="p-6 text-center text-gray-500 text-sm">
              No receipts yet
            </div>) : (<div className="divide-y divide-gray-200">
              {receipts.slice().reverse().map((receipt, idx) => (<div key={receipt.id || idx} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-mono text-xs text-blue-600">{receipt.type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(receipt.createdAt).toLocaleString()}
                      </p>
                      {receipt.details && (<details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            Details
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(receipt.details, null, 2)}
                          </pre>
                        </details>)}
                    </div>
                    {receipt.simulated && (<span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                        Simulated
                      </span>)}
                  </div>
                </div>))}
            </div>)}
        </div>)}
    </div>);
}
//# sourceMappingURL=ReceiptsViewer.js.map