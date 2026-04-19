import { z } from "zod";
import { ConfirmSchema } from "./common.js";

/** Submit async job — POST /v2/{endpointId}/run */
export const RunJobSchema = ConfirmSchema.extend({
  endpointId: z
    .string()
    .min(1)
    .describe("Serverless endpoint ID."),
  input: z
    .record(z.unknown())
    .describe("Job input payload (passed to the handler function)."),
  webhook: z
    .string()
    .url()
    .optional()
    .describe("Webhook URL for job completion notification."),
});

/** Submit sync job — POST /v2/{endpointId}/runsync */
export const RunSyncJobSchema = ConfirmSchema.extend({
  endpointId: z
    .string()
    .min(1)
    .describe("Serverless endpoint ID."),
  input: z
    .record(z.unknown())
    .describe("Job input payload (passed to the handler function)."),
});

/** Get job status — GET /v2/{endpointId}/status/{jobId} */
export const JobStatusSchema = z.object({
  endpointId: z
    .string()
    .min(1)
    .describe("Serverless endpoint ID."),
  jobId: z
    .string()
    .min(1)
    .describe("Job ID (returned by runpod_job_run or runpod_job_runsync)."),
});

/** Cancel job — POST /v2/{endpointId}/cancel/{jobId} */
export const CancelJobSchema = ConfirmSchema.extend({
  endpointId: z
    .string()
    .min(1)
    .describe("Serverless endpoint ID."),
  jobId: z
    .string()
    .min(1)
    .describe("Job ID to cancel."),
});
