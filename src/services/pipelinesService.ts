import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"
import dbContext from "../config/db/dbContext.js"
import { pipelines } from "../config/db/schema.js"

export type PipelinePayload = {
    name: string
    sourceKey?: string
    actionType: "add_fields" | "transform" | "filter"
    actionConfig: Record<string, unknown>
}

type NewPipeline = typeof pipelines.$inferInsert

const generateSourceKey = () => `pl_${randomBytes(12).toString("hex")}`

export const listPipelines = async () => {
    return dbContext.select().from(pipelines)
}

export const getPipelineById = async (id: string) => {
    const rows = await dbContext.select().from(pipelines).where(eq(pipelines.id, id)).limit(1)
    return rows[0] ?? null
}

export const createPipeline = async (payload: PipelinePayload) => {
    const newPipeline: NewPipeline = {
        name: payload.name,
        sourceKey: payload.sourceKey || generateSourceKey(),
        actionType: payload.actionType,
        actionConfig: payload.actionConfig || {}
    }

    const rows = await dbContext.insert(pipelines).values(newPipeline).returning()
    return rows[0] ?? null
}

export const updatePipeline = async (id: string, payload: Partial<PipelinePayload>) => {
    const updatePayload: Partial<NewPipeline> = {
        updatedAt: new Date()
    }

    if (payload.name !== undefined) updatePayload.name = payload.name
    if (payload.sourceKey !== undefined) updatePayload.sourceKey = payload.sourceKey
    if (payload.actionType !== undefined) updatePayload.actionType = payload.actionType
    if (payload.actionConfig !== undefined) updatePayload.actionConfig = payload.actionConfig

    const rows = await dbContext.update(pipelines).set(updatePayload).where(eq(pipelines.id, id)).returning()
    return rows[0] ?? null
}

export const deletePipeline = async (id: string) => {
    const rows = await dbContext.delete(pipelines).where(eq(pipelines.id, id)).returning()
    return rows[0] ?? null
}
