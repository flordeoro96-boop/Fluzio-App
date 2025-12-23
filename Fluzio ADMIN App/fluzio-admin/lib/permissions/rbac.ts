import { Admin, AdminRole } from '@/lib/types';

// Resources that can be accessed
export enum Resource {
  COUNTRIES = 'countries',
  BUSINESSES = 'businesses',
  USERS = 'users',
  CREATORS = 'creators',
  MISSIONS = 'missions',
  EVENTS = 'events',
  REWARDS = 'rewards',
  FINANCE = 'finance',
  MODERATION = 'moderation',
  ANALYTICS = 'analytics',
  ADMINS = 'admins',
  AUDIT_LOGS = 'audit_logs',
  SYSTEM = 'system',
}

// Actions that can be performed
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
  EXPORT = 'export',
}

// Permission matrix: [Role][Resource][Action]
const permissions: Record<
  AdminRole,
  Partial<Record<Resource, Action[]>>
> = {
  [AdminRole.SUPER_ADMIN]: {
    [Resource.COUNTRIES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.BUSINESSES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE, Action.SUSPEND],
    [Resource.USERS]: [Action.READ, Action.UPDATE, Action.SUSPEND],
    [Resource.CREATORS]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.SUSPEND],
    [Resource.MISSIONS]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.REJECT],
    [Resource.EVENTS]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.REJECT],
    [Resource.REWARDS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.FINANCE]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.EXPORT],
    [Resource.MODERATION]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.REJECT],
    [Resource.ANALYTICS]: [Action.READ, Action.EXPORT],
    [Resource.ADMINS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.AUDIT_LOGS]: [Action.READ, Action.EXPORT],
    [Resource.SYSTEM]: [Action.READ, Action.UPDATE],
  },
  [AdminRole.COUNTRY_ADMIN]: {
    [Resource.COUNTRIES]: [Action.READ, Action.UPDATE],
    [Resource.BUSINESSES]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.SUSPEND],
    [Resource.USERS]: [Action.READ, Action.UPDATE],
    [Resource.CREATORS]: [Action.READ, Action.UPDATE, Action.APPROVE],
    [Resource.MISSIONS]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.REJECT],
    [Resource.EVENTS]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.REJECT],
    [Resource.REWARDS]: [Action.READ, Action.UPDATE],
    [Resource.FINANCE]: [Action.READ, Action.EXPORT],
    [Resource.MODERATION]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.REJECT],
    [Resource.ANALYTICS]: [Action.READ, Action.EXPORT],
    [Resource.AUDIT_LOGS]: [Action.READ],
  },
  [AdminRole.FINANCE]: {
    [Resource.BUSINESSES]: [Action.READ],
    [Resource.CREATORS]: [Action.READ],
    [Resource.FINANCE]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.EXPORT],
    [Resource.ANALYTICS]: [Action.READ, Action.EXPORT],
    [Resource.AUDIT_LOGS]: [Action.READ],
  },
  [AdminRole.MODERATOR]: {
    [Resource.USERS]: [Action.READ, Action.UPDATE, Action.SUSPEND],
    [Resource.CREATORS]: [Action.READ, Action.UPDATE, Action.SUSPEND],
    [Resource.MISSIONS]: [Action.READ, Action.UPDATE, Action.REJECT],
    [Resource.EVENTS]: [Action.READ, Action.UPDATE, Action.REJECT],
    [Resource.MODERATION]: [Action.READ, Action.UPDATE, Action.APPROVE, Action.REJECT],
    [Resource.ANALYTICS]: [Action.READ],
  },
  [AdminRole.OPS_SUPPORT]: {
    [Resource.BUSINESSES]: [Action.READ, Action.UPDATE],
    [Resource.USERS]: [Action.READ, Action.UPDATE],
    [Resource.CREATORS]: [Action.READ, Action.UPDATE],
    [Resource.MISSIONS]: [Action.READ, Action.UPDATE],
    [Resource.EVENTS]: [Action.READ, Action.UPDATE],
    [Resource.ANALYTICS]: [Action.READ],
  },
  [AdminRole.ANALYST_READONLY]: {
    [Resource.COUNTRIES]: [Action.READ],
    [Resource.BUSINESSES]: [Action.READ],
    [Resource.USERS]: [Action.READ],
    [Resource.CREATORS]: [Action.READ],
    [Resource.MISSIONS]: [Action.READ],
    [Resource.EVENTS]: [Action.READ],
    [Resource.REWARDS]: [Action.READ],
    [Resource.FINANCE]: [Action.READ],
    [Resource.ANALYTICS]: [Action.READ, Action.EXPORT],
  },
};

/**
 * Check if an admin has permission to perform an action on a resource
 */
export function canAccess(
  admin: Admin,
  resource: Resource,
  action: Action
): boolean {
  if (admin.status !== 'ACTIVE') {
    return false;
  }

  const rolePermissions = permissions[admin.role];
  if (!rolePermissions) {
    return false;
  }

  const resourceActions = rolePermissions[resource];
  if (!resourceActions) {
    return false;
  }

  return resourceActions.includes(action);
}

/**
 * Check if an admin has access to a specific country
 */
export function hasCountryAccess(admin: Admin, countryCode: string): boolean {
  if (admin.countryScopes.includes('GLOBAL')) {
    return true;
  }
  return admin.countryScopes.includes(countryCode);
}

/**
 * Get all resources an admin can access
 */
export function getAccessibleResources(admin: Admin): Resource[] {
  if (admin.status !== 'ACTIVE') {
    return [];
  }

  const rolePermissions = permissions[admin.role];
  if (!rolePermissions) {
    return [];
  }

  return Object.keys(rolePermissions) as Resource[];
}

/**
 * Get all actions an admin can perform on a resource
 */
export function getResourceActions(admin: Admin, resource: Resource): Action[] {
  if (admin.status !== 'ACTIVE') {
    return [];
  }

  const rolePermissions = permissions[admin.role];
  if (!rolePermissions) {
    return [];
  }

  return rolePermissions[resource] || [];
}
