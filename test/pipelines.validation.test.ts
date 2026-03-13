import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

describe("pipelines validation", () => {
    it("rejects create without name", async () => {
        const res = await request(app).post("/pipelines").send({
            actionType: "filter",
            actionConfig: { field: "eventType", equals: "order.created" }
        });

        expect(res.status).toBe(400);
    });

    it("rejects update with empty body", async () => {
        const res = await request(app).put("/pipelines/any-id").send({});
        expect(res.status).toBe(400);
    });

    it("rejects create with invalid actionType", async () => {
        const res = await request(app).post("/pipelines").send({
            name: "Bad pipeline",
            actionType: "unknown",
            actionConfig: {}
        });

        expect(res.status).toBe(400);
    });
});
