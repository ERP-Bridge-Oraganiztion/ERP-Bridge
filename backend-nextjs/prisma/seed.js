const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10)
  const organization = await prisma.organization.upsert({
    where: { name: 'ERP Bridge' },
    update: {},
    create: { name: 'ERP Bridge' },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@erpbridge.com' },
    update: { organizationId: organization.id, username: 'admin' },
    create: {
      name: 'Enterprise Administrator',
      username: 'admin',
      email: 'admin@erpbridge.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      organizationId: organization.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'pm@erpbridge.com' },
    update: { organizationId: organization.id, username: 'projectmanager' },
    create: {
      name: 'Technical Project Manager',
      username: 'projectmanager',
      email: 'pm@erpbridge.com',
      passwordHash,
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE',
      organizationId: organization.id,
    },
  })

  const existingProject = await prisma.project.findFirst({
    where: { name: 'Odoo to SAP ERP Migration' },
  })
  if (!existingProject) {
    await prisma.project.create({
      data: {
        name: 'Odoo to SAP ERP Migration',
        description:
          'Enterprise migration project consolidating 5 country divisions using legacy Odoo 17 to unified SAP S/4HANA cloud instances.',
        sourceErp: 'Odoo',
        status: 'ACTIVE',
        createdById: admin.id,
      },
    })
  }

  console.log('Seed complete. Login with admin@erpbridge.com / pm@erpbridge.com, password: Password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
