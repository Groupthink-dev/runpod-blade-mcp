import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPodReadTools } from "./tools/pods-read.js";
import { registerPodWriteTools } from "./tools/pods-write.js";
import { registerAccountTools } from "./tools/account.js";
import { registerEndpointTools } from "./tools/endpoints.js";
import { registerJobTools } from "./tools/jobs.js";

/**
 * Creates and configures the MCP server with all RunPod tools registered.
 *
 * 19 tools total:
 *   Pods (8):      runpod_pod_list, runpod_pod_get, runpod_pod_create,
 *                  runpod_pod_delete, runpod_pod_start, runpod_pod_stop,
 *                  runpod_pod_restart, runpod_gpu_types
 *   Endpoints (5): runpod_endpoint_list, runpod_endpoint_get, runpod_endpoint_create,
 *                  runpod_endpoint_update, runpod_endpoint_delete
 *   Jobs (4):      runpod_job_run, runpod_job_runsync, runpod_job_status,
 *                  runpod_job_cancel
 *   Account (2):   runpod_account_info, runpod_template_list
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "runpod-blade-mcp",
    version: "0.1.0",
  });

  // Pods — read
  registerPodReadTools(server);

  // Pods — write (gated)
  registerPodWriteTools(server);

  // Account, GPU types, templates
  registerAccountTools(server);

  // Endpoints — CRUD (3 write-gated)
  registerEndpointTools(server);

  // Jobs — run, runsync, status, cancel (3 write-gated)
  registerJobTools(server);

  return server;
}
