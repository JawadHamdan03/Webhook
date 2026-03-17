import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../src/app.js";

let authToken = "";

beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
    authToken = jwt.sign({ sub: "test-user", email: "test@example.com" }, process.env.JWT_SECRET);
});

describe("additional validation", () => {
    it("rejects pipeline create with invalid filter config", async () => {
        const res = await request(app)
            .post("/pipelines")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                name: "Bad filter",
                actionType: "filter",
                actionConfig: { field: "eventType" }
            });

        expect(res.status).toBe(400);
    });

    it("rejects pipeline update with actionConfig but missing actionType", async () => {
        const res = await request(app)
            .put("/pipelines/any-id")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
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