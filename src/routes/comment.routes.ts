import { Router } from 'express'
import * as commentController from '../controllers/comment.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireCsrf } from '../middlewares/csrf.js'

const router: Router = Router()

router.get('/post/:postId/comments', commentController.list)
router.post(
  '/posts/:postId/comments',
  authenticate,
  requireCsrf,
  commentController.create
)
router.delete(
  '/comments/:commentId',
  authenticate,
  requireCsrf,
  commentController.remove
)

export default router
