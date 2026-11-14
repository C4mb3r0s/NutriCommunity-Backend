import { jest } from '@jest/globals'

const select = jest.fn()
const insert = jest.fn()
const update = jest.fn()
const deleteQuery = jest.fn()

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  db: { select, insert, update, delete: deleteQuery }
}))
jest.unstable_mockModule('../../../src/db/schema/posts.js', () => ({
  posts: { id: 'posts.id', status: 'posts.status' }
}))
jest.unstable_mockModule('../../../src/db/schema/reactions.js', () => ({
  reactions: {
    id: 'reactions.id',
    postId: 'reactions.postId',
    userId: 'reactions.userId'
  }
}))
jest.unstable_mockModule('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn()
}))

const reactionService = await import('../../../src/services/reaction.service.js')

const singleChain = (result: unknown[]) => {
  const chain = {
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn()
  }
  chain.from.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.limit.mockResolvedValue(result)
  return chain
}

const returningChain = (result: unknown[]) => {
  const chain = {
    set: jest.fn(),
    values: jest.fn(),
    where: jest.fn(),
    returning: jest.fn().mockResolvedValue(result)
  }
  chain.set.mockReturnValue(chain)
  chain.values.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  return chain
}

describe('reaction service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null for unpublished posts', async () => {
    select.mockReturnValueOnce(singleChain([]))

    await expect(reactionService.toggle('post-id', 'user-id', 'like'))
      .resolves.toBeNull()
  })

  it('creates a reaction when one does not exist', async () => {
    select
      .mockReturnValueOnce(singleChain([{ id: 'post-id' }]))
      .mockReturnValueOnce(singleChain([]))
    const chain = returningChain([{ id: 'reaction-id', type: 'like' }])
    insert.mockReturnValueOnce(chain)

    await expect(reactionService.toggle('post-id', 'user-id', 'like'))
      .resolves.toEqual({ id: 'reaction-id', type: 'like' })
  })

  it('removes the current reaction when the same type is selected', async () => {
    const existing = { id: 'reaction-id', type: 'like' }
    select
      .mockReturnValueOnce(singleChain([{ id: 'post-id' }]))
      .mockReturnValueOnce(singleChain([existing]))
    const chain = { where: jest.fn().mockResolvedValue(undefined) }
    deleteQuery.mockReturnValueOnce(chain)

    await expect(reactionService.toggle('post-id', 'user-id', 'like'))
      .resolves.toBeNull()
  })

  it('updates an existing reaction to a new type', async () => {
    select
      .mockReturnValueOnce(singleChain([{ id: 'post-id' }]))
      .mockReturnValueOnce(singleChain([{ id: 'reaction-id', type: 'like' }]))
    const chain = returningChain([{ id: 'reaction-id', type: 'love' }])
    update.mockReturnValueOnce(chain)

    await expect(reactionService.toggle('post-id', 'user-id', 'love'))
      .resolves.toEqual({ id: 'reaction-id', type: 'love' })
  })
})
