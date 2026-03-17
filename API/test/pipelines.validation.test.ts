import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../src/app.js";

let authToken = "";

beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
    authToken = jwt.sign({ sub: "test-user", email: "test@example.com" }, process.env.JWT_SECRET);
});

describe("pipelines validation", () => {
    it("rejects create without name", async () => {
        const res = await request(app)
            .post("/pipelines")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                actionType: "filter",
                actionConfig: { field: "eventType", equals: "order.created" }
            });

        expect(res.status).toBe(400);
    });

    it("rejects update with empty body", async () => {
        const res = await request(app)
            .put("/pipelines/any-id")
            .set("Authorization", `Bearer ${authToken}`)
            .send({});
        expect(res.status).toBe(400);
    });

    it("rejects create with invalid actionType", async () => {
        const res = await request(app)
            .post("/pipelines")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                name: "Bad pipeline",
                actionType: "unknown",
                actionConfig: {}
            });

        expect(res.status).toBe(400);
    });
});
