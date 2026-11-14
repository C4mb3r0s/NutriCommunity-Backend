import { jest } from '@jest/globals'

process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.REFRESH_TOKEN_HMAC_SECRET = 'test-refresh-secret'
process.env.CSRF_SECRET = 'test-csrf-secret'
process.env.FRONTEND_URL = 'http://frontend.test'

jest.unstable_mockModule('../../src/db/index.js', () => ({
  db: {},
  client: {}
}))

const app = (await import('../../src/app.js')).default

it('loads the application with a configured frontend origin', () => {
  expect(app).toBeDefined()
})
