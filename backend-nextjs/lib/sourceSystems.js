/** Source systems with a verified live database connector. */

export const SOURCE_SYSTEMS = [
  { name: 'Generic MySQL Database', category: 'Generic', liveConnect: 'MYSQL' },
  { name: 'Generic PostgreSQL Database', category: 'Generic', liveConnect: 'POSTGRES' },

  { name: 'MySQL-based Custom ERP', category: 'Live DB Connect', liveConnect: 'MYSQL' },
  { name: 'Odoo', category: 'Live DB Connect', liveConnect: 'POSTGRES' },
  { name: 'Odoo Accounting', category: 'Live DB Connect', liveConnect: 'POSTGRES' },
  { name: 'ERPNext', category: 'Live DB Connect', liveConnect: 'MYSQL' },
]
