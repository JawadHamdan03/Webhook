import { and, eq } from 'drizzle-orm'
import dbContext from '../config/db/dbContext.js'
import { subscribers } from '../config/db/schema.js'

export type SubscriberPayload = {
    pipelineId: string
    targetUrl: string
}

type NewSubscriber = typeof subscribers.$inferInsert

export const listSubscribersByPipelineId = async (pipelineId: string) => {
    return dbContext.select().from(subscribers).where(eq(subscribers.pipelineId, pipelineId))
}

export const createSubscriber = async (payload: SubscriberPayload) => {
    const newSubscriber: NewSubscriber = {
        pipelineId: payload.pipelineId,
        targetUrl: payload.targetUrl
    }

    const rows = await dbContext.insert(subscribers).values(newSubscriber).returning()
    return rows[0] ?? null
}

export const updateSubscriber = async (id: string, targetUrl: string) => {
    const rows = await dbContext
        .update(subscribers)
        .set({
            targetUrl,
            updatedAt: new Date()
        })
        .where(eq(subscribers.id, id))
        .returning()

    return rows[0] ?? null
}

export const deleteSubscriber = async (id: string) => {
    const rows = await dbContext.delete(subscribers).where(eq(subscribers.id, id)).returning()
    return rows[0] ?? null
}

export const getSubscriberById = async (id: string) => {
    const rows = await dbContext.select().from(subscribers).where(eq(subscribers.id, id)).limit(1)
    return rows[0] ?? null
}

export const getSubscriberByPipelineAndUrl = async (pipelineId: string, targetUrl: string) => {
    const rows = await dbContext
        .select()
        .from(subscribers)
        .where(and(eq(subscribers.pipelineId, pipelineId), eq(subscribers.targetUrl, targetUrl)))
        .limit(1)

    return rows[0] ?? null
}