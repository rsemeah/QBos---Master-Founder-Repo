#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// packages/war-room/cli/index.ts
const status_1 = require("./commands/status");
const health_1 = require("./commands/health");
const regress_1 = require("./commands/regress");
const robby_1 = require("./commands/robby");
const cost_1 = require("./commands/cost");
const freeze_1 = require("./commands/freeze");
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command) {
        printHelp();
        return;
    }
    try {
        switch (command) {
            case 'status':
                await (0, status_1.statusCommand)();
                break;
            case 'health':
                await (0, health_1.healthCommand)();
                break;
            case 'regress':
                await (0, regress_1.regressCommand)(args[1]);
                break;
            case 'robby':
                await (0, robby_1.robbyCommand)(args[1], ...args.slice(2));
                break;
            case 'cost':
                await (0, cost_1.costCommand)(args[1], ...args.slice(2));
                break;
            case 'freeze':
                await (0, freeze_1.freezeCommand)(args[1], ...args.slice(2));
                break;
            case 'help':
            case '--help':
            case '-h':
                printHelp();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                console.log('Run "war-room help" for usage information');
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
function printHelp() {
    console.log(`
🏛️  War Room CLI - QuietBuild OS Operations Control

Usage: war-room <command> [options]

Commands:
  status              Show overall system status
  health              Run health check across all systems
  regress [profile]   Run regression tests (all or specific profile)
  robby <action>      Manage Robby PA autonomy
  cost <action>       Manage cost and routing
  freeze <action>     Freeze/unfreeze system operations

Examples:
  war-room status
  war-room health
  war-room regress default
  war-room robby status
  war-room robby downgrade 1 "High error rate"
  war-room cost status
  war-room cost set-cap 1000
  war-room freeze freeze "Deployment in progress"
  war-room freeze unfreeze

For detailed help on a specific command:
  war-room <command> --help
`);
}
main();
//# sourceMappingURL=index.js.map