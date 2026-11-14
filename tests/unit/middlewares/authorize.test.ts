import type { NextFunction, Request, Response } from 'express'
import { jest } from '@jest/globals'
import { authorize } from '../../../src/middlewares/authorize.js'

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
})

describe('authorize middleware', () => {
  it('rejects requests without an authenticated user', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction

    authorize('admin')({} as Request, response as Response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects users without an allowed role', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const request = {
      user: { id: 'user-id', roles: ['participant'] }
    } as Request

    authorize('admin')(request, response as Response, next)

    expect(response.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('continues for an allowed role', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const request = {
      user: { id: 'user-id', roles: ['admin'] }
    } as Request

    authorize('admin')(request, response as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
