import { Router } from 'express'
import {
    createPipeline,
    deletePipeline,
    getAll,
    getById,
    updatePipeline
} from '../controllers/pipelinesController.js'
import {
    createPipelineSubscriber as createPipelineSubscriberController,
    deleteSubscriber as deleteSubscriberController,
    listPipelineSubscribers as listPipelineSubscribersController,
    updateSubscriber as updateSubscriberController
} from '../controllers/subscribersController.js'
import { jwtAuth } from '../middleware/apiKeyAuth.js'
const router = Router()

router.use(jwtAuth)

router.get("/", getAll)
router.get("/:id", getById)
router.get('/:id/subscribers', listPipelineSubscribersController)
router.post("/", createPipeline)
router.post('/:id/subscribers', createPipelineSubscriberController)
router.put("/:id", updatePipeline)
router.put('/subscribers/:id', updateSubscriberController)
router.delete("/:id", deletePipeline)
router.delete('/subscribers/:id', deleteSubscriberController)


export default router