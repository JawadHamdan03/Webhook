import { type Request, type Response } from "express"
import { getDeliveriesByJobId, getJob, listJobsWithFilters } from "../services/jobsService.js"

export const listJobs = async (req: Request, res: Response) => {
    const { status, pipelineId } = req.query
    const filters: { status?: string; pipelineId?: string } = {}

    if (typeof status === "string") {
        filters.status = status
    }

    if (typeof pipelineId === "string") {
        filters.pipelineId = pipelineId
    }

    const rows = await listJobsWithFilters(filters)

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
