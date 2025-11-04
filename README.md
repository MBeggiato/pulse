# Pulse - Docker Container Monitor

A lightweight, configurable Docker container monitoring tool with automatic discovery and flexible notification support.

## Features

✨ **Auto-Discovery** - Automatically detect and monitor containers via Docker labels  
🔄 **Live Config Reload** - Configuration changes are applied automatically  
🌍 **Multi-Language** - German and English support (easily extensible)  
⏱️ **Configurable Interval** - Set custom check intervals  
📢 **Flexible Notifications** - Webhook and ntfy support with smart timing  
🎯 **TypeScript** - Fully type-safe with Deno runtime

## Quick Start

```bash
# Clone repository
git clone <your-repo>
cd pulse

# Run
deno task start

# Development mode (auto-reload)
deno task dev
```

## Configuration

### config.json

```json
{
  "interval": 60,
  "locale": "en",
  "dateFormat": "en-US",
  "ntfyServer": "https://ntfy.sh",
  "autoDiscover": {
    "enabled": true,
    "labelKey": "pulse.monitor"
  },
  "checks": [
    {
      "name": "my-container",
      "notifiers": [
        {
          "type": "webhook",
          "url": "https://uptime.example.com/api/push/KEY",
          "method": "GET",
          "notifyOn": "always"
        }
      ]
    }
  ]
}
```

### Configuration Parameters

| Parameter               | Type    | Description                      | Default           |
| ----------------------- | ------- | -------------------------------- | ----------------- |
| `interval`              | number  | Check interval in seconds        | `60`              |
| `locale`                | string  | Language (`de` or `en`)          | `de`              |
| `dateFormat`            | string  | Date locale for formatting       | `de-DE`           |
| `ntfyServer`            | string  | Global ntfy server URL           | `https://ntfy.sh` |
| `autoDiscover.enabled`  | boolean | Enable auto-discovery via labels | `false`           |
| `autoDiscover.labelKey` | string  | Docker label name for discovery  | `pulse.monitor`   |
| `checks`                | array   | Manual container definitions     | `[]`              |

## Notifier Types

### Webhook (Generic)

Flexible HTTP webhook notifier supporting GET and POST requests.

```json
{
  "type": "webhook",
  "url": "https://webhook.example.com/endpoint",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN"
  },
  "bodyTemplate": "{\"container\":\"{name}\",\"status\":\"{status}\",\"timestamp\":\"{timestamp}\"}",
  "notifyOn": "change"
}
```

**Parameters:**

- `url` (required) - Webhook URL
- `method` - HTTP method: `GET` or `POST` (default: `POST`)
- `headers` - Custom HTTP headers (optional)
- `bodyTemplate` - JSON template for POST requests (optional)
- `notifyOn` - When to notify: `always` or `change` (default: `always`)

**Template Placeholders:**

- `{name}` - Container name
- `{status}` - `running` or `stopped`
- `{timestamp}` - ISO 8601 timestamp

**Uptime Kuma Example:**

```json
{
  "type": "webhook",
  "url": "https://uptime.example.com/api/push/KEY?status=up",
  "method": "GET",
  "notifyOn": "always"
}
```

### ntfy (Push Notifications)

Send push notifications via ntfy.sh or your own ntfy server.

```json
{
  "type": "ntfy",
  "topic": "container-alerts",
  "server": "https://ntfy.sh",
  "priority": "high",
  "tags": ["warning", "docker"],
  "notifyOn": "change"
}
```

**Parameters:**

- `topic` (required) - ntfy topic name
- `server` - ntfy server URL (default: global `ntfyServer` or `https://ntfy.sh`)
- `priority` - Priority level: `max`, `high`, `default`, `low`, `min` (default: `default`)
- `tags` - Array of emoji tags (optional)
- `notifyOn` - When to notify: `always` or `change` (default: `change`)

**Server Priority:**

1. `server` in notifier config (highest)
2. Global `ntfyServer` in config.json
3. `https://ntfy.sh` (fallback)

## Notification Timing

Control when notifications are sent using the `notifyOn` parameter.

### `always` - Every Check

Notifications are sent on every interval, regardless of status.

**Use cases:**

- Uptime Kuma heartbeat monitoring
- Health check endpoints expecting regular pings

**Example:**

```json
{
  "type": "webhook",
  "url": "https://uptime.example.com/push/KEY",
  "method": "GET",
  "notifyOn": "always"
}
```

### `change` - Status Changes Only

Notifications are sent only when container status changes (running ↔ stopped).

**Use cases:**

- Push notifications (ntfy, Slack, Discord)
- Alert-only webhooks

**Example:**

```json
{
  "type": "ntfy",
  "topic": "alerts",
  "priority": "high",
  "notifyOn": "change"
}
```

### Default Values

- **Webhook:** `always` (Uptime Kuma compatibility)
- **ntfy:** `change` (avoid notification spam)

## Auto-Discovery with Docker Labels

Containers can be automatically discovered and monitored using Docker labels.

### Label Formats

#### 1. Simple URL (Webhook GET)

Ideal for Uptime Kuma or simple GET webhooks:

```yaml
labels:
  - "pulse.monitor=https://status.example.com/api/push/KEY?status=up"
```

#### 2. JSON Object (Single Notifier)

For advanced webhook or ntfy configuration:

```yaml
# Webhook with POST
labels:
  - 'pulse.monitor={"type":"webhook","url":"https://webhook.example.com/alert","method":"POST","notifyOn":"change"}'

# ntfy with priority
labels:
  - 'pulse.monitor={"type":"ntfy","topic":"db-alerts","priority":"high","tags":["warning","database"]}'
```

#### 3. JSON Array (Multiple Notifiers)

For containers requiring multiple notifications:

```yaml
labels:
  - 'pulse.monitor=[{"type":"webhook","url":"https://uptime.example.com/push/KEY","method":"GET","notifyOn":"always"},{"type":"ntfy","topic":"critical","priority":"max","notifyOn":"change"}]'
```

### Docker Compose Examples

```yaml
version: "3.9"

services:
  # Simple format - Uptime Kuma
  web:
    image: nginx:alpine
    container_name: web
    labels:
      - "pulse.monitor=https://status.example.com/api/push/KEY"

  # Webhook with custom settings
  api:
    image: node:alpine
    container_name: api
    labels:
      - 'pulse.monitor={"type":"webhook","url":"https://n8n.example.com/webhook/api-alert","method":"POST","notifyOn":"change"}'

  # ntfy notification
  database:
    image: postgres:alpine
    container_name: database
    labels:
      - 'pulse.monitor={"type":"ntfy","topic":"db-alerts","priority":"high","tags":["warning","database"]}'

  # Multiple notifiers
  critical-service:
    image: redis:alpine
    container_name: cache
    labels:
      - 'pulse.monitor=[{"type":"webhook","url":"https://uptime.example.com/push/KEY","method":"GET","notifyOn":"always"},{"type":"ntfy","topic":"critical","priority":"max","notifyOn":"change"}]'
```

See `sample-container.yml` for more examples.

## Internationalization

Translations are stored in `locales.json`. Add new languages easily:

```json
{
  "de": { "app_started": "Monitor gestartet", ... },
  "en": { "app_started": "Monitor started", ... },
  "fr": { "app_started": "Moniteur démarré", ... }
}
```

## Permissions

Pulse requires the following Deno permissions:

- `--allow-read` - Read configuration and translations
- `--allow-run=docker` - Execute Docker commands
- `--allow-net` - Send HTTP notifications

## Development

```bash
# Run with auto-reload
deno task dev

# Run tests
deno test

# Format code
deno fmt

# Type check
deno check main.ts
```

## Project Structure

```
pulse/
├── main.ts               # Entry point
├── types.ts              # TypeScript interfaces
├── config.ts             # Configuration management
├── i18n.ts               # Internationalization
├── docker.ts             # Docker operations & auto-discovery
├── notifiers.ts          # Notification implementations
├── checker.ts            # Check orchestration
├── state.ts              # Container state tracking
├── config.json           # Configuration
├── config.example.json   # Example configuration
├── locales.json          # Translations
└── sample-container.yml  # Docker Compose examples
```

## License

MIT
