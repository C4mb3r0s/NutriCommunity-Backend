import { Router } from 'express'
import * as postController from '../controllers/post.controller.js'
import * as reactionController from '../controllers/reaction.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireCsrf } from '../middlewares/csrf.js'

const router: Router = Router()

router.get('/', postController.list)
router.get('/:postId', postController.detail)
router.post('/', authenticate, requireCsrf, postController.create)
router.patch('/:postId', authenticate, requireCsrf, postController.update)
router.put(
  '/:postId/reaction',
  authenticate,
  requireCsrf,
  reactionController.toggle
)
router.delete('/:postId', authenticate, requireCsrf, postController.remove)

export default router
