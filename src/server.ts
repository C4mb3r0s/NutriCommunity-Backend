import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import { parseCookies } from './middlewares/cookies.js'
import authRoutes from './routes/auth.routes.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(parseCookies)

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'nutricommunity-backend'
  })
})

app.use('/api/auth', authRoutes)

app.listen(port, () => {
  console.log(`Backend ejecutándose en http://localhost:${port}`)
})
