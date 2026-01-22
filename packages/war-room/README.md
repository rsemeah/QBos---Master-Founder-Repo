# War Room

**Internal Operations Control Plane for QuietBuild OS**

War Room is the operator-only command center for monitoring, controlling, and safeguarding the QuietBuild OS system. It provides real-time visibility into system health, enables emergency interventions, and enforces operational boundaries.

## Philosophy

- **Operator-Only**: Never exposed to end users
- **Read-First**: Observability before control
- **Receipt-Backed**: Every operation emits a TruthSerum receipt
- **CLI-First**: Terminal-native experience
- **Local-First**: Works without Supabase (local receipt fallback)

## Features

### 🏥 Health Monitoring
- **Constitutional Health**: TruthSerum receipt rate, drift detection, verification attempts
- **Engine Health**: Error rates, fallback rates, last successful action per engine
- **Robby PA Health**: Autonomy level, blocked actions, human interrupts, scope compliance
- **Cost Health**: Spend rate, budget tracking, kill thresholds

### 🧪 Regression Testing
- Golden bundle comparison
- Profile-based test execution
- Diff detection and severity classification
- Nightly automated runs via GitHub Actions

### 💰 Cost Controls
- Budget caps with warning and kill thresholds
- Routing overrides (force specific model to reduce cost)
- Real-time spend rate monitoring
- Projected monthly cost tracking

### 🤖 Robby PA Controls
- Autonomy level management (0-4)
- Emergency downgrade/kill-switch
- Scope violation tracking
- Confidence delta monitoring

### ❄️ Emergency Controls
- System freeze (halt all operations)
- Emergency stop (freeze + critical alert)
- Receipt-backed freeze audit trail

## CLI Commands

```bash
# System status
war-room status

# Health check
war-room health

# Regression testing
war-room regress                # Run all profiles
war-room regress default        # Run specific profile

# Robby PA management
war-room robby status
war-room robby downgrade 1 "High error rate detected"
war-room robby upgrade 3 "System stable"
war-room robby kill "Emergency stop"

# Cost management
war-room cost status
war-room cost set-cap 1000
war-room cost override gpt-3.5-turbo "Cost reduction"
war-room cost clear-override

# Emergency controls
war-room freeze status
war-room freeze freeze "Deployment in progress"
war-room freeze unfreeze
war-room freeze emergency "Critical security issue"
```

## Architecture

```
packages/war-room/
├── src/
│   ├── types.ts           # Core type definitions
│   ├── ingest/            # Event normalization
│   ├── health/            # Health monitoring
│   ├── regression/        # Regression testing
│   ├── cost/              # Cost tracking and controls
│   ├── robby/             # Robby PA monitoring
│   └── controls/          # Emergency controls
├── cli/
│   ├── commands/          # CLI command implementations
│   └── index.ts           # CLI entry point
└── package.json
```

## Integration Points

### TruthSerum
All War Room operations emit receipts:
- `health.check.completed`
- `ops.event.ingested`
- `regression.run.completed`
- `robby.autonomy.downgraded`
- `cost.cap.updated`
- `system.frozen`

### Robby CLI
War Room extends Robby CLI with:
- `robby war-room status`
- `robby war-room freeze`
- Emergency interventions

### ExecutionEngine
War Room monitors:
- Action success/failure rates
- Engine error rates
- Fallback invocations

### SilentEngine
War Room tracks:
- Model routing decisions
- Cost per invocation
- Budget compliance

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm -C packages/war-room build

# Type check
pnpm -C packages/war-room typecheck

# Run CLI
pnpm -C packages/war-room war-room status
```

## Database Schema

War Room uses Supabase for persistence:
- `war_room_events`: All ingested operational events
- `war_room_health_snapshots`: Periodic health check results
- `war_room_regression_results`: Regression test results
- `war_room_freeze_log`: Freeze/unfreeze audit trail

See `supabase/migrations/20260121000000_create_war_room_tables.sql` for full schema.

## Future Enhancements (Phase 2)

- **Change Impact Analysis**: Correlate commits with health degradation
- **Drift Detection**: Alert when system behavior diverges from golden bundle
- **Runbook Automation**: Auto-remediation for common failure patterns
- **Real-time Streaming Dashboard**: Web UI for War Room metrics

## License

MIT
