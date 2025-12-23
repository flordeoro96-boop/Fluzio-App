import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { getAdminPermissions, canPerformAction, AdminPermissions } from '../services/adminAuthService';

/**
 * Hook for accessing admin authentication and permissions
 * Usage:
 * const { adminData, loading, hasPermission, checkScope } = useAdminAuth();
 */
export const useAdminAuth = () => {
  const { userProfile } = useAuth();
  const [adminData, setAdminData] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!userProfile?.uid) {
        setAdminData(null);
        setLoading(false);
        return;
      }

      try {
        const permissions = await getAdminPermissions(userProfile.uid);
        setAdminData(permissions);
      } catch (error) {
        console.error('[useAdminAuth] Error loading admin data:', error);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [userProfile?.uid]);

  /**
   * Check if admin has permission to perform an action
   */
  const hasPermission = (action: string, targetResource?: any): boolean => {
    if (!adminData) return false;
    return canPerformAction(adminData, action, targetResource);
  };

  /**
   * Check if a resource is within admin's scope
   */
  const checkScope = (resource: any): boolean => {
    if (!adminData) return false;
    
    // SUPER_ADMIN has access to everything
    if (adminData.role === 'SUPER_ADMIN') return true;
    
    // Check country scope
    if (adminData.countryId && resource.country) {
      if (adminData.countryId !== resource.country) return false;
    }
    
    // Check city scope
    if (adminData.cityId && resource.city) {
      if (adminData.cityId !== resource.city) return false;
    }
    
    // Check event assignment
    if (adminData.role === 'EVENT_ADMIN' && resource.eventId) {
      return adminData.assignedEventIds?.includes(resource.eventId) || false;
    }
    
    return true;
  };

  return {
    adminData,
    loading,
    isAdmin: !!adminData,
    hasPermission,
    checkScope
  };
};
