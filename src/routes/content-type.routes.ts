import { Router } from 'express'
import * as contentTypeController from '../controllers/content-type.controller.js'

const router: Router = Router()

router.get('/', contentTypeController.list)

export default router
