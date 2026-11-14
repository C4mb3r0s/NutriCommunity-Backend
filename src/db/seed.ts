import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db, client } from './index.js'
import { contentTypes } from './schema/content-types.js'
import { roles } from './schema/roles.js'
import { units } from './schema/units.js'

async function seed (): Promise<void> {
  const roleValues = [
    { code: 'admin', name: 'Administrador / Nutriólogo' },
    { code: 'participant', name: 'Participante' }
  ] as const

  for (const role of roleValues) {
    const existingRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.code, role.code))
      .limit(1)

    if (existingRole.length === 0) {
      await db.insert(roles).values(role)
    }
  }

  const contentTypeValues = [
    { code: 'recipe', name: 'Receta' },
    { code: 'beverage', name: 'Bebida' },
    { code: 'snack', name: 'Snack' },
    { code: 'colacion', name: 'Colación' },
    { code: 'dessert', name: 'Postre' },
    { code: 'sauce', name: 'Salsa' },
    { code: 'guide', name: 'Guía' }
  ] as const

  for (const contentType of contentTypeValues) {
    const existingContentType = await db
      .select({ id: contentTypes.id, name: contentTypes.name })
      .from(contentTypes)
      .where(eq(contentTypes.code, contentType.code))
      .limit(1)

    const existing = existingContentType[0]

    if (!existing) {
      await db.insert(contentTypes).values(contentType)
    } else if (existing.name !== contentType.name) {
      await db
        .update(contentTypes)
        .set({ name: contentType.name })
        .where(eq(contentTypes.code, contentType.code))
    }
  }

  const unitValues = [
    { code: 'g', name: 'Gramo', dimension: 'mass' },
    { code: 'kg', name: 'Kilogramo', dimension: 'mass' },
    { code: 'ml', name: 'Mililitro', dimension: 'volume' },
    { code: 'l', name: 'Litro', dimension: 'volume' },
    { code: 'taza', name: 'Taza', dimension: 'volume' },
    { code: 'cucharada', name: 'Cucharada', dimension: 'spoon' },
    { code: 'cucharadita', name: 'Cucharadita', dimension: 'spoon' },
    { code: 'pieza', name: 'Pieza', dimension: 'count' }
  ] as const

  for (const unit of unitValues) {
    const existingUnit = await db
      .select({ id: units.id })
      .from(units)
      .where(eq(units.code, unit.code))
      .limit(1)

    if (existingUnit.length === 0) {
      await db.insert(units).values(unit)
    }
  }
}

try {
  await seed()
} catch (error: unknown) {
  console.error(error)
  process.exitCode = 1
} finally {
  await client.end()
}
