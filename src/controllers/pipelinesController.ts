import { type Request, type Response } from "express"
import {
    createPipeline as createPipelineRecord,
    deletePipeline as deletePipelineRecord,
    getPipelineById,
    listPipelines,
    updatePipeline as updatePipelineRecord,
    type PipelinePayload
} from "../services/pipelinesService.js"

export const getAll = async (_req: Request, res: Response) => {
    const rows = await listPipelines()
    return res.status(200).json(rows)
}

export const getById = async (req: Request, res: Response) => {
    const idParam = req.params.id
    if (!idParam || Array.isArray(idParam)) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const pipeline = await getPipelineById(idParam)

    if (!pipeline) {
        res.status(404).json({ error: "not_found" })
        return
    }

    return res.status(200).json(pipeline)
}

export const createPipeline = async (req: Request, res: Response) => {
    const body = req.body as Partial<PipelinePayload>

    if (!body?.name || !body?.actionType) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const created = await createPipelineRecord({
        name: body.name,
        ...(body.sourceKey !== undefined ? { sourceKey: body.sourceKey } : {}),
        actionType: body.actionType,
        actionConfig: body.actionConfig || {}
    })

    return res.status(201).json(created)
}

export const updatePipeline = async (req: Request, res: Response) => {
    const idParam = req.params.id
    const body = req.body as Partial<PipelinePayload>

    if (!idParam || Array.isArray(idParam)) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    if (!body || Object.keys(body).length === 0) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const pipeline = await updatePipelineRecord(idParam, body)
    if (!pipeline) {
        res.status(404).json({ error: "not_found" })
        return
    }

    return res.status(200).json(pipeline)
}

export const deletePipeline = async (req: Request, res: Response) => {
    const idParam = req.params.id

    if (!idParam || Array.isArray(idParam)) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const pipeline = await deletePipelineRecord(idParam)

    if (!pipeline) {
        res.status(404).json({ error: "not_found" })
        return
    }

    return res.status(204).send()
}