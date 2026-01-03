"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
require("./globals.css");
exports.metadata = {
    title: 'QuietBuild OS™ Demo',
    description: 'Precision Infrastructure for Trust-Based Products',
};
function RootLayout({ children, }) {
    return (<html lang="en">
      <body className="antialiased">{children}</body>
    </html>);
}
//# sourceMappingURL=layout.js.map