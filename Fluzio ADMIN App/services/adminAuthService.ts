/**
 * Admin Auth Service
 * 
 * Frontend service for checking admin permissions and roles.
 * Works with the RBAC system implemented in backend.
 */

import { db } from './AuthContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { AdminRole } from '../types';

export interface AdminPermissions {
  userId?: string;
  role: AdminRole;
  countryId?: string;
  cityId?: string;
  assignedEventIds?: string[];
  permissions?: Record<string, boolean>;
}

/**
 * Get admin permissions for a user
 * @param userId - User ID to check
 * @returns Admin permissions or null if not an admin
 */
export const getAdminPermissions = async (userId: string): Promise<AdminPermissions | null> => {
  try {
    const adminQuery = query(
      collection(db, 'adminUsers'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      limit(1)
    );
    
    const snapshot = await getDocs(adminQuery);
    
    if (snapshot.empty) {
      console.log('[getAdminPermissions] User is not an admin:', userId);
      return null;
    }
    
    const adminData = snapshot.docs[0].data();
    
    console.log('[getAdminPermissions] Found admin:', adminData.email, 'Role:', adminData.role);
    
    return {
      userId: adminData.userId || userId,
      role: adminData.role as AdminRole,
      countryId: adminData.countryId,
      cityId: adminData.cityId,
      assignedEventIds: adminData.assignedEventIds || [],
      permissions: adminData.permissions || {}
    };
  } catch (error) {
    console.error('[getAdminPermissions] Error:', error);
    return null;
  }
};

/**
 * Check if admin can perform a specific action
 * @param adminPerms - Admin permissions from getAdminPermissions
 * @param action - Action to check (e.g., 'VIEW_USERS', 'APPROVE_LEVEL')
 * @param targetResource - Optional resource being accessed (for scope checks)
 * @returns true if action is allowed
 */
export const canPerformAction = (
  adminPerms: AdminPermissions,
  action: string,
  targetResource?: any
): boolean => {
  const { role, countryId, cityId, assignedEventIds, permissions } = adminPerms;
  
  // Check permission overrides first
  if (permissions && action in permissions) {
    return permissions[action] === true;
  }
  
  // SUPER_ADMIN can do everything
  if (role === AdminRole.SUPER_ADMIN) {
    return true;
  }
  
  // SUPPORT_ADMIN restrictions
  if (role === AdminRole.SUPPORT_ADMIN) {
    const supportActions = [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER', 
      'VIEW_REPORTS', 'RESOLVE_REPORT',
      'VIEW_ANALYTICS'
    ];
    return supportActions.includes(action);
  }
  
  // EVENT_ADMIN restrictions
  if (role === AdminRole.EVENT_ADMIN) {
    if (!action.includes('EVENT')) {
      return false;
    }
    if (targetResource?.eventId) {
      return assignedEventIds?.includes(targetResource.eventId) || false;
    }
    return true; // Can create new events
  }
  
  // COUNTRY_ADMIN scope check
  if (role === AdminRole.COUNTRY_ADMIN && targetResource?.country) {
    if (targetResource.country !== countryId) {
      return false;
    }
  }
  
  // CITY_ADMIN scope check
  if (role === AdminRole.CITY_ADMIN && targetResource?.city) {
    if (targetResource.city !== cityId) {
      return false;
    }
  }
  
  // Default permissions by role
  const rolePermissions: Record<AdminRole, string[]> = {
    [AdminRole.SUPER_ADMIN]: ['*'], // All actions
    [AdminRole.MODERATOR]: [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'VIEW_REPORTS', 'RESOLVE_REPORT', 'DELETE_CONTENT',
      'VIEW_AUDIT_LOGS'
    ],
    [AdminRole.SUPPORT]: [
      'VIEW_USERS', 'VIEW_REPORTS', 'VIEW_ANALYTICS',
      'VIEW_AUDIT_LOGS'
    ],
    [AdminRole.COUNTRY_ADMIN]: [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'APPROVE_LEVEL', 'REJECT_LEVEL', 'VERIFY_BUSINESS',
      'VIEW_SUBSCRIPTIONS', 'RESET_COUNTERS',
      'CREATE_EVENT', 'EDIT_EVENT', 'DELETE_EVENT', 'VIEW_EVENTS',
      'MANAGE_COHORTS', 'CREATE_COHORT', 'ACTIVATE_COHORT',
      'VIEW_REPORTS', 'RESOLVE_REPORT', 'DELETE_CONTENT',
      'VIEW_MISSIONS', 'APPROVE_MISSION', 'VIEW_ANALYTICS', 'EXPORT_DATA',
      'VIEW_AUDIT_LOGS', 'VIEW_BUSINESSES', 'MANAGE_ADMINS', 'MANAGE_SETTINGS', 'MANAGE_SUBSCRIPTIONS'
    ],
    [AdminRole.CITY_ADMIN]: [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'APPROVE_LEVEL', 'REJECT_LEVEL', 'VERIFY_BUSINESS',
      'VIEW_SUBSCRIPTIONS', 'RESET_COUNTERS',
      'CREATE_EVENT', 'EDIT_EVENT', 'DELETE_EVENT', 'VIEW_EVENTS',
      'VIEW_COHORTS',
      'VIEW_REPORTS', 'RESOLVE_REPORT',
      'VIEW_MISSIONS', 'APPROVE_MISSION', 'VIEW_ANALYTICS',
      'VIEW_AUDIT_LOGS', 'VIEW_BUSINESSES'
    ],
    [AdminRole.EVENT_ADMIN]: [
      'CREATE_EVENT', 'EDIT_EVENT', 'DELETE_EVENT', 'VIEW_EVENT_ANALYTICS', 'VIEW_EVENTS',
      'VIEW_AUDIT_LOGS'
    ],
    [AdminRole.SUPPORT_ADMIN]: [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'VIEW_REPORTS', 'RESOLVE_REPORT', 'VIEW_ANALYTICS',
      'VIEW_AUDIT_LOGS'
    ]
  };
  
  const allowedActions = rolePermissions[role] || [];
  return allowedActions.includes('*') || allowedActions.includes(action);
};

/**
 * Filter data by admin scope (country/city)
 * @param data - Array of data to filter
 * @param adminPerms - Admin permissions
 * @param getCountry - Function to extract country from data item
 * @param getCity - Function to extract city from data item
 * @returns Filtered data
 */
export const filterByScope = <T>(
  data: T[],
  adminPerms: AdminPermissions,
  getCountry?: (item: T) => string | undefined,
  getCity?: (item: T) => string | undefined
): T[] => {
  const { role, countryId, cityId } = adminPerms;
  
  // SUPER_ADMIN sees everything
  if (role === AdminRole.SUPER_ADMIN) {
    return data;
  }
  
  // COUNTRY_ADMIN filter by country
  if (role === AdminRole.COUNTRY_ADMIN && getCountry) {
    return data.filter(item => {
      const itemCountry = getCountry(item);
      return itemCountry === countryId;
    });
  }
  
  // CITY_ADMIN filter by city
  if (role === AdminRole.CITY_ADMIN && getCity) {
    return data.filter(item => {
      const itemCity = getCity(item);
      return itemCity === cityId;
    });
  }
  
  // EVENT_ADMIN and SUPPORT_ADMIN see everything (no geographic scope)
  return data;
};

/**
 * Get readable role name
 */
export const getRoleName = (role: AdminRole): string => {
  const roleNames: Record<AdminRole, string> = {
    [AdminRole.SUPER_ADMIN]: 'Super Admin',
    [AdminRole.MODERATOR]: 'Moderator',
    [AdminRole.SUPPORT]: 'Support',
    [AdminRole.COUNTRY_ADMIN]: 'Country Admin',
    [AdminRole.CITY_ADMIN]: 'City Admin',
    [AdminRole.EVENT_ADMIN]: 'Event Admin',
    [AdminRole.SUPPORT_ADMIN]: 'Support Admin'
  };
  
  return roleNames[role] || role;
};

/**
 * Get role color for UI badges
 */
export const getRoleColor = (role: AdminRole): string => {
  const roleColors: Record<AdminRole, string> = {
    [AdminRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-700 border-purple-300',
    [AdminRole.MODERATOR]: 'bg-red-100 text-red-700 border-red-300',
    [AdminRole.SUPPORT]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    [AdminRole.COUNTRY_ADMIN]: 'bg-blue-100 text-blue-700 border-blue-300',
    [AdminRole.CITY_ADMIN]: 'bg-green-100 text-green-700 border-green-300',
    [AdminRole.EVENT_ADMIN]: 'bg-orange-100 text-orange-700 border-orange-300',
    [AdminRole.SUPPORT_ADMIN]: 'bg-gray-100 text-gray-700 border-gray-300'
  };
  
  return roleColors[role] || 'bg-gray-100 text-gray-700 border-gray-300';
};

/**
 * Check if user is admin (any role)
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  const perms = await getAdminPermissions(userId);
  return perms !== null;
};

/**
 * Get scope description for display
 */
export const getScopeDescription = (adminPerms: AdminPermissions): string => {
  const { role, countryId, cityId } = adminPerms;
  
  if (role === AdminRole.SUPER_ADMIN) {
    return 'Global access';
  }
  
  if (role === AdminRole.COUNTRY_ADMIN && countryId) {
    return `${countryId} only`;
  }
  
  if (role === AdminRole.CITY_ADMIN && cityId) {
    return `${cityId} only`;
  }
  
  if (role === AdminRole.EVENT_ADMIN) {
    return 'Assigned events only';
  }
  
  if (role === AdminRole.SUPPORT_ADMIN) {
    return 'Support functions only';
  }
  
  return 'Limited access';
};
