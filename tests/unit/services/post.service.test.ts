import { jest } from '@jest/globals'

const select = jest.fn()
const insert = jest.fn()
const update = jest.fn()

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  db: { select, insert, update }
}))
jest.unstable_mockModule('../../../src/db/schema/posts.js', () => ({
  posts: {
    id: 'posts.id',
    status: 'posts.status',
    publishedAt: 'posts.publishedAt',
    authorId: 'posts.authorId',
    contentTypeId: 'posts.contentTypeId',
    title: 'posts.title',
    description: 'posts.description',
    createdAt: 'posts.createdAt',
    updatedAt: 'posts.updatedAt'
  }
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
jest.unstable_mockModule('../../../src/db/schema/content-types.js', () => ({
  contentTypes: {
    id: 'contentTypes.id',
    name: 'contentTypes.name'
  }
}))
jest.unstable_mockModule('drizzle-orm', () => ({
  and: jest.fn(),
  desc: jest.fn(),
  eq: jest.fn()
}))

const postService = await import('../../../src/services/post.service.js')

const queryChain = (result: unknown[]) => {
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

const singleQueryChain = (result: unknown[]) => {
  const chain = queryChain(result)
  chain.limit.mockResolvedValue(result)
  return chain
}

describe('post service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const postRow = {
    id: 'post-id',
    authorId: 'author-id',
    contentTypeId: 'type-id',
    title: 'Recipe',
    description: 'Recipe content',
    status: 'published',
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    authorFirstName: 'Eduardo',
    authorSecondName: null,
    authorLastName: 'Camberos',
    authorSecondLastName: null,
    contentTypeName: 'Receta'
  }

  const postView = {
    id: 'post-id',
    authorId: 'author-id',
    authorName: 'Eduardo Camberos',
    contentTypeId: 'type-id',
    contentTypeName: 'Receta',
    title: 'Recipe',
    content: 'Recipe content',
    status: 'published',
    publishedAt: postRow.publishedAt,
    createdAt: postRow.createdAt,
    updatedAt: postRow.updatedAt
  }

  it('lists published posts with pagination', async () => {
    const posts = [postRow]
    select.mockReturnValueOnce(queryChain(posts))

    await expect(postService.listPublished(2, 10)).resolves.toEqual({
      data: [postView],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 2 }
    })
  })

  it('moves to the next page when the page is full', async () => {
    const posts = Array.from({ length: 10 }, (_, index) => ({ id: `post-${index}` }))
    select.mockReturnValueOnce(queryChain(posts))

    await expect(postService.listPublished(1, 10)).resolves.toMatchObject({
      pagination: { total: 10, totalPages: 2 }
    })
  })

  it('finds a post or returns undefined', async () => {
    select.mockReturnValueOnce(singleQueryChain([postRow]))
    await expect(postService.findById('post-id')).resolves.toEqual(postView)

    select.mockReturnValueOnce(singleQueryChain([]))
    await expect(postService.findById('missing')).resolves.toBeUndefined()
  })

  it('creates a draft post', async () => {
    const post = { id: 'post-id', status: 'draft' }
    const chain = {
      values: jest.fn(),
      returning: jest.fn().mockResolvedValue([post])
    }
    chain.values.mockReturnValue(chain)
    insert.mockReturnValueOnce(chain)

    await expect(postService.create({
      title: 'Recipe',
      description: null,
      contentTypeId: 'type-id'
    }, 'user-id')).resolves.toEqual(post)
    expect(chain.values).toHaveBeenCalledWith(expect.objectContaining({
      authorId: 'user-id',
      status: 'draft'
    }))
  })

  it('updates and publishes a post', async () => {
    const post = { id: 'post-id', status: 'published' }
    const chain = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([post])
    }
    chain.set.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    update.mockReturnValueOnce(chain)

    await expect(postService.update('post-id', {
      status: 'published'
    })).resolves.toEqual(post)
    expect(chain.set).toHaveBeenCalledWith(expect.objectContaining({
      status: 'published',
      publishedAt: expect.any(Date)
    }))
  })

  it('does not assign a publication date while keeping a draft', async () => {
    const chain = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([{ id: 'post-id' }])
    }
    chain.set.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    update.mockReturnValueOnce(chain)

    await postService.update('post-id', { title: 'Draft update' })
    expect(chain.set).toHaveBeenCalledWith(expect.objectContaining({
      publishedAt: undefined
    }))
  })

  it('soft deletes a post', async () => {
    const post = { id: 'post-id', status: 'deleted' }
    const chain = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([post])
    }
    chain.set.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    update.mockReturnValueOnce(chain)

    await expect(postService.softDelete('post-id')).resolves.toEqual(post)
  })

  it('allows administrators to manage any post', async () => {
    await expect(postService.canManage('post-id', 'user-id', true))
      .resolves.toBe(true)
    expect(select).not.toHaveBeenCalled()
  })

  it('checks ownership for non-administrators', async () => {
    select.mockReturnValueOnce(singleQueryChain([{ id: 'post-id' }]))
    await expect(postService.canManage('post-id', 'user-id', false))
      .resolves.toBe(true)

    select.mockReturnValueOnce(singleQueryChain([]))
    await expect(postService.canManage('post-id', 'other-user', false))
      .resolves.toBe(false)
  })
})
