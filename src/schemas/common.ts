import { z } from "zod";

/** Confirmation gate for write operations. */
export const ConfirmSchema = z.object({
  confirm: z
    .literal(true)
    .describe("Safety gate: must be explicitly set to true to proceed with this write operation."),
});
