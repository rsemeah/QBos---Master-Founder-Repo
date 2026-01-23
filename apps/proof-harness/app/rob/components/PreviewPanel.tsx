/**
 * PreviewPanel - Live preview rendering
 * Renders generated React components in an iframe sandbox
 */

'use client';

import { useEffect, useState, useRef } from 'react';

interface PreviewPanelProps {
  sessionId?: string;
  previewCode?: string;
  componentName?: string;
}

export function PreviewPanel({ sessionId, previewCode, componentName }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewCode) {
      setIsLoading(false);
      return;
    }

    try {
      renderPreview(previewCode, componentName || 'App');
      setIsLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [previewCode, componentName]);

  const renderPreview = (code: string, name: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    // Create HTML document for iframe
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<${name} />);
  </script>
</body>
</html>
    `;

    // Write to iframe
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
  };

  if (!previewCode) {
    return (
      <div className="h-full p-6 bg-gray-100">
        <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">👁️</div>
            <p className="font-semibold">Preview Panel</p>
            <p className="text-sm mt-2">Your app will render here</p>
            <p className="text-xs mt-4 text-gray-400">
              Send a message to Rob to generate a preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-6 bg-gray-100">
        <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center border-2 border-red-300">
          <div className="text-center text-red-600">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="font-semibold">Preview Error</p>
            <p className="text-sm mt-2 max-w-md">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-100 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⚙️</div>
            <p className="text-gray-600">Rendering preview...</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden border border-gray-300">
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center text-gray-400 text-sm font-mono">
            Live Preview: {componentName || 'App'}
          </div>
        </div>
        <iframe
          ref={iframeRef}
          className="w-full h-[calc(100%-2.5rem)] border-none"
          sandbox="allow-scripts"
          title="Preview"
        />
      </div>
    </div>
  );
}
