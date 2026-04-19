import { z } from "zod";
import { ConfirmSchema } from "./common.js";

/** List pods — GET /pods */
export const ListPodsSchema = z.object({});

/** Get single pod — GET /pods/{id} */
export const GetPodSchema = z.object({
  id: z.string().min(1).describe("Pod ID."),
});

/** Create pod — POST /pods */
export const CreatePodSchema = ConfirmSchema.extend({
  name: z.string().min(1).describe("Pod name."),
  imageName: z
    .string()
    .min(1)
    .describe('Docker image to deploy (e.g., "runpod/pytorch:2.1.0-py3.10-cuda12.1.0-devel").'),
  gpuTypeId: z
    .string()
    .min(1)
    .describe('GPU type ID from runpod_gpu_types (e.g., "NVIDIA GeForce RTX 4090").'),
  gpuCount: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(1)
    .describe("Number of GPUs (default: 1)."),
  volumeInGb: z
    .number()
    .int()
    .min(0)
    .default(20)
    .describe("Persistent volume size in GB (default: 20)."),
  containerDiskInGb: z
    .number()
    .int()
    .min(1)
    .default(20)
    .describe("Container disk size in GB (default: 20)."),
  ports: z
    .string()
    .optional()
    .describe('Port mappings. Example: "8888/http,22/tcp".'),
  volumeMountPath: z
    .string()
    .default("/workspace")
    .describe("Volume mount path (default: /workspace)."),
  env: z
    .record(z.string())
    .optional()
    .describe("Environment variables as key-value pairs."),
  cloudType: z
    .enum(["SECURE", "COMMUNITY", "ALL"])
    .default("ALL")
    .describe('Cloud type: "SECURE" (data centers), "COMMUNITY" (peer hosts), or "ALL" (default).'),
});

/** Delete pod — DELETE /pods/{id} */
export const DeletePodSchema = ConfirmSchema.extend({
  id: z.string().min(1).describe("Pod ID to delete."),
});

/** Start pod — POST /pods/{id}/start */
export const StartPodSchema = ConfirmSchema.extend({
  id: z.string().min(1).describe("Pod ID to start."),
  gpuCount: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Number of GPUs (optional — uses pod's configured count if omitted)."),
});

/** Stop pod — POST /pods/{id}/stop */
export const StopPodSchema = ConfirmSchema.extend({
  id: z.string().min(1).describe("Pod ID to stop."),
});

/** Restart pod — POST /pods/{id}/restart */
export const RestartPodSchema = ConfirmSchema.extend({
  id: z.string().min(1).describe("Pod ID to restart."),
});
