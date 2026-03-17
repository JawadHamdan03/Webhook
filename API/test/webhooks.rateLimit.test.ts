import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { webhookRateLimit } from "../src/middleware/webhookRateLimit.js";

describe("webhookRateLimit middleware", () => {
    it("returns 429 after 100 requests from the same IP within one minute", async () => {
        const app = express();

        // Allow test requests to control client IP via X-Forwarded-For.
        app.set("trust proxy", 1);
        app.post("/webhooks/:sourceKey", webhookRateLimit, (_req, res) => {
            res.status(202).json({ accepted: true });
        });

        const sourceKey = "pl_abc12345def0";
        const clientIp = "10.1.1.50";

        for (let i = 0; i < 100; i++) {
            const res = await request(app)
                .post(`/webhooks/${sourceKey}`)
                .set("X-Forwarded-For", clientIp)
                .send({ eventType: "order.created" });

            expect(res.status).toBe(202);
        }

        const limited = await request(app)
            .post(`/webhooks/${sourceKey}`)
            .set("X-Forwarded-For", clientIp)
            .send({ eventType: "order.created" });

        expect(limited.status).toBe(429);
        expect(limited.body).toEqual({ error: "too_many_requests" });
    });
});
