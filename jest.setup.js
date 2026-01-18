// Basic Jest setup: ensure global fetch exists and provide lightweight polyfills
if (typeof global.fetch === "undefined") {
  try {
    // Prefer undici if available (Node 18+), fall back to node-fetch
    // eslint-disable-next-line global-require
    const { fetch } = require("undici");
    global.fetch = fetch;
  } catch (e) {
    try {
      // eslint-disable-next-line global-require
      global.fetch = require("node-fetch");
    } catch (err) {
      // leave as-is; some tests should mock fetch explicitly
    }
  }
}
