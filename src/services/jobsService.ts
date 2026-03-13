import { and, eq } from "drizzle-orm"
import dbContext from "../config/db/dbContext.js"
import { deliveryAttempts, jobs } from "../config/db/schema.js"

export type NewJobPayload = {
    pipelineId: string
    payload: Record<string, unknown>
}

type NewJob = typeof jobs.$inferInsert

export const createJob = async (payload: NewJobPayload) => {
    const jobPayload: NewJob = {
        pipelineId: payload.pipelineId,
        payload: payload.payload,
        status: "pending"
    }

    const rows = await dbContext.insert(jobs).values(jobPayload).returning()
    return rows[0]
}

export const listJobsWithFilters = async (filters: { status?: string; pipelineId?: string }) => {
    const clauses = [] as Array<ReturnType<typeof eq>>

    if (filters.status) {
        clauses.push(eq(jobs.status, filters.status as typeof jobs.status.enumValues[number]))
    }

    if (filters.pipelineId) {
        clauses.push(eq(jobs.pipelineId, filters.pipelineId))
    }

    if (clauses.length === 0) {
        return dbContext.select().from(jobs)
    }

    return dbContext.select().from(jobs).where(and(...clauses))
}

export const getJob = async (id: string) => {
    const rows = await dbContext.select().from(jobs).where(eq(jobs.id, id)).limit(1)
    return rows[0] ?? null
}

export const getDeliveriesByJobId = async (jobId: string) => {
    return dbContext.select().from(deliveryAttempts).where(eq(deliveryAttempts.jobId, jobId))
}
