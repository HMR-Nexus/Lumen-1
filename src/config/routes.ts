export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  ADMIN: {
    DASHBOARD: '/admin',
    ORDERS: '/admin/orders',
    ORDERS_NEW: '/admin/orders/new',
    ORDERS_EDIT: '/admin/orders/:id/edit',
    ORDERS_ASSIGN: '/admin/orders/:id/assign',
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
