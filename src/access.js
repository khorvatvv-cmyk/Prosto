export const STAFF_ROLES = ['manager', 'rof', 'specialist']

export const HOME_PAGE_BY_ROLE = {
  user: 'dashboard',
  manager: 'manager',
  specialist: 'specialist',
  rof: 'rof',
  admin: 'admin',
}

export const ALLOWED_PAGES_BY_ROLE = {
  user: new Set(['dashboard', 'new', 'detail', 'important', 'notifs', 'manager-chat', 'profile']),
  manager: new Set(['manager', 'profile']),
  specialist: new Set(['specialist', 'profile']),
  rof: new Set(['rof', 'profile']),
  admin: new Set(['dashboard', 'new', 'detail', 'important', 'notifs', 'manager-chat', 'profile', 'admin', 'specialist', 'manager', 'rof']),
}

export function homePageForRole(role) {
  return HOME_PAGE_BY_ROLE[role] || 'dashboard'
}

export function canAccessPage(role, page) {
  return Boolean(ALLOWED_PAGES_BY_ROLE[role]?.has(page))
}
