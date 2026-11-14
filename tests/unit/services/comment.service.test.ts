import { jest } from '@jest/globals'

const select = jest.fn()
const insert = jest.fn()
const update = jest.fn()

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  db: { select, insert, update }
}))
jest.unstable_mockModule('../../../src/db/schema/comments.js', () => ({
  comments: {
    id: 'comments.id',
    postId: 'comments.postId',
    userId: 'comments.userId',
    status: 'comments.status',
    createdAt: 'comments.createdAt',
    updatedAt: 'comments.updatedAt'
  }
}))
jest.unstable_mockModule('../../../src/db/schema/posts.js', () => ({
  posts: { id: 'posts.id', status: 'posts.status' }
}))
jest.unstable_mockModule('../../../src/db/schema/users.js', () => ({
  users: {
    id: 'users.id',
    firstName: 'users.firstName',
    secondName: 'users.secondName',
    lastName: 'users.lastName',
    secondLastName: 'users.secondLastName'
  }
}))
jest.unstable_mockModule('drizzle-orm', () => ({
  and: jest.fn(),
  asc: jest.fn(),
  count: jest.fn(),
  eq: jest.fn()
}))

const commentService = await import('../../../src/services/comment.service.js')

const listChain = (result: unknown[]) => {
  const chain = {
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn()
  }
  chain.from.mockReturnValue(chain)
  chain.innerJoin.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.orderBy.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  chain.offset.mockResolvedValue(result)
  return chain
}

const countChain = (result: unknown[]) => {
  const chain = {
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn()
  }
  chain.from.mockReturnValue(chain)
  chain.innerJoin.mockReturnValue(chain)
  chain.where.mockResolvedValue(result)
  return chain
}

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

describe('comment service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists active comments in creation order', async () => {
    const comments = [{
      id: 'comment-id',
      postId: 'post-id',
      userId: 'user-id',
      body: 'Comment',
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      firstName: 'Eduardo',
      secondName: null,
      lastName: 'Camberos',
      secondLastName: null
    }]
    select
      .mockReturnValueOnce(listChain(comments))
      .mockReturnValueOnce(countChain([{ total: 1 }]))

    await expect(commentService.listByPost('post-id')).resolves.toEqual({
      data: [{
        id: 'comment-id',
        postId: 'post-id',
        userId: 'user-id',
        authorName: 'Eduardo Camberos',
        body: 'Comment',
        createdAt: comments[0].createdAt,
        updatedAt: comments[0].updatedAt
      }],
      pagination: { page: 1, limit: 10, total: 1, hasMore: false }
    })
  })

  it('does not create comments on unpublished posts', async () => {
    select.mockReturnValueOnce(singleChain([]))

    await expect(commentService.create('post-id', 'user-id', 'Comment'))
      .resolves.toBeNull()
    expect(insert).not.toHaveBeenCalled()
  })

  it('creates comments on published posts', async () => {
    const comment = { id: 'comment-id', body: 'Comment' }
    select.mockReturnValueOnce(singleChain([{ id: 'post-id' }]))
    const chain = {
      values: jest.fn(),
      returning: jest.fn().mockResolvedValue([comment])
    }
    chain.values.mockReturnValue(chain)
    insert.mockReturnValueOnce(chain)

    await expect(commentService.create('post-id', 'user-id', 'Comment'))
      .resolves.toEqual(comment)
    expect(chain.values).toHaveBeenCalledWith({
      postId: 'post-id',
      userId: 'user-id',
      body: 'Comment'
    })
  })

  it('deletes only comments owned by regular users', async () => {
    const comment = { id: 'comment-id', status: 'deleted' }
    const chain = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([comment])
    }
    chain.set.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    update.mockReturnValueOnce(chain)

    await expect(commentService.softDelete(
      'comment-id',
      'user-id',
      false
    )).resolves.toEqual(comment)
  })

  it('allows administrators to delete any comment', async () => {
    const chain = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([])
    }
    chain.set.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    update.mockReturnValueOnce(chain)

    await expect(commentService.softDelete(
      'comment-id',
      'admin-id',
      true
    )).resolves.toBeUndefined()
  })
})
