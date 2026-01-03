"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewIframe = PreviewIframe;
const react_1 = require("react");
function PreviewIframe({ code }) {
    const iframeRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!iframeRef.current)
            return;
        const doc = iframeRef.current.contentDocument;
        if (!doc)
            return;
        const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-4">
    <div id="root">${code}</div>
  </body>
</html>`;
        doc.open();
        doc.write(html);
        doc.close();
    }, [code]);
    if (!code) {
        return <div className="p-4 text-sm text-gray-500">No preview available.</div>;
    }
    return (<div className="border rounded overflow-hidden">
      <iframe ref={iframeRef} title="preview-iframe" style={{ width: '100%', height: '400px', border: '0' }}/>
    </div>);
}
//# sourceMappingURL=PreviewIframe.js.map