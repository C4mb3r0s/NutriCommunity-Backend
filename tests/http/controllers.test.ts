import { jest } from '@jest/globals'
import type { Request, Response } from 'express'

process.env.JWT_SECRET = 'test-jwt-secret'
process.env.REFRESH_TOKEN_HMAC_SECRET = 'test-refresh-secret'
process.env.CSRF_SECRET = 'test-csrf-secret'
delete process.env.FRONTEND_URL

jest.unstable_mockModule('dotenv/config', () => ({}))

const authService = {
  register: jest.fn(),
  login: jest.fn(),
  getAuthenticatedUser: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn()
}
const adminService = {
  listUsers: jest.fn(),
  updateUserStatus: jest.fn()
}
const postService = {
  listPublished: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  canManage: jest.fn(),
  softDelete: jest.fn()
}
const commentService = {
  listByPost: jest.fn(),
  create: jest.fn(),
  softDelete: jest.fn()
}
const reactionService = {
  toggle: jest.fn()
}
const contentTypeService = {
  list: jest.fn()
}

jest.unstable_mockModule('../../src/services/auth.service.js', () => authService)
jest.unstable_mockModule('../../src/services/admin.service.js', () => adminService)
jest.unstable_mockModule('../../src/services/post.service.js', () => postService)
jest.unstable_mockModule('../../src/services/comment.service.js', () => commentService)
jest.unstable_mockModule('../../src/services/reaction.service.js', () => reactionService)
jest.unstable_mockModule('../../src/services/content-type.service.js', () => contentTypeService)

const authController = await import('../../src/controllers/auth.controller.js')
const adminController = await import('../../src/controllers/admin.controller.js')
const postController = await import('../../src/controllers/post.controller.js')
const commentController = await import('../../src/controllers/comment.controller.js')
const reactionController = await import('../../src/controllers/reaction.controller.js')
const contentTypeController = await import('../../src/controllers/content-type.controller.js')
const app = (await import('../../src/app.js')).default

const postId = '550e8400-e29b-41d4-a716-446655440000'
const userId = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
const commentId = '7ba7b810-9dad-41d1-80b4-00c04fd430c8'

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    send: jest.fn()
  }
  response.status.mockReturnValue(response)
  response.cookie.mockReturnValue(response)
  response.clearCookie.mockReturnValue(response)
  return response
}

const requestWith = (values: Record<string, unknown>) => values as Request

describe('auth controllers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('executes the health check handler', () => {
    const expressApp = app as unknown as {
      router: {
        stack: Array<{
          route?: {
            path: string
            stack: Array<{
              handle: (
                request: unknown,
                response: { json: (body: unknown) => void },
                next: () => void
              ) => void
            }>
          }
        }>
      }
    }
    const healthLayer = expressApp.router.stack.find(
      (layer) => layer.route?.path === '/health'
    )
    const response = { json: jest.fn() }

    healthLayer?.route?.stack[0]?.handle({}, response, jest.fn())

    expect(response.json).toHaveBeenCalledWith({
      status: 'ok',
      service: 'nutricommunity-backend'
    })
  })

  it('registers and handles registration errors', async () => {
    expect(app).toBeDefined()
    authService.register.mockResolvedValue({ id: userId })
    const response = createResponse()
    await authController.register(requestWith({
      body: {
        firstName: 'Eduardo',
        lastName: 'Camberos',
        email: 'eduardo@example.com',
        password: 'NutriPass1!'
      }
    }), response as unknown as Response)
    expect(response.status).toHaveBeenCalledWith(201)

    const invalidResponse = createResponse()
    await authController.register(requestWith({ body: {} }), invalidResponse as unknown as Response)
    expect(invalidResponse.status).toHaveBeenCalledWith(400)

    authService.register.mockRejectedValueOnce(new Error('EMAIL_ALREADY_EXISTS'))
    const duplicateResponse = createResponse()
    await authController.register(requestWith({
      body: {
        firstName: 'Eduardo',
        lastName: 'Camberos',
        email: 'eduardo@example.com',
        password: 'NutriPass1!'
      }
    }), duplicateResponse as unknown as Response)
    expect(duplicateResponse.status).toHaveBeenCalledWith(409)
  })

  it('logs in and sets refresh and CSRF cookies', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      csrfToken: 'csrf-token',
      user: { id: userId }
    })
    const response = createResponse()
    await authController.login(requestWith({
      body: { email: 'user@example.com', password: 'OldPass1' },
      ip: '127.0.0.1'
    }), response as unknown as Response)

    expect(response.cookie).toHaveBeenCalledTimes(2)
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('maps login and registration service failures', async () => {
    authService.login.mockRejectedValueOnce(new Error('INVALID_CREDENTIALS'))
    const invalidResponse = createResponse()
    await authController.login(requestWith({
      body: { email: 'user@example.com', password: 'OldPass1' }
    }), invalidResponse as unknown as Response)
    expect(invalidResponse.status).toHaveBeenCalledWith(401)

    authService.login.mockRejectedValueOnce(new Error('DATABASE_FAILURE'))
    const loginErrorResponse = createResponse()
    await authController.login(requestWith({
      body: { email: 'user@example.com', password: 'OldPass1' }
    }), loginErrorResponse as unknown as Response)
    expect(loginErrorResponse.status).toHaveBeenCalledWith(500)

    authService.register.mockRejectedValueOnce(new Error('DATABASE_FAILURE'))
    const registerErrorResponse = createResponse()
    await authController.register(requestWith({
      body: {
        firstName: 'Eduardo',
        lastName: 'Camberos',
        email: 'eduardo@example.com',
        password: 'NutriPass1!'
      }
    }), registerErrorResponse as unknown as Response)
    expect(registerErrorResponse.status).toHaveBeenCalledWith(500)
  })

  it('handles me, refresh and logout branches', async () => {
    const missingResponse = createResponse()
    await authController.me(requestWith({}), missingResponse as unknown as Response)
    expect(missingResponse.status).toHaveBeenCalledWith(401)

    authService.getAuthenticatedUser.mockResolvedValue({ id: userId })
    const meResponse = createResponse()
    await authController.me(requestWith({ user: { id: userId } }), meResponse as unknown as Response)
    expect(meResponse.json).toHaveBeenCalledWith({ user: { id: userId } })

    authService.getAuthenticatedUser.mockRejectedValueOnce(new Error('USER_NOT_FOUND'))
    const inactiveResponse = createResponse()
    await authController.me(requestWith({ user: { id: userId } }), inactiveResponse as unknown as Response)
    expect(inactiveResponse.status).toHaveBeenCalledWith(401)

    authService.getAuthenticatedUser.mockRejectedValueOnce(new Error('DATABASE_FAILURE'))
    const meErrorResponse = createResponse()
    await authController.me(requestWith({ user: { id: userId } }), meErrorResponse as unknown as Response)
    expect(meErrorResponse.status).toHaveBeenCalledWith(500)

    const refreshMissingResponse = createResponse()
    await authController.refresh(requestWith({ cookies: {} }), refreshMissingResponse as unknown as Response)
    expect(refreshMissingResponse.status).toHaveBeenCalledWith(401)

    authService.refresh.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      csrfToken: 'new-csrf'
    })
    const refreshResponse = createResponse()
    await authController.refresh(requestWith({
      cookies: { refresh_token: 'refresh-token' },
      ip: '127.0.0.1'
    }), refreshResponse as unknown as Response)
    expect(refreshResponse.status).not.toHaveBeenCalledWith(401)

    authService.refresh.mockRejectedValueOnce(new Error('REFRESH_TOKEN_EXPIRED'))
    const expiredResponse = createResponse()
    await authController.refresh(requestWith({
      cookies: { refresh_token: 'refresh-token' }
    }), expiredResponse as unknown as Response)
    expect(expiredResponse.status).toHaveBeenCalledWith(401)

    authService.refresh.mockRejectedValueOnce(new Error('DATABASE_FAILURE'))
    const refreshErrorResponse = createResponse()
    await authController.refresh(requestWith({
      cookies: { refresh_token: 'refresh-token' }
    }), refreshErrorResponse as unknown as Response)
    expect(refreshErrorResponse.status).toHaveBeenCalledWith(500)

    const logoutResponse = createResponse()
    await authController.logout(requestWith({ cookies: {} }), logoutResponse as unknown as Response)
    expect(logoutResponse.status).toHaveBeenCalledWith(204)

    authService.logout.mockRejectedValueOnce(new Error('DATABASE_FAILURE'))
    const logoutErrorResponse = createResponse()
    await authController.logout(requestWith({
      cookies: { refresh_token: 'refresh-token' }
    }), logoutErrorResponse as unknown as Response)
    expect(logoutErrorResponse.status).toHaveBeenCalledWith(500)
  })
})

describe('post controllers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lists and returns published post details', async () => {
    postService.listPublished.mockResolvedValue({ data: [], pagination: {} })
    const listResponse = createResponse()
    await postController.list(requestWith({ query: {} }), listResponse as unknown as Response)
    expect(listResponse.json).toHaveBeenCalled()

    postService.findById.mockResolvedValue({ id: postId, status: 'published' })
    const detailResponse = createResponse()
    await postController.detail(requestWith({ params: { postId } }), detailResponse as unknown as Response)
    expect(detailResponse.json).toHaveBeenCalled()

    postService.findById.mockResolvedValue({ id: postId, status: 'draft' })
    const missingResponse = createResponse()
    await postController.detail(requestWith({ params: { postId } }), missingResponse as unknown as Response)
    expect(missingResponse.status).toHaveBeenCalledWith(404)
  })

  it('creates, updates and removes posts according to permissions', async () => {
    const unauthorizedResponse = createResponse()
    await postController.create(requestWith({ body: {} }), unauthorizedResponse as unknown as Response)
    expect(unauthorizedResponse.status).toHaveBeenCalledWith(401)

    postService.create.mockResolvedValue({ id: postId })
    const createResponseValue = createResponse()
    await postController.create(requestWith({
      user: { id: userId },
      body: { title: 'Recipe', contentTypeId: postId }
    }), createResponseValue as unknown as Response)
    expect(createResponseValue.status).toHaveBeenCalledWith(201)

    postService.canManage.mockResolvedValue(false)
    const forbiddenResponse = createResponse()
    await postController.update(requestWith({
      params: { postId }, body: { status: 'published' }, user: { id: userId, roles: [] }
    }), forbiddenResponse as unknown as Response)
    expect(forbiddenResponse.status).toHaveBeenCalledWith(403)

    postService.canManage.mockResolvedValue(true)
    postService.update.mockResolvedValue({ id: postId })
    const updateResponse = createResponse()
    await postController.update(requestWith({
      params: { postId }, body: { status: 'published' }, user: { id: userId, roles: ['admin'] }
    }), updateResponse as unknown as Response)
    expect(updateResponse.json).toHaveBeenCalled()

    postService.update.mockResolvedValueOnce(undefined)
    const missingUpdateResponse = createResponse()
    await postController.update(requestWith({
      params: { postId }, body: { status: 'published' }, user: { id: userId, roles: ['admin'] }
    }), missingUpdateResponse as unknown as Response)
    expect(missingUpdateResponse.status).toHaveBeenCalledWith(404)

    const unauthenticatedUpdateResponse = createResponse()
    await postController.update(requestWith({
      params: { postId }, body: { status: 'published' }
    }), unauthenticatedUpdateResponse as unknown as Response)
    expect(unauthenticatedUpdateResponse.status).toHaveBeenCalledWith(401)

    postService.softDelete.mockResolvedValue({ id: postId })
    const removeResponse = createResponse()
    await postController.remove(requestWith({
      params: { postId }, user: { id: userId, roles: ['admin'] }
    }), removeResponse as unknown as Response)
    expect(removeResponse.status).toHaveBeenCalledWith(204)

    postService.canManage.mockResolvedValueOnce(false)
    const forbiddenRemoveResponse = createResponse()
    await postController.remove(requestWith({
      params: { postId }, user: { id: userId, roles: [] }
    }), forbiddenRemoveResponse as unknown as Response)
    expect(forbiddenRemoveResponse.status).toHaveBeenCalledWith(403)

    const unauthenticatedRemoveResponse = createResponse()
    await postController.remove(requestWith({ params: { postId } }), unauthenticatedRemoveResponse as unknown as Response)
    expect(unauthenticatedRemoveResponse.status).toHaveBeenCalledWith(401)

    postService.canManage.mockResolvedValueOnce(true)
    postService.softDelete.mockResolvedValueOnce(undefined)
    const missingRemoveResponse = createResponse()
    await postController.remove(requestWith({
      params: { postId }, user: { id: userId, roles: ['admin'] }
    }), missingRemoveResponse as unknown as Response)
    expect(missingRemoveResponse.status).toHaveBeenCalledWith(404)
  })
})

describe('content type controllers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the available content types', async () => {
    const contentTypes = [{ id: postId, code: 'recipe', name: 'Receta' }]
    contentTypeService.list.mockResolvedValue(contentTypes)
    const response = createResponse()

    await contentTypeController.list(requestWith({}), response as unknown as Response)

    expect(response.json).toHaveBeenCalledWith(contentTypes)
  })
})

describe('comment and reaction controllers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lists, creates and removes comments', async () => {
    commentService.listByPost.mockResolvedValue([])
    const listResponse = createResponse()
    await commentController.list(requestWith({ params: { postId } }), listResponse as unknown as Response)
    expect(listResponse.json).toHaveBeenCalledWith({ data: [] })

    commentService.create.mockResolvedValue({ id: commentId })
    const createResponseValue = createResponse()
    await commentController.create(requestWith({
      params: { postId }, body: { body: 'Nice recipe' }, user: { id: userId }
    }), createResponseValue as unknown as Response)
    expect(createResponseValue.status).toHaveBeenCalledWith(201)

    const unauthenticatedCreateResponse = createResponse()
    await commentController.create(requestWith({
      params: { postId }, body: { body: 'Nice recipe' }
    }), unauthenticatedCreateResponse as unknown as Response)
    expect(unauthenticatedCreateResponse.status).toHaveBeenCalledWith(401)

    commentService.create.mockResolvedValueOnce(null)
    const missingPostResponse = createResponse()
    await commentController.create(requestWith({
      params: { postId }, body: { body: 'Nice recipe' }, user: { id: userId }
    }), missingPostResponse as unknown as Response)
    expect(missingPostResponse.status).toHaveBeenCalledWith(401)

    commentService.softDelete.mockResolvedValue({ id: commentId })
    const removeResponse = createResponse()
    await commentController.remove(requestWith({
      params: { commentId }, user: { id: userId, roles: ['participant'] }
    }), removeResponse as unknown as Response)
    expect(removeResponse.status).toHaveBeenCalledWith(204)

    const unauthenticatedRemoveResponse = createResponse()
    await commentController.remove(requestWith({ params: { commentId } }), unauthenticatedRemoveResponse as unknown as Response)
    expect(unauthenticatedRemoveResponse.status).toHaveBeenCalledWith(401)

    commentService.softDelete.mockResolvedValueOnce(undefined)
    const missingCommentResponse = createResponse()
    await commentController.remove(requestWith({
      params: { commentId }, user: { id: userId, roles: [] }
    }), missingCommentResponse as unknown as Response)
    expect(missingCommentResponse.status).toHaveBeenCalledWith(404)
  })

  it('toggles reactions', async () => {
    reactionService.toggle.mockResolvedValue({ id: 'reaction-id' })
    const response = createResponse()
    await reactionController.toggle(requestWith({
      params: { postId }, body: { type: 'like' }, user: { id: userId }
    }), response as unknown as Response)
    expect(response.json).toHaveBeenCalled()

    const unauthenticatedResponse = createResponse()
    await reactionController.toggle(requestWith({
      params: { postId }, body: { type: 'like' }
    }), unauthenticatedResponse as unknown as Response)
    expect(unauthenticatedResponse.status).toHaveBeenCalledWith(401)

    reactionService.toggle.mockResolvedValueOnce(null)
    const removedResponse = createResponse()
    await reactionController.toggle(requestWith({
      params: { postId }, body: { type: 'like' }, user: { id: userId }
    }), removedResponse as unknown as Response)
    expect(removedResponse.status).toHaveBeenCalledWith(200)
  })
})

describe('admin controllers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lists users and updates status', async () => {
    adminService.listUsers.mockResolvedValue({ data: [], pagination: {} })
    const listResponse = createResponse()
    await adminController.listUsers(requestWith({ query: {} }), listResponse as unknown as Response)
    expect(listResponse.json).toHaveBeenCalled()

    adminService.updateUserStatus.mockResolvedValue({ id: userId, status: 'active' })
    const updateResponse = createResponse()
    await adminController.updateUserStatus(requestWith({
      params: { userId }, body: { status: 'active' }, user: { id: 'other-user' }
    }), updateResponse as unknown as Response)
    expect(updateResponse.json).toHaveBeenCalled()

    const selfResponse = createResponse()
    await adminController.updateUserStatus(requestWith({
      params: { userId }, body: { status: 'suspended' }, user: { id: userId }
    }), selfResponse as unknown as Response)
    expect(selfResponse.status).toHaveBeenCalledWith(400)

    adminService.updateUserStatus.mockResolvedValueOnce(undefined)
    const missingResponse = createResponse()
    await adminController.updateUserStatus(requestWith({
      params: { userId }, body: { status: 'deleted' }, user: { id: 'other-user' }
    }), missingResponse as unknown as Response)
    expect(missingResponse.status).toHaveBeenCalledWith(404)
  })
})
