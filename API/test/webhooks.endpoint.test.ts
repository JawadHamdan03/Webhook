import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import * as pipelinesService from "../src/services/pipelinesService.js";
import * as jobsService from "../src/services/jobsService.js";

vi.mock("../src/services/pipelinesService.js", () => ({
    getPipelineBySourceKey: vi.fn(),
    getPipelineById: vi.fn(),
    listPipelines: vi.fn(),
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    deletePipeline: vi.fn(),
}));

vi.mock("../src/services/jobsService.js", () => ({
    createJob: vi.fn(),
    listJobsWithFilters: vi.fn(),
    getJob: vi.fn(),
    getDeliveriesByJobId: vi.fn(),
}));

const mockPipeline = {
    id: "pipeline-1",
    name: "Test Pipeline",
    sourceKey: "pl_abc12345def0",
    actionType: "filter",
    actionConfig: { field: "eventType", equals: "order.created" },
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("POST /webhooks/:sourceKey", () => {
    it("returns 400 for an invalid sourceKey format", async () => {
        const res = await request(app)
            .post("/webhooks/invalid_key")
            .send({ event: "order.created" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("invalid_request");
    });

    it("returns 400 when the payload is not an object", async () => {
        const res = await request(app)
            .post("/webhooks/pl_abc12345def0")
            .send("not-an-object");
        expect(res.status).toBe(400);
    });

    it("returns 404 when no pipeline matches the sourceKey", async () => {
        vi.mocked(pipelinesService.getPipelineBySourceKey).mockResolvedValue(null);

        const res = await request(app)
            .post("/webhooks/pl_abc12345def0")
            .send({ event: "order.created" });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("not_found");
    });

    it("returns 202 with jobId when the pipeline exists", async () => {
        vi.mocked(pipelinesService.getPipelineBySourceKey).mockResolvedValue(mockPipeline as any);
        vi.mocked(jobsService.createJob).mockResolvedValue({ id: "job-123" } as any);

        const res = await request(app)
            .post("/webhooks/pl_abc12345def0")
            .send({ event: "order.created", orderId: "ord-42" });
        expect(res.status).toBe(202);
        expect(res.body.accepted).toBe(true);
        expect(res.body.jobId).toBe("job-123");
    });
});
