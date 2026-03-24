import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import pipelinesRoutes from './routes/pipelinesRoutes.js'
import webhooksRoutes from './routes/webhooksRoutes.js'
import jobsRoutes from './routes/jobsRoutes.js'
import authRoutes from './routes/authRoutes.js'
import { swaggerSpec } from './config/swagger.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use("/auth", authRoutes)
app.use("/pipelines", pipelinesRoutes)
app.use("/webhooks", webhooksRoutes)
app.use("/jobs", jobsRoutes)


export default app