import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireCsrf } from '../middlewares/csrf.js'

const router: Router = Router()

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/register', authRateLimit, authController.register)
router.post('/login', authRateLimit, authController.login)
router.get('/me', authenticate, authController.me)
router.post('/refresh', requireCsrf, authController.refresh)
router.post('/logout', authenticate, requireCsrf, authController.logout)

export default router
