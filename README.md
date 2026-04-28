# RunPod Blade MCP

A GPU compute MCP server for RunPod. 19 tools for managing GPU pods, serverless endpoints, job queues, and account resources — with token-efficient defaults and dual safety gates on every write operation.

Implements both the [`virtualisation-v1`](https://github.com/Groupthink-dev/stallari-pack-spec) (pods) and [`serverless-v1`](https://github.com/Groupthink-dev/stallari-pack-spec) (endpoints/jobs) service contracts — the first blade to cover both.

## Why another RunPod MCP?

RunPod's own [`@runpod/mcp-server`](https://github.com/runpod/mcp-server) has 43 tools and works fine for direct API access. This blade exists for a different reason: **contract-based GPU orchestration**.

| | `@runpod/mcp-server` | `runpod-blade-mcp` |
|---|---|---|
| Tools | 43 (full API surface) | 19 (curated for agent workflows) |
| Write safety | None — any tool fires immediately | Dual gate: env var + per-call confirm |
| Response size | Raw API JSON (~2-4k tokens/pod) | Formatted summaries (~800 tokens/pod) |
| Service contracts | None | `virtualisation-v1` + `serverless-v1` |
| Transport | stdio only | stdio + Streamable HTTP |
| Provider swap | RunPod-specific prompts | Same contract as Vultr, Vast.ai |

If you just need RunPod tools, the official server is simpler. If you're building an agent that provisions GPU compute across providers — or you want safety gates on operations that incur charges — this blade is the better fit.

## Why Blade MCP?

The `-blade-mcp` suffix identifies this as part of the [Blade MCP](https://github.com/Groupthink-dev) family — purpose-built MCP servers with:

- **Service contracts** — implements `virtualisation-v1` and `serverless-v1` so agentic platforms can swap between GPU providers (Vultr, Vast.ai, RunPod) without rewriting prompts.
- **Token efficiency** — formatters strip ~60% of raw API response. A pod summary shows GPU model, cost/hr, and uptime — not 50+ fields of metadata.
- **Dual write gates** — environment variable + per-call confirmation on all destructive operations. Creating pods and submitting jobs incurs charges immediately; accidental invocations are expensive.
- **Dual transport** — stdio for local use, Streamable HTTP for remote and always-on deployment.

Other blades: [vultr-blade-mcp](https://github.com/Groupthink-dev/vultr-blade-mcp) (50 tools), [vastai-blade-mcp](https://github.com/Groupthink-dev/vastai-blade-mcp) (16 tools), [cloudflare-blade-mcp](https://github.com/Groupthink-dev/cloudflare-blade-mcp) (53 tools), and more.

## Quick Start

### Install

```bash
git clone https://github.com/Groupthink-dev/runpod-blade-mcp.git
cd runpod-blade-mcp
npm install && npm run build
```

### Configure

```bash
# Required — get your API key at https://www.runpod.io/console/user/settings
export RUNPOD_API_KEY="your-api-key"

# Required for write operations (create/delete pods, submit jobs, manage endpoints)
export RUNPOD_WRITE_ENABLED="true"
```

### Run

```bash
# stdio (default — for Claude Code, Claude Desktop)
node dist/index.js

# HTTP (for remote access, tunnels, always-on deployment)
TRANSPORT=http PORT=8782 node dist/index.js
```

### Claude Desktop config

```json
{
  "mcpServers": {
    "runpod": {
      "command": "node",
      "args": ["/path/to/runpod-blade-mcp/dist/index.js"],
      "env": {
        "RUNPOD_API_KEY": "your-api-key",
        "RUNPOD_WRITE_ENABLED": "true"
      }
    }
  }
}
```

## Tools (19)

### Pods (8)

| Tool | Description |
|------|-------------|
| `runpod_pod_list` | List your GPU pods with status, GPU spec, pricing, and uptime |
| `runpod_pod_get` | Get detailed pod info including GPU utilisation and cost |
| `runpod_pod_create` | Create a new GPU pod (write-gated, incurs charges) |
| `runpod_pod_delete` | Permanently destroy a pod (write-gated, irreversible) |
| `runpod_pod_start` | Start a stopped pod (write-gated) |
| `runpod_pod_stop` | Stop a running pod (write-gated) |
| `runpod_pod_restart` | Restart a pod without losing data (write-gated) |
| `runpod_gpu_types` | List available GPU types with pricing and availability |

### Serverless Endpoints (5)

| Tool | Description |
|------|-------------|
| `runpod_endpoint_list` | List serverless endpoints with worker counts and scaling config |
| `runpod_endpoint_get` | Get detailed endpoint info including GPU assignments |
| `runpod_endpoint_create` | Create a new serverless endpoint (write-gated) |
| `runpod_endpoint_update` | Update endpoint scaling, workers, or GPU config (write-gated) |
| `runpod_endpoint_delete` | Delete an endpoint and terminate workers (write-gated) |

### Serverless Jobs (4)

| Tool | Description |
|------|-------------|
| `runpod_job_run` | Submit an async job, returns job ID for polling (write-gated) |
| `runpod_job_runsync` | Submit a sync job, blocks until completion ~90s (write-gated) |
| `runpod_job_status` | Check job status, output, and execution time |
| `runpod_job_cancel` | Cancel a pending or running job (write-gated) |

### Account (2)

| Tool | Description |
|------|-------------|
| `runpod_account_info` | Account details, balance, and spending limits |
| `runpod_template_list` | List serverless templates (needed for endpoint creation) |

## Architecture

```
src/
├── index.ts              # Entry point (stdio/HTTP dual transport)
├── server.ts             # McpServer creation, registers all 19 tools
├── constants.ts          # Three API base URLs, defaults, env var names
├── services/
│   ├── runpod.ts         # API client: REST, GraphQL, Jobs (3 fetch fns)
│   └── auth.ts           # Bearer token middleware for HTTP transport
├── schemas/
│   ├── common.ts         # ConfirmSchema
│   ├── pods.ts           # Pod CRUD schemas
│   ├── endpoints.ts      # Endpoint CRUD schemas
│   ├── jobs.ts           # Job run/status/cancel schemas
│   └── account.ts        # Account, GPU types, template schemas
├── formatters/
│   ├── pod.ts            # Pod → PodSummary (14 fields)
│   ├── endpoint.ts       # Endpoint → EndpointSummary (10 fields)
│   ├── gpu.ts            # GPU type → GpuTypeSummary (8 fields)
│   └── account.ts        # Account + template formatters
├── tools/
│   ├── pods-read.ts      # List, get pod
│   ├── pods-write.ts     # Create, delete, start, stop, restart
│   ├── endpoints.ts      # Endpoint CRUD (3 write-gated)
│   ├── jobs.ts           # Job run, runsync, status, cancel
│   └── account.ts        # Account info, GPU types, templates
└── utils/
    ├── errors.ts         # API error → actionable message
    ├── write-gate.ts     # Dual write gate (env var + confirm)
    └── pagination.ts     # Response truncation
```

RunPod uses three separate API bases:

| API | Base URL | Used for |
|-----|----------|----------|
| REST | `rest.runpod.io/v1` | Pods, endpoints, templates |
| GraphQL | `api.runpod.io/graphql` | GPU types, account info |
| Serverless Jobs | `api.runpod.ai/v2` | Job submission, status, cancel |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RUNPOD_API_KEY` | Yes | RunPod API key |
| `RUNPOD_WRITE_ENABLED` | For writes | Set to `true` to enable write operations |
| `MCP_API_TOKEN` | No | Bearer token for HTTP transport auth |
| `TRANSPORT` | No | `stdio` (default) or `http` |
| `PORT` | No | HTTP port (default: 8782) |

## Write Safety

Every destructive operation is double-gated:

1. **Environment gate**: `RUNPOD_WRITE_ENABLED=true` must be set
2. **Per-call gate**: `confirm: true` must be passed in the tool input

Both gates must pass. This prevents accidental GPU provisioning (which incurs charges immediately) while keeping read operations frictionless.

## RunPod Concepts

RunPod offers two compute models:

- **GPU Pods** — on-demand or spot GPU VMs. You pick a GPU type, container image, and disk size. Billed per hour while running.
- **Serverless Endpoints** — autoscaling GPU inference. You deploy a template, configure workers and scaling policy, then submit jobs. Billed per second of execution time.

The serverless workflow is: create a template (via RunPod console) → `runpod_endpoint_create` with that template → `runpod_job_run` to submit work → `runpod_job_status` to poll results.

## Development

```bash
npm run dev          # tsx watch (stdio)
npm run dev:http     # tsx watch (HTTP on port 8782)
npm run typecheck    # tsc --noEmit
npm test             # vitest (26 tests)
```

## License

MIT
