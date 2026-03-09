import { Router } from 'express'
import {
    createPipeline,
    deletePipeline,
    getAll,
    getById,
    updatePipeline
} from '../controllers/pipelinesController.js'
const router = Router()

router.get("/", getAll)
router.get("/:id", getById)
router.post("/", createPipeline)
router.put("/:id", updatePipeline)
router.delete("/:id", deletePipeline)


export default router