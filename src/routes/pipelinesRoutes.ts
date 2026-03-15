import { Router } from 'express'
import {
    createPipeline,
    deletePipeline,
    getAll,
    getById,
    updatePipeline
} from '../controllers/pipelinesController.js'
import { jwtAuth } from '../middleware/apiKeyAuth.js'
const router = Router()

router.use(jwtAuth)

router.get("/", getAll)
router.get("/:id", getById)
router.post("/", createPipeline)
router.put("/:id", updatePipeline)
router.delete("/:id", deletePipeline)


export default router