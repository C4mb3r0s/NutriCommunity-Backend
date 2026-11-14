import type { NextFunction, Request, Response } from 'express'
import { jest } from '@jest/globals'

process.env.JWT_SECRET = 'test-jwt-secret'
process.env.REFRESH_TOKEN_HMAC_SECRET = 'test-refresh-secret'
process.env.CSRF_SECRET = 'test-csrf-secret'

const { createAccessToken } = await import(
  '../../../src/services/token.service.js'
)
const { authenticate } = await import(
  '../../../src/middlewares/authenticate.js'
)

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
})

describe('authenticate middleware', () => {
  it('rejects requests without a bearer token', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction

    authenticate({ headers: {} } as Request, response as Response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects invalid access tokens', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const request = {
      headers: { authorization: 'Bearer invalid-token' }
    } as Request

    authenticate(request, response as Response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('assigns the token user and continues for valid tokens', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const token = createAccessToken(
      '550e8400-e29b-41d4-a716-446655440000',
      ['admin']
    )
    const request = {
      headers: { authorization: `Bearer ${token}` }
    } as Request

    authenticate(request, response as Response, next)

    expect(request.user).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      roles: ['admin']
    })
    expect(next).toHaveBeenCalledTimes(1)
  })
})
