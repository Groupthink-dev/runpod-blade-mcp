/**
 * RunPod account, GPU types, and template tools.
 *
 * runpod_account_info  — GraphQL query { myself }
 * runpod_gpu_types     — GraphQL query { gpuTypes }
 * runpod_template_list — GET /templates
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountInfoSchema, GpuTypesSchema, TemplateListSchema } from "../schemas/account.js";
import { formatAccount, formatTemplates } from "../formatters/account.js";
import { formatGpuTypes } from "../formatters/gpu.js";
import { runpodGraphql, runpodRest } from "../services/runpod.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerAccountTools(server: McpServer): void {
  // ─── Account info ──────────────────────────────────────────────

  server.tool(
    "runpod_account_info",
    "Get RunPod account information including balance and current GPU spend.",
    AccountInfoSchema.shape,
    async () => {
      try {
        const data = await runpodGraphql<{ myself: Record<string, unknown> }>(
          `query {
            myself {
              id
              email
              currentBalance
              currentSpendPerHr
              maxServerlessConcurrency
              clientBalance
            }
          }`
        );

        const formatted = formatAccount(data.myself);
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

  // ─── GPU types ─────────────────────────────────────────────────

  server.tool(
    "runpod_gpu_types",
    "List available RunPod GPU types with VRAM, pricing, and availability. Use gpuTypeId from results when creating pods.",
    GpuTypesSchema.shape,
    async (params) => {
      try {
        const data = await runpodGraphql<{ gpuTypes: Record<string, unknown>[] }>(
          `query {
            gpuTypes {
              id
              displayName
              memoryInGb
              secureCloud
              communityCloud
              lowestPrice {
                minimumBidPrice
                uninterruptablePrice
              }
            }
          }`
        );

        let gpuTypes = data.gpuTypes || [];

        // Apply memory filter
        if (params.memoryMin) {
          gpuTypes = gpuTypes.filter(
            (g) => ((g.memoryInGb as number) || 0) >= params.memoryMin!
          );
        }

        // Apply cloud type filter
        if (params.cloudType !== "ALL") {
          const field = params.cloudType === "SECURE" ? "secureCloud" : "communityCloud";
          gpuTypes = gpuTypes.filter((g) => g[field] === true);
        }

        if (gpuTypes.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No GPU types found matching your filters. Try reducing memoryMin or changing cloudType.",
              },
            ],
          };
        }

        const formatted = formatGpuTypes(gpuTypes);
        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(
                `${gpuTypes.length} GPU type(s):\n\n${JSON.stringify(formatted, null, 2)}`
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

  // ─── Template list ─────────────────────────────────────────────

  server.tool(
    "runpod_template_list",
    "List RunPod templates (pre-configured Docker images). Use templateId from results when creating serverless endpoints.",
    TemplateListSchema.shape,
    async () => {
      try {
        const res = await runpodRest("/templates");
        const data = (await res.json()) as Record<string, unknown>[] | Record<string, unknown>;
        const templates = Array.isArray(data) ? data : (data as Record<string, unknown>).templates as Record<string, unknown>[] || [];

        if (templates.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No templates found.",
              },
            ],
          };
        }

        const formatted = formatTemplates(templates);
        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(
                `${templates.length} template(s):\n\n${JSON.stringify(formatted, null, 2)}`
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
}
