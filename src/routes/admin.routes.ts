import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/auth.controller.js'
import * as adminController from '../controllers/admin.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { requireCsrf } from '../middlewares/csrf.js'

const router: Router = Router()
const adminOnly = [authenticate, authorize('admin')]
const createUserRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
})

router.get('/users', ...adminOnly, adminController.listUsers)
router.post(
  '/users',
  ...adminOnly,
  requireCsrf,
  createUserRateLimit,
  authController.register
)
router.patch(
  '/users/:userId/status',
  ...adminOnly,
  requireCsrf,
  adminController.updateUserStatus
)

export default router
