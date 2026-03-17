import { Router } from "express"
import { getJobById, listDeliveries, listJobs } from "../controllers/jobsController.js"

const router = Router()

router.get("/", listJobs)
router.get("/:id", getJobById)
router.get("/:id/deliveries", listDeliveries)

export default router
