#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calibration_js_1 = require("./core/calibration.js");
const key_rotation_js_1 = require("./core/key-rotation.js");
const verification_js_1 = require("./core/verification.js");
const retro_js_1 = require("./workflows/retro.js");
async function main() {
    const cwd = process.cwd();
    const cmd = process.argv[2];
    if (!cmd) {
        console.error('Usage: calibrate|verify|certify|retro|rotate-key');
        process.exit(2);
    }
    try {
        if (cmd === 'calibrate') {
            const res = await (0, calibration_js_1.calibrate)(cwd);
            console.log(JSON.stringify(res, null, 2));
            process.exit(res.status === 'READY' ? 0 : 1);
        }
        if (cmd === 'verify') {
            const res = await (0, verification_js_1.verify)(cwd);
            console.log(JSON.stringify(res, null, 2));
            process.exit(res.status === 'VERIFIED' ? 0 : 1);
        }
        if (cmd === 'certify') {
            const res = await (0, verification_js_1.certify)(cwd);
            console.log(JSON.stringify(res, null, 2));
            process.exit(res.status === 'VERIFIED' ? 0 : 1);
        }
        if (cmd === 'retro') {
            const res = await (0, retro_js_1.retro)();
            console.log(JSON.stringify(res, null, 2));
            process.exit(0);
        }
        if (cmd === 'rotate-key') {
            const r = await (0, key_rotation_js_1.rotateKey)();
            console.log(JSON.stringify(r, null, 2));
            process.exit(0);
        }
        console.error('Unknown command', cmd);
        process.exit(2);
    }
    catch (e) {
        console.error('ERROR', e);
        process.exit(3);
    }
}
main();
//# sourceMappingURL=cli.js.map