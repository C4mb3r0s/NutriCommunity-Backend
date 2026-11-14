it('requires authentication secrets during module initialization', async () => {
  delete process.env.JWT_SECRET
  delete process.env.REFRESH_TOKEN_HMAC_SECRET
  delete process.env.CSRF_SECRET

  await expect(import('../../../src/services/token.service.js'))
    .rejects.toThrow('Authentication secrets are not configured')
})
