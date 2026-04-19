import { z } from "zod";

/** Account info — GraphQL query { myself } */
export const AccountInfoSchema = z.object({});

/** GPU types — GraphQL query { gpuTypes } */
export const GpuTypesSchema = z.object({
  memoryMin: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Minimum GPU memory in GB. Filters out GPUs with less VRAM."),
  cloudType: z
    .enum(["SECURE", "COMMUNITY", "ALL"])
    .default("ALL")
    .describe('Cloud type filter: "SECURE", "COMMUNITY", or "ALL" (default).'),
});

/** Template list — GET /templates */
export const TemplateListSchema = z.object({});
