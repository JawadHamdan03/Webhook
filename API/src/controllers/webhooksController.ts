import { type Request, type Response } from "express"
import { createJob } from "../services/jobsService.js"
import { getPipelineBySourceKey } from "../services/pipelinesService.js"
import { webhookPayloadSchema, webhookSourceKeySchema } from "../validators/webhooks.js"

export const ingestWebhook = async (req: Request, res: Response) => {
    const sourceKeyParam = req.params.sourceKey

    if (!sourceKeyParam || Array.isArray(sourceKeyParam)) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const sourceKeyParsed = webhookSourceKeySchema.safeParse(sourceKeyParam)
    if (!sourceKeyParsed.success) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const payloadParsed = webhookPayloadSchema.safeParse(req.body)
    if (!payloadParsed.success) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const pipeline = await getPipelineBySourceKey(sourceKeyParam)

    if (!pipeline) {
        res.status(404).json({ error: "not_found" })
        return
    }

    const job = await createJob({
        pipelineId: pipeline.id,
        payload: payloadParsed.data
    })

    res.status(202).json({ accepted: true, jobId: job!.id })
}
