/**
 * PreviewPanel - Shows app preview (mock for now)
 */

'use client';

export function PreviewPanel() {
  return (
    <div className="h-full p-6 bg-gray-100">
      <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">👁️</div>
          <p className="font-semibold">Preview Panel</p>
          <p className="text-sm mt-2">Your app will render here</p>
          <p className="text-xs mt-4 text-gray-400">
            (Requires preview.rendered receipt)
          </p>
        </div>
      </div>
    </div>
  );
}
