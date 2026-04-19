/**
 * RunPod serverless endpoint tools.
 *
 * runpod_endpoint_list   — GET /endpoints
 * runpod_endpoint_get    — GET /endpoints/{id}
 * runpod_endpoint_create — POST /endpoints (write-gated)
 * runpod_endpoint_update — PATCH /endpoints/{id} (write-gated)
 * runpod_endpoint_delete — DELETE /endpoints/{id} (write-gated)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListEndpointsSchema,
  GetEndpointSchema,
  CreateEndpointSchema,
  UpdateEndpointSchema,
  DeleteEndpointSchema,
} from "../schemas/endpoints.js";
import { formatEndpoints, formatEndpoint } from "../formatters/endpoint.js";
import { runpodRest } from "../services/runpod.js";
import { requireWrite } from "../utils/write-gate.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerEndpointTools(server: McpServer): void {
  // ─── List endpoints ────────────────────────────────────────────

  server.tool(
    "runpod_endpoint_list",
    "List your RunPod serverless endpoints with worker counts, scaling config, and GPU assignments.",
    ListEndpointsSchema.shape,
    async () => {
      try {
        const res = await runpodRest("/endpoints");
        const data = (await res.json()) as Record<string, unknown>[] | Record<string, unknown>;
        const endpoints = Array.isArray(data) ? data : (data as Record<string, unknown>).endpoints as Record<string, unknown>[] || [];

        if (endpoints.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No serverless endpoints found. Use runpod_endpoint_create to deploy one.",
              },
            ],
          };
        }

        const formatted = formatEndpoints(endpoints);
        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(
                `${endpoints.length} endpoint(s):\n\n${JSON.stringify(formatted, null, 2)}`
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── Get endpoint ──────────────────────────────────────────────

  server.tool(
    "runpod_endpoint_get",
    "Get detailed information about a specific RunPod serverless endpoint.",
    GetEndpointSchema.shape,
    async (params) => {
      try {
        const res = await runpodRest(`/endpoints/${params.id}`);
        const data = (await res.json()) as Record<string, unknown>;
        const formatted = formatEndpoint(data);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── Create endpoint ───────────────────────────────────────────

  server.tool(
    "runpod_endpoint_create",
    "Create a new RunPod serverless endpoint. Requires a templateId from runpod_template_list. Write-gated.",
    CreateEndpointSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_endpoint_create");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const { confirm: _confirm, ...body } = params;

        const res = await runpodRest("/endpoints", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = (await res.json()) as Record<string, unknown>;
        const endpointId = (data.id as string) || "unknown";

        return {
          content: [
            {
              type: "text" as const,
              text: `Endpoint created successfully.\nEndpoint ID: ${endpointId}\nUse runpod_endpoint_get to check status, or runpod_job_run to submit jobs.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── Update endpoint ───────────────────────────────────────────

  server.tool(
    "runpod_endpoint_update",
    "Update a RunPod serverless endpoint's configuration (workers, scaling, GPU assignments). Write-gated.",
    UpdateEndpointSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_endpoint_update");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const { confirm: _confirm, id, ...updates } = params;

        // Only include fields that were provided
        const body: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) {
            body[key] = value;
          }
        }

        await runpodRest(`/endpoints/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Endpoint ${id} updated successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── Delete endpoint ───────────────────────────────────────────

  server.tool(
    "runpod_endpoint_delete",
    "Delete a RunPod serverless endpoint. Any running workers will be terminated. Write-gated.",
    DeleteEndpointSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_endpoint_delete");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await runpodRest(`/endpoints/${params.id}`, { method: "DELETE" });
        return {
          content: [
            {
              type: "text" as const,
              text: `Endpoint ${params.id} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );
}
