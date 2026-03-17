import { z } from "zod";

export const webhookSourceKeySchema = z.string().regex(/^pl_[a-f0-9]{8,}$/i, {
    message: "invalid_source_key"
});

export const webhookPayloadSchema = z.record(z.string(), z.unknown());