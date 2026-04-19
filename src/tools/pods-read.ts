/**
 * RunPod pod read tools.
 *
 * runpod_pod_list — GET /pods
 * runpod_pod_get  — GET /pods/{id}
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListPodsSchema, GetPodSchema } from "../schemas/pods.js";
import { formatPods, formatPod } from "../formatters/pod.js";
import { runpodRest } from "../services/runpod.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerPodReadTools(server: McpServer): void {
  // ─── List pods ─────────────────────────────────────────────────

  server.tool(
    "runpod_pod_list",
    "List your RunPod GPU pods with status, GPU spec, pricing, and image info.",
    ListPodsSchema.shape,
    async () => {
      try {
        const res = await runpodRest("/pods");
        const data = (await res.json()) as Record<string, unknown>[] | Record<string, unknown>;

        // API may return array directly or wrapped
        const pods = Array.isArray(data) ? data : (data as Record<string, unknown>).pods as Record<string, unknown>[] || [];

        if (pods.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No pods found. Use runpod_gpu_types to browse available GPUs, then runpod_pod_create to launch one.",
              },
            ],
          };
        }

        const formatted = formatPods(pods);
        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(
                `${pods.length} pod(s):\n\n${JSON.stringify(formatted, null, 2)}`
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

  // ─── Get single pod ────────────────────────────────────────────

  server.tool(
    "runpod_pod_get",
    "Get detailed information about a specific RunPod pod including GPU utilisation, status, and pricing.",
    GetPodSchema.shape,
    async (params) => {
      try {
        const res = await runpodRest(`/pods/${params.id}`);
        const data = (await res.json()) as Record<string, unknown>;
        const formatted = formatPod(data);

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
}
