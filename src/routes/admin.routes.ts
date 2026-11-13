import { Router } from 'express'
import * as adminController from '../controllers/admin.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { requireCsrf } from '../middlewares/csrf.js'

const router: Router = Router()
const adminOnly = [authenticate, authorize('admin')]

router.get('/users', ...adminOnly, adminController.listUsers)
router.patch(
  '/users/:userId/status',
  ...adminOnly,
  requireCsrf,
  adminController.updateUserStatus
)

export default router
