import { rateLimit } from "express-rate-limit"

export const webhookRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "too_many_requests" }
})