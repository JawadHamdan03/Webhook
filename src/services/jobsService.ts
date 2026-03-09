import dbContext from "../config/db/dbContext.js"
import { jobs } from "../config/db/schema.js"

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
