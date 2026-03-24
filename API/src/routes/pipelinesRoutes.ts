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

/**
 * @openapi
 * /pipelines:
 *   get:
 *     tags: [Pipelines]
 *     summary: List pipelines
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pipelines retrieved
 */
router.get("/", getAll)

/**
 * @openapi
 * /pipelines/{id}:
 *   get:
 *     tags: [Pipelines]
 *     summary: Get pipeline by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pipeline retrieved
 *       404:
 *         description: Pipeline not found
 */
router.get("/:id", getById)

/**
 * @openapi
 * /pipelines/{id}/subscribers:
 *   get:
 *     tags: [Subscribers]
 *     summary: List subscribers for a pipeline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subscribers retrieved
 */
router.get('/:id/subscribers', listPipelineSubscribersController)

/**
 * @openapi
 * /pipelines:
 *   post:
 *     tags: [Pipelines]
 *     summary: Create a pipeline
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, actionType, actionConfig]
 *             properties:
 *               name:
 *                 type: string
 *               actionType:
 *                 type: string
 *                 enum: [add_fields, transform, filter, remove_fields, lowercase, mask_fields]
 *               actionConfig:
 *                 type: object
 *     responses:
 *       201:
 *         description: Pipeline created
 */
router.post("/", createPipeline)

/**
 * @openapi
 * /pipelines/{id}/subscribers:
 *   post:
 *     tags: [Subscribers]
 *     summary: Add a subscriber to a pipeline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUrl]
 *             properties:
 *               targetUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Subscriber created
 */
router.post('/:id/subscribers', createPipelineSubscriberController)

/**
 * @openapi
 * /pipelines/{id}:
 *   put:
 *     tags: [Pipelines]
 *     summary: Update a pipeline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pipeline updated
 */
router.put("/:id", updatePipeline)

/**
 * @openapi
 * /pipelines/subscribers/{id}:
 *   put:
 *     tags: [Subscribers]
 *     summary: Update a subscriber
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subscriber updated
 */
router.put('/subscribers/:id', updateSubscriberController)

/**
 * @openapi
 * /pipelines/{id}:
 *   delete:
 *     tags: [Pipelines]
 *     summary: Delete a pipeline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Pipeline deleted
 */
router.delete("/:id", deletePipeline)

/**
 * @openapi
 * /pipelines/subscribers/{id}:
 *   delete:
 *     tags: [Subscribers]
 *     summary: Delete a subscriber
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Subscriber deleted
 */
router.delete('/subscribers/:id', deleteSubscriberController)


export default router