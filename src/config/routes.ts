export const ROUTES = {
  LOGIN: '/login',

  ADMIN: {
    DASHBOARD: '/admin',
    ORDERS: '/admin/orders',
    CERTIFICATION: '/admin/certification',
    PERSONNEL: '/admin/personnel',
    MATERIALS: '/admin/materials',
    SETTINGS: '/admin/settings',
  },

  TECHNICIAN: {
    DASHBOARD: '/tech',
    ORDERS: '/tech/orders',
    RUECKMELDUNG: '/tech/rueckmeldung',
    SCHEDULE: '/tech/schedule',
  },

  CONTRACTOR: {
    DASHBOARD: '/contractor',
    ORDERS: '/contractor/orders',
    DOCUMENTS: '/contractor/documents',
    CERTIFICATIONS: '/contractor/certifications',
  },
} as const
