import cors from 'cors'
import 'dotenv/config'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { parseCookies } from './middlewares/cookies.js'
import adminRoutes from './routes/admin.routes.js'
import authRoutes from './routes/auth.routes.js'
import commentRoutes from './routes/comment.routes.js'
import contentTypeRoutes from './routes/content-type.routes.js'
import postRoutes from './routes/post.routes.js'

const app: Express = express()

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
app.use('/api/posts', postRoutes)
app.use('/api/content-types', contentTypeRoutes)
app.use('/api', commentRoutes)
app.use('/api/admin', adminRoutes)

export default app
