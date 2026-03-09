import { Router } from "express"
import { ingestWebhook } from "../controllers/webhooksController.js"

const router = Router()

router.post("/:sourceKey", ingestWebhook)

export default router
