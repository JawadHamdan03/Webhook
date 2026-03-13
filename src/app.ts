import express from 'express'
import dotenv from 'dotenv'
import pipelinesRoutes from './routes/pipelinesRoutes.js'
import webhooksRoutes from './routes/webhooksRoutes.js'
import jobsRoutes from './routes/jobsRoutes.js'

dotenv.config();
const PORT = process.env.PORT || 5000

const app = express()

app.use(express.json())

app.use("/pipelines", pipelinesRoutes)
app.use("/webhooks", webhooksRoutes)
app.use("/jobs", jobsRoutes)


app.listen(PORT, () => { console.log(`server is running at ${PORT}`) })