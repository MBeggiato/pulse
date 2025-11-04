# Pulse - Docker Container Monitor - AI Agent Instructions

## Architecture Overview

Pulse is a **Deno/TypeScript** application that monitors Docker containers and sends notifications. The system has two input sources:

1. **Manual config** (`config.json`) - explicitly defined containers
2. **Auto-discovery** - containers with Docker labels (`pulse.monitor`)

**Data flow**: `main.ts` → `checker.ts` → `docker.ts` (status check) → `notifiers.ts` (send alerts) → external services

## Core Components

- **types.ts** - Central type definitions (Config, Notifier types, Check)
- **main.ts** - Entry point: loads translations, config, starts interval timer
- **checker.ts** - Orchestration: merges manual + auto-discovered containers, decides when to notify
- **docker.ts** - Docker integration: status checks via `docker ps`, auto-discovery via labels
- **notifiers.ts** - Notification dispatch: webhook (GET/POST), ntfy push
- **state.ts** - In-memory state tracking for status change detection
- **config.ts** - Config loading with live file watching
- **i18n.ts** - Translation system (de/en)

## Critical Patterns

### Notification Timing Logic (`checker.ts`)

```typescript
const defaultNotifyOn = notifier.type === "webhook" ? "always" : "change";
```

**Why**: Webhooks default to "always" for Uptime Kuma heartbeats; ntfy defaults to "change" to avoid spam.

### Auto-Discovery Label Parsing (`docker.ts`)

Supports **3 formats**:

1. Simple URL: `pulse.monitor=https://uptime.example.com/push/KEY`
2. JSON object: `pulse.monitor={"type":"webhook","url":"...","notifyOn":"change"}`
3. JSON array: `pulse.monitor=[{...},{...}]` (multiple notifiers)

**Critical**: Always try JSON parsing first (detects `[` or `{`), fallback to URL format.

### Config Merge Strategy (`checker.ts`)

```typescript
const manualNames = new Set(config.checks.map((c) => c.name));
const newChecks = discoveredChecks.filter((c) => !manualNames.has(c.name));
```

**Why**: Manual config takes precedence over auto-discovered containers (avoids duplicates).

## Development Workflow

### Required Permissions

```bash
--allow-read        # Config and translations
--allow-run=docker  # Docker CLI commands
--allow-net         # HTTP notifications
```

### Commands

```bash
deno task dev      # Run with auto-reload
deno task start    # Production run
deno check main.ts # Type checking
deno fmt           # Format code
```

### Docker Deployment

- `Dockerfile` includes `docker-cli` package (Alpine APK)
- Container needs `/var/run/docker.sock` mounted to monitor other containers
- Uses `config.json` volume mount (read-only)

## Type System Conventions

### Notifier Types

All notifiers extend from discriminated union:

```typescript
type Notifier = WebhookNotifier | NtfyNotifier;
```

**Always include**:

- `type: "webhook" | "ntfy"` (discriminator)
- `notifyOn?: "always" | "change"` (optional, has type-specific defaults)

### Template Placeholders (Webhook)

Only 3 placeholders in `bodyTemplate`:

- `{name}` - Container name
- `{status}` - "running" or "stopped"
- `{timestamp}` - ISO 8601 timestamp

## Common Gotchas

1. **State is in-memory only** - Container restart loses status history
2. **First check always notifies** (even with `notifyOn: "change"`) - needed for initial state
3. **Docker label values must be valid JSON or plain URL** - no partial JSON support
4. **Global `ntfyServer` can be overridden per-notifier** - 3-level priority: notifier > global > default
5. **Config reload is live** - `watchConfig` updates config reference in-place during interval

## Testing Container Discovery

```bash
# Add label to container
docker run -d --label pulse.monitor='{"type":"ntfy","topic":"test"}' nginx

# Check what Pulse sees
docker ps -a --filter "label=pulse.monitor" --format '{{.Names}}\t{{.Label "pulse.monitor"}}'
```

## When Adding New Features

- **New notifier type**: Add to `types.ts`, implement in `notifiers.ts`, update `notify()` switch
- **New config option**: Add to `Config` interface, provide default in code comments
- **New translation**: Add to both `de` and `en` sections in `locales.json`
- **New Docker feature**: Ensure it works in containerized mode (test with mounted socket)

## File Naming Convention

- `*.ts` - TypeScript modules (no default exports, named exports only)
- `main.ts` - Only file with `if (import.meta.main)` guard
- No barrel exports - import directly from module files
