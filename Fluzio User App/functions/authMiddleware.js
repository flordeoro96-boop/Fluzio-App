/**
 * Admin RBAC Middleware
 * 
 * Provides role-based access control for admin operations.
 * Implements requireRole() and requireScope() guards.
 */

const admin = require('firebase-admin');

// Lazy load db to avoid initialization errors
let db = null;
const getDb = () => {
  if (!db) {
    db = admin.firestore();
  }
  return db;
};

/**
 * Verify user has required admin role
 * @param {string[]} allowedRoles - Array of allowed AdminRole values
 * @returns {Function} Middleware function that checks role
 */
const requireRole = (allowedRoles) => {
  return async (userId) => {
    try {
      console.log('[requireRole] Checking role for user:', userId);
      console.log('[requireRole] Allowed roles:', allowedRoles);
      
      // Get admin user document
      const adminSnapshot = await getDb().collection('adminUsers')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .limit(1)
        .get();
      
      if (adminSnapshot.empty) {
        console.log('[requireRole] User is not an admin');
        return {
          success: false,
          error: 'Not an admin user',
          code: 403
        };
      }
      
      const adminDoc = adminSnapshot.docs[0];
      const adminData = adminDoc.data();
      
      console.log('[requireRole] Found admin:', adminData.email, 'Role:', adminData.role);
      
      // Check if role is allowed
      if (!allowedRoles.includes(adminData.role)) {
        console.log('[requireRole] Role not allowed');
        return {
          success: false,
          error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}`,
          code: 403
        };
      }
      
      console.log('[requireRole] Role check passed');
      return {
        success: true,
        adminData: {
          id: adminDoc.id,
          userId: adminData.userId,
          email: adminData.email,
          role: adminData.role,
          countryId: adminData.countryId,
          cityId: adminData.cityId,
          assignedEventIds: adminData.assignedEventIds || [],
          permissions: adminData.permissions || {}
        }
      };
    } catch (error) {
      console.error('[requireRole] Error:', error);
      return {
        success: false,
        error: 'Failed to verify role',
        code: 500
      };
    }
  };
};

/**
 * Verify user has access to specific scope
 * @param {Object} adminData - Admin user data from requireRole
 * @param {Object} targetResource - Resource being accessed
 * @returns {Object} Success/failure result
 */
const requireScope = async (adminData, targetResource) => {
  try {
    const { role, countryId, cityId, assignedEventIds, permissions } = adminData;
    
    console.log('[requireScope] Checking scope for role:', role);
    console.log('[requireScope] Target resource:', targetResource);
    
    // SUPER_ADMIN has full access
    if (role === 'SUPER_ADMIN') {
      console.log('[requireScope] SUPER_ADMIN - full access granted');
      return { success: true };
    }
    
    // Check permission overrides first
    if (permissions && targetResource.action) {
      const permissionKey = `can${targetResource.action}`;
      if (permissionKey in permissions) {
        const hasPermission = permissions[permissionKey] === true;
        console.log(`[requireScope] Permission override for ${permissionKey}:`, hasPermission);
        if (!hasPermission) {
          return {
            success: false,
            error: 'Permission override denies this action',
            code: 403
          };
        }
      }
    }
    
    // COUNTRY_ADMIN must match country
    if (role === 'COUNTRY_ADMIN') {
      if (!countryId) {
        return {
          success: false,
          error: 'Admin has no country assignment',
          code: 403
        };
      }
      
      if (targetResource.country && targetResource.country !== countryId) {
        console.log(`[requireScope] Country mismatch: ${targetResource.country} !== ${countryId}`);
        return {
          success: false,
          error: `Access restricted to country: ${countryId}`,
          code: 403
        };
      }
      
      console.log('[requireScope] Country scope check passed');
      return { success: true };
    }
    
    // CITY_ADMIN must match city
    if (role === 'CITY_ADMIN') {
      if (!cityId) {
        return {
          success: false,
          error: 'Admin has no city assignment',
          code: 403
        };
      }
      
      if (targetResource.city && targetResource.city !== cityId) {
        console.log(`[requireScope] City mismatch: ${targetResource.city} !== ${cityId}`);
        return {
          success: false,
          error: `Access restricted to city: ${cityId}`,
          code: 403
        };
      }
      
      console.log('[requireScope] City scope check passed');
      return { success: true };
    }
    
    // EVENT_ADMIN must have event assigned
    if (role === 'EVENT_ADMIN') {
      // Allow creating new events
      if (!targetResource.eventId) {
        console.log('[requireScope] EVENT_ADMIN creating new event');
        return { success: true };
      }
      
      if (!assignedEventIds || !assignedEventIds.includes(targetResource.eventId)) {
        console.log('[requireScope] Event not assigned:', targetResource.eventId);
        return {
          success: false,
          error: 'Event not assigned to you',
          code: 403
        };
      }
      
      console.log('[requireScope] Event assignment check passed');
      return { success: true };
    }
    
    // SUPPORT_ADMIN has limited access
    if (role === 'SUPPORT_ADMIN') {
      const allowedActions = [
        'VIEW_USER', 'BAN_USER', 'UNBAN_USER', 
        'VIEW_REPORT', 'RESOLVE_REPORT',
        'VIEW_ANALYTICS'
      ];
      
      if (targetResource.action && !allowedActions.includes(targetResource.action)) {
        console.log('[requireScope] Support admin action not allowed:', targetResource.action);
        return {
          success: false,
          error: 'Support admins cannot perform this action',
          code: 403
        };
      }
      
      console.log('[requireScope] Support admin action allowed');
      return { success: true };
    }
    
    console.log('[requireScope] Unknown role:', role);
    return {
      success: false,
      error: 'Invalid admin role',
      code: 403
    };
  } catch (error) {
    console.error('[requireScope] Error:', error);
    return {
      success: false,
      error: 'Failed to verify scope',
      code: 500
    };
  }
};

/**
 * Log admin action
 * @param {Object} adminData - Admin user data
 * @param {string} action - Action performed
 * @param {string} targetType - Type of target (USER, BUSINESS, etc.)
 * @param {string} targetId - ID of target
 * @param {Object} details - Additional details
 * @param {Object} metadata - Request metadata (IP, user agent)
 */
const logAdminAction = async (adminData, action, targetType, targetId, details = {}, metadata = {}) => {
  try {
    await getDb().collection('adminLogs').add({
      adminUserId: adminData.id,
      adminEmail: adminData.email,
      adminRole: adminData.role,
      action,
      targetType,
      targetId,
      targetEmail: details.targetEmail || null,
      details,
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('[logAdminAction] Logged:', action, 'by', adminData.email);
  } catch (error) {
    console.error('[logAdminAction] Error logging action:', error);
    // Don't throw - logging failure shouldn't block the action
  }
};

/**
 * Get admin data for a user ID (convenience function)
 * @param {string} userId - User ID to check
 * @returns {Object|null} Admin data or null if not admin
 */
const getAdminData = async (userId) => {
  try {
    const adminSnapshot = await getDb().collection('adminUsers')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (adminSnapshot.empty) {
      return null;
    }
    
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    
    return {
      id: adminDoc.id,
      userId: adminData.userId,
      email: adminData.email,
      role: adminData.role,
      countryId: adminData.countryId,
      cityId: adminData.cityId,
      assignedEventIds: adminData.assignedEventIds || [],
      permissions: adminData.permissions || {},
      isActive: adminData.isActive
    };
  } catch (error) {
    console.error('[getAdminData] Error:', error);
    return null;
  }
};

/**
 * Apply scope filtering to a Firestore query
 * Automatically filters based on admin's geographic scope or event assignments
 * @param {Query} query - Firestore query to filter
 * @param {Object} adminData - Admin user data
 * @param {Object} options - Filtering options
 * @returns {Query} Filtered query
 */
const applyScopeFilter = (query, adminData, options = {}) => {
  const { role, countryId, cityId, assignedEventIds } = adminData;
  const { entityType = 'general' } = options;
  
  // SUPER_ADMIN: No filtering
  if (role === 'SUPER_ADMIN') {
    return query;
  }
  
  // COUNTRY_ADMIN: Filter by country
  if (role === 'COUNTRY_ADMIN' && countryId) {
    return query.where('country', '==', countryId);
  }
  
  // CITY_ADMIN: Filter by city
  if (role === 'CITY_ADMIN' && cityId) {
    // Try both city and cityId fields
    return query.where('city', '==', cityId);
  }
  
  // EVENT_ADMIN: Filter by assigned events
  if (role === 'EVENT_ADMIN' && entityType === 'event') {
    if (!assignedEventIds || assignedEventIds.length === 0) {
      // Return query that matches nothing
      return query.where(admin.firestore.FieldPath.documentId(), '==', '__NO_MATCH__');
    }
    return query.where(admin.firestore.FieldPath.documentId(), 'in', assignedEventIds);
  }
  
  // SUPPORT_ADMIN: Very restrictive - only entities they've been assigned
  if (role === 'SUPPORT_ADMIN') {
    // Return query that matches nothing by default
    return query.where(admin.firestore.FieldPath.documentId(), '==', '__NO_MATCH__');
  }
  
  return query;
};

/**
 * Filter array of entities based on admin scope
 * Used when data is already fetched and needs client-side filtering
 * @param {Array} entities - Array of entities to filter
 * @param {Object} adminData - Admin user data
 * @param {Object} options - Filtering options
 * @returns {Array} Filtered entities
 */
const filterByAdminScope = (entities, adminData, options = {}) => {
  const { role, countryId, cityId, assignedEventIds } = adminData;
  const { entityType = 'general' } = options;
  
  // SUPER_ADMIN: No filtering
  if (role === 'SUPER_ADMIN') {
    return entities;
  }
  
  // COUNTRY_ADMIN: Filter by country
  if (role === 'COUNTRY_ADMIN' && countryId) {
    return entities.filter(entity => entity.country === countryId || entity.countryId === countryId);
  }
  
  // CITY_ADMIN: Filter by city
  if (role === 'CITY_ADMIN' && cityId) {
    return entities.filter(entity => entity.city === cityId || entity.cityId === cityId);
  }
  
  // EVENT_ADMIN: Filter by assigned events
  if (role === 'EVENT_ADMIN' && entityType === 'event') {
    return entities.filter(entity => assignedEventIds && assignedEventIds.includes(entity.id || entity.eventId));
  }
  
  // SUPPORT_ADMIN: Return empty array
  if (role === 'SUPPORT_ADMIN') {
    return [];
  }
  
  return entities;
};

/**
 * Enhanced audit logging with more details
 * @param {Object} adminData - Admin user data
 * @param {string} action - Action performed
 * @param {string} entityType - Type of entity (user, business, mission, etc)
 * @param {string} entityId - ID of affected entity
 * @param {Object} details - Additional details (before, after, metadata)
 * @param {Object} request - HTTP request object (for IP/userAgent)
 */
const logAdminActionEnhanced = async (adminData, action, entityType, entityId, details = {}, request = null) => {
  try {
    const logEntry = {
      // Admin info
      adminUserId: adminData.userId || adminData.id,
      adminEmail: adminData.email,
      adminRole: adminData.role,
      
      // Action info
      action: action,
      entityType: entityType,
      entityId: entityId,
      
      // Change tracking
      before: details.before || null,
      after: details.after || null,
      changes: details.changes || null,
      
      // Context
      reason: details.reason || null,
      notes: details.notes || null,
      
      // Request metadata
      ipAddress: request?.ip || request?.connection?.remoteAddress || null,
      userAgent: request?.get?.('user-agent') || null,
      
      // Timing
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    await getDb().collection('adminLogs').add(logEntry);
    console.log('[logAdminActionEnhanced] Logged:', action, 'on', entityType, entityId, 'by', adminData.email);
  } catch (error) {
    console.error('[logAdminActionEnhanced] Error logging action:', error);
    // Don't throw - logging failure shouldn't block the action
  }
};

/**
 * Validate that admin can access a specific entity
 * @param {Object} adminData - Admin user data
 * @param {Object} entity - Entity to check access for
 * @returns {boolean} True if access allowed
 */
const canAccessEntity = (adminData, entity) => {
  const { role, countryId, cityId, assignedEventIds } = adminData;
  
  // SUPER_ADMIN: Full access
  if (role === 'SUPER_ADMIN') {
    return true;
  }
  
  // COUNTRY_ADMIN: Check country match
  if (role === 'COUNTRY_ADMIN') {
    return entity.country === countryId || entity.countryId === countryId;
  }
  
  // CITY_ADMIN: Check city match
  if (role === 'CITY_ADMIN') {
    return entity.city === cityId || entity.cityId === cityId;
  }
  
  // EVENT_ADMIN: Check if entity is an assigned event
  if (role === 'EVENT_ADMIN') {
    return assignedEventIds && assignedEventIds.includes(entity.id || entity.eventId);
  }
  
  // SUPPORT_ADMIN: No direct access
  return false;
};

module.exports = {
  requireRole,
  requireScope,
  logAdminAction,
  getAdminData,
  applyScopeFilter,
  filterByAdminScope,
  logAdminActionEnhanced,
  canAccessEntity
};
