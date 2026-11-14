import {
  commentIdSchema,
  commentParamsSchema,
  createCommentSchema
} from '../../../src/schemas/comment.schema.js'

const postId = '550e8400-e29b-41d4-a716-446655440000'

describe('comment schemas', () => {
  it('validates comment identifiers', () => {
    expect(commentParamsSchema.safeParse({ postId }).success).toBe(true)
    expect(commentIdSchema.safeParse({ commentId: postId }).success).toBe(true)
  })

  it('trims and validates comment bodies', () => {
    expect(createCommentSchema.parse({ body: '  Nice recipe  ' })).toEqual({
      body: 'Nice recipe'
    })
    expect(createCommentSchema.safeParse({ body: '   ' }).success).toBe(false)
  })

  it('rejects comments longer than 2000 characters', () => {
    expect(createCommentSchema.safeParse({ body: 'a'.repeat(2001) }).success)
      .toBe(false)
  })
})
