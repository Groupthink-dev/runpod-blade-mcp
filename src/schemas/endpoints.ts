import { z } from "zod";
import { ConfirmSchema } from "./common.js";

/** List endpoints — GET /endpoints */
export const ListEndpointsSchema = z.object({});

/** Get single endpoint — GET /endpoints/{id} */
export const GetEndpointSchema = z.object({
  id: z.string().min(1).describe("Endpoint ID."),
});

/** Create endpoint — POST /endpoints */
export const CreateEndpointSchema = ConfirmSchema.extend({
  name: z.string().min(1).describe("Endpoint name."),
  templateId: z
    .string()
    .min(1)
    .describe("Template ID (from runpod_template_list)."),
  gpuIds: z
    .string()
    .min(1)
    .describe('GPU type IDs for workers. Example: "AMPERE_24" or "NVIDIA GeForce RTX 4090".'),
  workersMin: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Minimum active workers. Set to 0 for scale-to-zero (default: 0)."),
  workersMax: z
    .number()
    .int()
    .min(1)
    .default(3)
    .describe("Maximum active workers (default: 3)."),
  idleTimeout: z
    .number()
    .int()
    .min(5)
    .default(300)
    .describe("Idle timeout in seconds before scaling down (default: 300)."),
  scalerType: z
    .enum(["QUEUE_DELAY", "REQUEST_COUNT"])
    .default("QUEUE_DELAY")
    .describe('Autoscaler type: "QUEUE_DELAY" (default) or "REQUEST_COUNT".'),
  scalerValue: z
    .number()
    .int()
    .default(4)
    .describe("Scaler threshold value (default: 4)."),
});

/** Update endpoint — PATCH /endpoints/{id} */
export const UpdateEndpointSchema = ConfirmSchema.extend({
  id: z.string().min(1).describe("Endpoint ID to update."),
  name: z.string().optional().describe("Updated name."),
  gpuIds: z.string().optional().describe("Updated GPU type IDs."),
  workersMin: z.number().int().min(0).optional().describe("Updated minimum workers."),
  workersMax: z.number().int().min(1).optional().describe("Updated maximum workers."),
  idleTimeout: z.number().int().min(5).optional().describe("Updated idle timeout in seconds."),
  scalerType: z.enum(["QUEUE_DELAY", "REQUEST_COUNT"]).optional().describe("Updated scaler type."),
  scalerValue: z.number().int().optional().describe("Updated scaler threshold."),
});

/** Delete endpoint — DELETE /endpoints/{id} */
export const DeleteEndpointSchema = ConfirmSchema.extend({
  id: z.string().min(1).describe("Endpoint ID to delete."),
});
