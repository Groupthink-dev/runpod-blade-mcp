/**
 * RunPod pod write tools (all write-gated).
 *
 * runpod_pod_create  — POST /pods
 * runpod_pod_delete  — DELETE /pods/{id}
 * runpod_pod_start   — POST /pods/{id}/start
 * runpod_pod_stop    — POST /pods/{id}/stop
 * runpod_pod_restart — POST /pods/{id}/restart
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CreatePodSchema,
  DeletePodSchema,
  StartPodSchema,
  StopPodSchema,
  RestartPodSchema,
} from "../schemas/pods.js";
import { runpodRest } from "../services/runpod.js";
import { requireWrite } from "../utils/write-gate.js";
import { handleApiError } from "../utils/errors.js";

export function registerPodWriteTools(server: McpServer): void {
  // ─── Create pod ────────────────────────────────────────────────

  server.tool(
    "runpod_pod_create",
    "Create a new RunPod GPU pod. Requires a gpuTypeId from runpod_gpu_types. Write-gated: requires RUNPOD_WRITE_ENABLED=true and confirm=true.",
    CreatePodSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_pod_create");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const {
          confirm: _confirm,
          env,
          ...rest
        } = params;

        const body: Record<string, unknown> = { ...rest };

        // Convert env Record to RunPod's expected format
        if (env && Object.keys(env).length > 0) {
          body.env = env;
        }

        const res = await runpodRest("/pods", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = (await res.json()) as Record<string, unknown>;
        const podId = (data.id as string) || "unknown";

        return {
          content: [
            {
              type: "text" as const,
              text: `Pod created successfully.\nPod ID: ${podId}\nUse runpod_pod_get to check status.`,
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

  // ─── Delete pod ────────────────────────────────────────────────

  server.tool(
    "runpod_pod_delete",
    "Permanently delete a RunPod pod. This is irreversible — all data on the container disk is lost. Persistent volumes are preserved. Write-gated.",
    DeletePodSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_pod_delete");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await runpodRest(`/pods/${params.id}`, { method: "DELETE" });
        return {
          content: [
            {
              type: "text" as const,
              text: `Pod ${params.id} deleted successfully.`,
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

  // ─── Start pod ─────────────────────────────────────────────────

  server.tool(
    "runpod_pod_start",
    "Start a stopped RunPod pod. Optionally change the GPU count. Write-gated.",
    StartPodSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_pod_start");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const body: Record<string, unknown> = {};
        if (params.gpuCount != null) {
          body.gpuCount = params.gpuCount;
        }

        await runpodRest(`/pods/${params.id}/start`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Pod ${params.id} start requested. Use runpod_pod_get to check status.`,
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

  // ─── Stop pod ──────────────────────────────────────────────────

  server.tool(
    "runpod_pod_stop",
    "Stop a running RunPod pod. The pod retains its configuration and persistent volume. Write-gated.",
    StopPodSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_pod_stop");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await runpodRest(`/pods/${params.id}/stop`, {
          method: "POST",
          body: JSON.stringify({}),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Pod ${params.id} stop requested. Use runpod_pod_get to check status.`,
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

  // ─── Restart pod ───────────────────────────────────────────────

  server.tool(
    "runpod_pod_restart",
    "Restart a RunPod pod. Stops and starts the container without releasing the GPU. Write-gated.",
    RestartPodSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_pod_restart");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await runpodRest(`/pods/${params.id}/restart`, {
          method: "POST",
          body: JSON.stringify({}),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Pod ${params.id} restart requested. Use runpod_pod_get to check status.`,
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
