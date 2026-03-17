import { Router } from "express"
import { ingestWebhook } from "../controllers/webhooksController.js"
import { webhookRateLimit } from "../middleware/webhookRateLimit.js"

const router = Router()

router.post("/:sourceKey", webhookRateLimit, ingestWebhook)

export default router
