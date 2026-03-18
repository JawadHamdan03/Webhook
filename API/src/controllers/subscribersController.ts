import { type Request, type Response } from 'express'
import { getPipelineById } from '../services/pipelinesService.js'
import {
    createSubscriber as createSubscriberRecord,
    deleteSubscriber as deleteSubscriberRecord,
    getSubscriberById,
    listSubscribersByPipelineId,
    updateSubscriber as updateSubscriberRecord
} from '../services/subscribersService.js'
import { subscriberCreateSchema, subscriberUpdateSchema } from '../validators/subscribers.js'

export const listPipelineSubscribers = async (req: Request, res: Response) => {
    const pipelineId = req.params.id

    if (!pipelineId || Array.isArray(pipelineId)) {
        res.status(400).json({ error: 'invalid_request' })
        return
    }

    const pipeline = await getPipelineById(pipelineId)

    if (!pipeline) {
        res.status(404).json({ error: 'not_found' })
        return
    }

    const rows = await listSubscribersByPipelineId(pipelineId)
    res.status(200).json(rows)
}

export const createPipelineSubscriber = async (req: Request, res: Response) => {
    const pipelineId = req.params.id

    if (!pipelineId || Array.isArray(pipelineId)) {
        res.status(400).json({ error: 'invalid_request' })
        return
    }

    const pipeline = await getPipelineById(pipelineId)

    if (!pipeline) {
        res.status(404).json({ error: 'not_found' })
        return
    }

    const parsed = subscriberCreateSchema.safeParse(req.body)

    if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request' })
        return
    }

    const created = await createSubscriberRecord({
        pipelineId,
        targetUrl: parsed.data.targetUrl
    })

    res.status(201).json(created)
}

export const updateSubscriber = async (req: Request, res: Response) => {
    const subscriberId = req.params.id

    if (!subscriberId || Array.isArray(subscriberId)) {
        res.status(400).json({ error: 'invalid_request' })
        return
    }

    const parsed = subscriberUpdateSchema.safeParse(req.body)

    if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request' })
        return
    }

    const existingSubscriber = await getSubscriberById(subscriberId)

    if (!existingSubscriber) {
        res.status(404).json({ error: 'not_found' })
        return
    }

    const updated = await updateSubscriberRecord(subscriberId, parsed.data.targetUrl)
    res.status(200).json(updated)
}

export const deleteSubscriber = async (req: Request, res: Response) => {
    const subscriberId = req.params.id

    if (!subscriberId || Array.isArray(subscriberId)) {
        res.status(400).json({ error: 'invalid_request' })
        return
    }

    const deleted = await deleteSubscriberRecord(subscriberId)

    if (!deleted) {
        res.status(404).json({ error: 'not_found' })
        return
    }

    res.status(204).send()
}