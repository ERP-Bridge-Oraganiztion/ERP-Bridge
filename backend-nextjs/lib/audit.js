import { prisma } from './prisma'

export async function logAudit(userId, action, module, ipAddress) {
  try {
    await prisma.auditLog.create({
      data: { userId: userId ?? null, action, module, ipAddress: ipAddress || 'SYSTEM' },
    })
  } catch (err) {
    console.error('Failed to write audit log:', err)
  }
}
