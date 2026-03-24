import { Router } from "express"
import { getJobById, listDeliveries, listJobs } from "../controllers/jobsController.js"

const router = Router()

/**
 * @openapi
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List jobs with optional filters
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *       - in: query
 *         name: pipelineId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Jobs retrieved
 */
router.get("/", listJobs)

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get a single job by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job retrieved
 *       404:
 *         description: Job not found
 */
router.get("/:id", getJobById)

/**
 * @openapi
 * /jobs/{id}/deliveries:
 *   get:
 *     tags: [Jobs]
 *     summary: Get delivery attempts for a job
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Delivery attempts retrieved
 */
router.get("/:id/deliveries", listDeliveries)

export default router
