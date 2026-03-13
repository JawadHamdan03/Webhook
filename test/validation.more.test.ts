import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

describe("additional validation", () => {
    it("rejects pipeline create with invalid filter config", async () => {
        const res = await request(app).post("/pipelines").send({
            name: "Bad filter",
            actionType: "filter",
            actionConfig: { field: "eventType" }
        });

        expect(res.status).toBe(400);
    });

    it("rejects pipeline update with actionConfig but missing actionType", async () => {
        const res = await request(app).put("/pipelines/any-id").send({
            actionConfig: { add: { foo: "bar" } }
        });

        expect(res.status).toBe(400);
    });

    it("rejects webhook payload that is not an object", async () => {
        const res = await request(app).post("/webhooks/pl_invalid").send(["bad"]);
        expect(res.status).toBe(400);
    });

    it("rejects jobs list with invalid status", async () => {
        const res = await request(app).get("/jobs?status=unknown");
        expect(res.status).toBe(400);
    });
});