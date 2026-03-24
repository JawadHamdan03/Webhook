import { Router } from "express"
import { ingestWebhook } from "../controllers/webhooksController.js"
import { webhookRateLimit } from "../middleware/webhookRateLimit.js"

const router = Router()

/**
 * @openapi
 * /webhooks/{sourceKey}:
 *   post:
 *     tags: [Webhooks]
 *     summary: Ingest a webhook event by source key
 *     parameters:
 *       - in: path
 *         name: sourceKey
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       202:
 *         description: Webhook accepted and queued as a job
 *       404:
 *         description: Pipeline not found for source key
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/:sourceKey", webhookRateLimit, ingestWebhook)

export default router
