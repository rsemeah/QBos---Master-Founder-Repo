/**
 * PreviewPanel - Displays a preview summary of generated output.
 */

interface PreviewPanelProps {
  receipts: Array<{ type?: string; details?: Record<string, unknown> }>;
}

export function PreviewPanel({ receipts }: PreviewPanelProps) {
  const latestPreview = receipts.find((receipt) => receipt.type?.includes('preview'));

  return (
    <div className="flex-1 border-b border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h2>
      {latestPreview ? (
        <div className="text-sm text-gray-600">
          <p>Latest preview receipt:</p>
          <pre className="mt-2 rounded bg-gray-50 p-3 text-xs text-gray-700">
            {JSON.stringify(latestPreview.details ?? latestPreview, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No preview generated yet.</p>
      )}
    </div>
  );
}
