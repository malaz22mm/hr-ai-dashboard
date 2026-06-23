/**
 * Optional SUPER_ADMIN navigation metadata.
 * Wire `superAdminExtraNavItems` into Sidebar when adding a menu link (no existing file changes required until then).
 */
export const superAdminExtraNavItems = [
  {
    label: 'حساب موظف',
    to: '/users/create-employee-account',
    superAdminOnly: true as const,
  },
] as const
