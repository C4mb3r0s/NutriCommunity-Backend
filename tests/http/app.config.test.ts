import { jest } from '@jest/globals'

process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.REFRESH_TOKEN_HMAC_SECRET = 'test-refresh-secret'
process.env.CSRF_SECRET = 'test-csrf-secret'
process.env.FRONTEND_URL = 'http://frontend.test'
process.env.NODE_ENV = 'development'
process.env.SWAGGER_ENABLED = 'true'

jest.unstable_mockModule('../../src/db/index.js', () => ({
  db: {},
  client: {}
}))

const app = (await import('../../src/app.js')).default

it('loads the application with a configured frontend origin', () => {
  expect(app).toBeDefined()
})

it('registers the Swagger UI and OpenAPI document in development', async () => {
  const expressApp = app as unknown as {
    router: {
      stack: Array<{
        route?: {
          path: string
          stack: Array<{
            handle: (request: unknown, response: unknown) => unknown
          }>
        }
      }>
    }
  }
  const uiRoute = expressApp.router.stack.find(
    (layer) => layer.route?.path === '/api-docs'
  )
  const documentRoute = expressApp.router.stack.find(
    (layer) => layer.route?.path === '/api-docs/openapi.json'
  )
  const uiResponse = {
    type: jest.fn(),
    send: jest.fn()
  }
  uiResponse.type.mockReturnValue(uiResponse)
  const documentResponse = { json: jest.fn() }

  uiRoute?.route?.stack[0]?.handle({}, uiResponse)
  documentRoute?.route?.stack[0]?.handle({}, documentResponse)

  expect(uiRoute).toBeDefined()
  expect(documentRoute).toBeDefined()
  expect(uiResponse.send).toHaveBeenCalledWith(
    expect.stringContaining('NutriCommunity API Docs')
  )
  expect(documentResponse.json).toHaveBeenCalledWith(
    expect.objectContaining({
      openapi: '3.0.3',
      paths: expect.objectContaining({ '/api/auth/login': expect.anything() })
    })
  )
})
