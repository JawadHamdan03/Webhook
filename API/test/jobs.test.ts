import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import * as jobsService from "../src/services/jobsService.js";

vi.mock("../src/services/jobsService.js", () => ({
    listJobsWithFilters: vi.fn(),
    getJob: vi.fn(),
    getDeliveriesByJobId: vi.fn(),
    createJob: vi.fn(),
}));

const mockJob = {
    id: "job-1",
    pipelineId: "pipeline-1",
    status: "pending",
    payload: { event: "order.created" },
    processedOutput: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockDelivery = {
    id: "delivery-1",
    jobId: "job-1",
    subscriberId: "sub-1",
    attemptNumber: 1,
    status: "pending",
    responseStatus: null,
    responseBody: null,
    errorMessage: null,
    nextRetryAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /jobs", () => {
    it("returns 200 with an array of jobs", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(jobsService.listJobsWithFilters).mockResolvedValue([mockJob] as any);

        const res = await request(app).get("/jobs");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
    });

    it("returns 200 and filters by valid status", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(jobsService.listJobsWithFilters).mockResolvedValue([] as any);

        const res = await request(app).get("/jobs?status=pending");
        expect(res.status).toBe(200);
    });

    it("returns 200 and filters by valid pipelineId (UUID)", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(jobsService.listJobsWithFilters).mockResolvedValue([] as any);

        const res = await request(app).get("/jobs?pipelineId=550e8400-e29b-41d4-a716-446655440000");
        expect(res.status).toBe(200);
    });

    it("returns 400 for an unknown status value", async () => {
        const res = await request(app).get("/jobs?status=unknown_status");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("invalid_request");
    });

    it("returns 400 for a non-UUID pipelineId", async () => {
        const res = await request(app).get("/jobs?pipelineId=not-a-uuid");
        expect(res.status).toBe(400);
    });
});

describe("GET /jobs/:id", () => {
    it("returns 200 with job data when the job exists", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(jobsService.getJob).mockResolvedValue(mockJob as any);

        const res = await request(app).get("/jobs/job-1");
        expect(res.status).toBe(200);
        expect(res.body.id).toBe("job-1");
        expect(res.body.status).toBe("pending");
    });

    it("returns 404 when the job does not exist", async () => {
        vi.mocked(jobsService.getJob).mockResolvedValue(null as never);

        const res = await request(app).get("/jobs/nonexistent-id");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("not_found");
    });
});

describe("GET /jobs/:id/deliveries", () => {
    it("returns 200 with delivery attempts", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(jobsService.getDeliveriesByJobId).mockResolvedValue([mockDelivery] as any);

        const res = await request(app).get("/jobs/job-1/deliveries");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
    });

    it("returns 200 with empty array when no deliveries exist", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(jobsService.getDeliveriesByJobId).mockResolvedValue([] as any);

        const res = await request(app).get("/jobs/job-1/deliveries");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});
