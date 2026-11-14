import {
  createPostSchema,
  listPostsSchema,
  postIdSchema,
  updatePostSchema
} from '../../../src/schemas/post.schema.js'

const postId = '550e8400-e29b-41d4-a716-446655440000'

describe('post schemas', () => {
  it('validates and trims a post', () => {
    expect(createPostSchema.parse({
      title: '  Healthy recipe  ',
      description: 'Simple description',
      contentTypeId: postId
    })).toMatchObject({ title: 'Healthy recipe' })
  })

  it('rejects invalid post data', () => {
    expect(createPostSchema.safeParse({
      title: 'No',
      contentTypeId: 'invalid'
    }).success).toBe(false)
  })

  it('requires at least one update field', () => {
    expect(updatePostSchema.safeParse({}).success).toBe(false)
    expect(updatePostSchema.safeParse({ status: 'published' }).success)
      .toBe(true)
  })

  it('validates post IDs and pagination', () => {
    expect(postIdSchema.safeParse({ postId }).success).toBe(true)
    expect(listPostsSchema.parse({ page: '2' })).toEqual({
      page: 2,
      limit: 20
    })
  })
})
