import express from 'express'
import pipelinesRoutes from './routes/pipelinesRoutes.js'
import webhooksRoutes from './routes/webhooksRoutes.js'
import jobsRoutes from './routes/jobsRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express()

app.use(express.json())

app.use("/auth", authRoutes)
app.use("/pipelines", pipelinesRoutes)
app.use("/webhooks", webhooksRoutes)
app.use("/jobs", jobsRoutes)


export default app