import { asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { contentTypes } from '../db/schema/content-types.js'

export const list = async () => {
  return db
    .select({
      id: contentTypes.id,
      code: contentTypes.code,
      name: contentTypes.name
    })
    .from(contentTypes)
    .orderBy(asc(contentTypes.name))
}
