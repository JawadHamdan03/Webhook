import { z } from "zod";

export const jobsQuerySchema = z.object({
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    pipelineId: z.string().uuid().optional()
});