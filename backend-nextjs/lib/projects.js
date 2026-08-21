import { prisma } from './prisma'
import { ApiError } from './errors'

export async function findProjectOrThrow(id) {
  const project = await prisma.project.findUnique({ where: { id: Number(id) } })
  if (!project) throw ApiError.notFound(`Project with id ${id} was not found.`)
  return project
}
