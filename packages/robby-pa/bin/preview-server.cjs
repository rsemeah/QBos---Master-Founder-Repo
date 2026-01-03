#!/usr/bin/env node
const app = require('../dist/previewServer') || require('../src/previewServer');
const PORT = process.env.ROBBY_PREVIEW_PORT || 3001;
app.default.listen(PORT, () => console.log('preview server listening on', PORT));
