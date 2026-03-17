import { type Request, type Response } from "express"
import { getDeliveriesByJobId, getJob, listJobsWithFilters } from "../services/jobsService.js"
import { jobsQuerySchema } from "../validators/jobs.js"

export const listJobs = async (req: Request, res: Response) => {
    const { status, pipelineId } = req.query
    const parsed = jobsQuerySchema.safeParse({
        status: typeof status === "string" ? status : undefined,
        pipelineId: typeof pipelineId === "string" ? pipelineId : undefined
    })

    if (!parsed.success) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const rows = await listJobsWithFilters(parsed.data)

    res.status(200).json(rows)
}

export const getJobById = async (req: Request, res: Response) => {
    const idParam = req.params.id
    if (!idParam || Array.isArray(idParam)) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const job = await getJob(idParam)
    if (!job) {
        res.status(404).json({ error: "not_found" })
        return
    }

    res.status(200).json(job)
}

export const listDeliveries = async (req: Request, res: Response) => {
    const idParam = req.params.id
    if (!idParam || Array.isArray(idParam)) {
        res.status(400).json({ error: "invalid_request" })
        return
    }

    const deliveries = await getDeliveriesByJobId(idParam)
    res.status(200).json(deliveries)
}
