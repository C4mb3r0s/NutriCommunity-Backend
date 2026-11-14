import type { Request, Response } from 'express'
import * as contentTypeService from '../services/content-type.service.js'

export const list = async (
  _request: Request,
  response: Response
): Promise<void> => {
  response.json(await contentTypeService.list())
}
