/**
 * RunPod serverless job tools.
 *
 * runpod_job_run     — POST /v2/{endpointId}/run (async)
 * runpod_job_runsync — POST /v2/{endpointId}/runsync (sync, blocks)
 * runpod_job_status  — GET /v2/{endpointId}/status/{jobId}
 * runpod_job_cancel  — POST /v2/{endpointId}/cancel/{jobId}
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  RunJobSchema,
  RunSyncJobSchema,
  JobStatusSchema,
  CancelJobSchema,
} from "../schemas/jobs.js";
import { runpodJobs } from "../services/runpod.js";
import { requireWrite } from "../utils/write-gate.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerJobTools(server: McpServer): void {
  // ─── Submit async job ──────────────────────────────────────────

  server.tool(
    "runpod_job_run",
    "Submit an asynchronous job to a RunPod serverless endpoint. Returns a job ID for status polling. Write-gated (consumes GPU compute).",
    RunJobSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_job_run");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const body: Record<string, unknown> = { input: params.input };
        if (params.webhook) {
          body.webhook = params.webhook;
        }

        const res = await runpodJobs(params.endpointId, "/run", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = (await res.json()) as Record<string, unknown>;

        return {
          content: [
            {
              type: "text" as const,
              text: `Job submitted successfully.\nJob ID: ${data.id}\nStatus: ${data.status}\nUse runpod_job_status to check progress.`,
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

  // ─── Submit sync job ───────────────────────────────────────────

  server.tool(
    "runpod_job_runsync",
    "Submit a synchronous job to a RunPod serverless endpoint. Blocks until completion (up to ~90s). Write-gated.",
    RunSyncJobSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_job_runsync");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const res = await runpodJobs(params.endpointId, "/runsync", {
          method: "POST",
          body: JSON.stringify({ input: params.input }),
        });

        const data = (await res.json()) as Record<string, unknown>;

        const result: Record<string, unknown> = {
          id: data.id,
          status: data.status,
        };

        if (data.output !== undefined) {
          result.output = data.output;
        }
        if (data.executionTime !== undefined) {
          result.executionTime = `${((data.executionTime as number) / 1000).toFixed(2)}s`;
        }
        if (data.error) {
          result.error = data.error;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(JSON.stringify(result, null, 2)),
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

  // ─── Get job status ────────────────────────────────────────────

  server.tool(
    "runpod_job_status",
    "Check the status of a RunPod serverless job. Returns status, output (if complete), and execution time.",
    JobStatusSchema.shape,
    async (params) => {
      try {
        const res = await runpodJobs(
          params.endpointId,
          `/status/${params.jobId}`,
          { method: "GET" }
        );

        const data = (await res.json()) as Record<string, unknown>;

        const result: Record<string, unknown> = {
          id: data.id,
          status: data.status,
        };

        if (data.output !== undefined) {
          result.output = data.output;
        }
        if (data.executionTime !== undefined) {
          result.executionTime = `${((data.executionTime as number) / 1000).toFixed(2)}s`;
        }
        if (data.delayTime !== undefined) {
          result.delayTime = `${((data.delayTime as number) / 1000).toFixed(2)}s`;
        }
        if (data.error) {
          result.error = data.error;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(JSON.stringify(result, null, 2)),
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

  // ─── Cancel job ────────────────────────────────────────────────

  server.tool(
    "runpod_job_cancel",
    "Cancel a pending or running RunPod serverless job. Write-gated.",
    CancelJobSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "runpod_job_cancel");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await runpodJobs(
          params.endpointId,
          `/cancel/${params.jobId}`,
          { method: "POST", body: JSON.stringify({}) }
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Job ${params.jobId} cancel requested.`,
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
