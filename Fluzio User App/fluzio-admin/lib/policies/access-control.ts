// Policy-Based Access Control (PBAC) Engine
import {
  Admin,
  AdminRole,
  PolicyContext,
  PolicyDecision,
} from '@/lib/types';

// Action types for different operations
export type AdminAction =
  // Country actions
  | 'CHANGE_COUNTRY_PHASE'
  | 'EDIT_COUNTRY_SETTINGS'
  | 'ASSIGN_COUNTRY_ADMIN'
  // Business actions
  | 'VERIFY_BUSINESS'
  | 'SUSPEND_BUSINESS'
  | 'ADJUST_BUSINESS_TIER'
  // Creator actions
  | 'VERIFY_CREATOR'
  | 'SUSPEND_CREATOR'
  | 'FREEZE_PAYOUT'
  | 'UNFREEZE_PAYOUT'
  // Mission actions
  | 'RESOLVE_DISPUTE'
  | 'CANCEL_MISSION'
  // Event actions
  | 'APPROVE_EVENT'
  | 'CANCEL_EVENT'
  // Finance actions
  | 'APPROVE_PAYOUT'
  | 'HOLD_PAYOUT'
  | 'RELEASE_PAYOUT'
  | 'ISSUE_REFUND'
  // Moderation actions
  | 'ADD_STRIKES'
  | 'RESOLVE_REPORT'
  // Analytics actions
  | 'VIEW_ANALYTICS'
  | 'EXPORT_DATA'
  // Governance actions
  | 'EDIT_POLICIES'
  | 'EDIT_FEATURE_FLAGS'
  // System actions
  | 'VIEW_AUDIT_LOGS'
  | 'VIEW_SYSTEM_HEALTH';

/**
 * Core Policy Engine: Determines if an admin can perform an action
 * 
 * Decision logic:
 * 1. Check role-based permissions
 * 2. Check country scope (admin.countryScopes vs entity.countryId)
 * 3. Check entity state (risk scores, flags, dispute status)
 * 4. Check policy thresholds (budgets, limits)
 * 
 * @param admin - The admin attempting the action
 * @param action - The action being attempted
 * @param context - Additional context (entity, thresholds, etc.)
 * @returns PolicyDecision with allowed flag and reason
 */
export function canAccess(
  admin: Admin | null,
  action: AdminAction,
  context: PolicyContext = {}
): PolicyDecision {
  // No admin = no access
  if (!admin || admin.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Admin not authenticated or suspended' };
  }

  const { entity, thresholds } = context;

  // Check country scope first (except for SUPER_ADMIN with GLOBAL scope)
  if (entity?.countryId) {
    const hasGlobalScope = admin.countryScopes.includes('GLOBAL');
    const hasCountryScope = admin.countryScopes.includes(entity.countryId);

    if (!hasGlobalScope && !hasCountryScope) {
      return {
        allowed: false,
        reason: `Admin does not have access to country: ${entity.countryId}`,
      };
    }
  }

  // Role-based permission checks
  switch (action) {
    // ====== SUPER_ADMIN ONLY ======
    case 'CHANGE_COUNTRY_PHASE':
    case 'ASSIGN_COUNTRY_ADMIN':
    case 'EDIT_POLICIES':
    case 'EDIT_FEATURE_FLAGS':
      if (admin.role !== AdminRole.SUPER_ADMIN) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN role' };
      }
      return { allowed: true };

    // ====== COUNTRY ADMIN + SUPER ADMIN ======
    case 'EDIT_COUNTRY_SETTINGS':
      if (![AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN or COUNTRY_ADMIN role' };
      }
      return { allowed: true };

    case 'VERIFY_BUSINESS':
    case 'ADJUST_BUSINESS_TIER':
      if (![AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN or COUNTRY_ADMIN role' };
      }
      return { allowed: true };

    case 'VERIFY_CREATOR':
      if (![AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN or COUNTRY_ADMIN role' };
      }
      return { allowed: true };

    // ====== EVENT APPROVAL (threshold-based) ======
    case 'APPROVE_EVENT':
      if (![AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN or COUNTRY_ADMIN role' };
      }

      // Check budget threshold
      if (entity?.budget && thresholds?.eventApprovalLimit) {
        if (entity.budget > thresholds.eventApprovalLimit) {
          if (admin.role !== AdminRole.SUPER_ADMIN) {
            return {
              allowed: false,
              reason: `Event budget exceeds ${thresholds.eventApprovalLimit} threshold. Requires SUPER_ADMIN approval.`,
            };
          }
        }
      }

      return { allowed: true };

    // ====== DISPUTE RESOLUTION (threshold-based) ======
    case 'RESOLVE_DISPUTE':
      if (![AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN, AdminRole.OPS_SUPPORT].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN, COUNTRY_ADMIN, or OPS_SUPPORT role' };
      }

      // High refund percentages require super admin
      if (context.refundPercent && context.refundPercent > 50) {
        if (admin.role !== AdminRole.SUPER_ADMIN) {
          return {
            allowed: false,
            reason: 'Refunds over 50% require SUPER_ADMIN approval',
          };
        }
      }

      return { allowed: true };

    // ====== FINANCE ACTIONS ======
    case 'APPROVE_PAYOUT':
    case 'HOLD_PAYOUT':
    case 'RELEASE_PAYOUT':
      if (![AdminRole.SUPER_ADMIN, AdminRole.FINANCE].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN or FINANCE role' };
      }

      // Check creator trust score for payout approval
      if (action === 'APPROVE_PAYOUT' && entity) {
        const trustScore = entity.trustScore ?? 0;
        const minTrustScore = thresholds?.payoutReleaseTrustMin ?? 70;

        if (trustScore < minTrustScore) {
          if (admin.role !== AdminRole.SUPER_ADMIN) {
            return {
              allowed: false,
              reason: `Creator trust score (${trustScore}) below minimum (${minTrustScore}). Requires SUPER_ADMIN approval.`,
            };
          }
        }

        // Check if payout is frozen
        if (entity.payoutFrozen) {
          if (admin.role !== AdminRole.SUPER_ADMIN) {
            return {
              allowed: false,
              reason: 'Creator payout is frozen. Requires SUPER_ADMIN to release.',
            };
          }
        }
      }

      return { allowed: true };

    case 'ISSUE_REFUND':
      if (![AdminRole.SUPER_ADMIN, AdminRole.FINANCE].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN or FINANCE role' };
      }
      return { allowed: true };

    // ====== MODERATION ACTIONS ======
    case 'ADD_STRIKES':
    case 'RESOLVE_REPORT':
      if (![AdminRole.SUPER_ADMIN, AdminRole.MODERATOR, AdminRole.COUNTRY_ADMIN].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN, MODERATOR, or COUNTRY_ADMIN role' };
      }
      return { allowed: true };

    // ====== SUSPENSION ACTIONS ======
    case 'SUSPEND_BUSINESS':
    case 'SUSPEND_CREATOR':
      if (![AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN, AdminRole.MODERATOR].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN, COUNTRY_ADMIN, or MODERATOR role' };
      }

      // High-value entities require super admin
      if (entity?.riskScore && thresholds?.highRiskScore) {
        if (entity.riskScore < thresholds.highRiskScore) {
          // Low risk = valuable entity, need super admin
          if (admin.role !== AdminRole.SUPER_ADMIN) {
            return {
              allowed: false,
              reason: 'Suspending low-risk entities requires SUPER_ADMIN approval',
            };
          }
        }
      }

      return { allowed: true };

    case 'FREEZE_PAYOUT':
    case 'UNFREEZE_PAYOUT':
      if (![AdminRole.SUPER_ADMIN, AdminRole.FINANCE, AdminRole.COUNTRY_ADMIN].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN, FINANCE, or COUNTRY_ADMIN role' };
      }
      return { allowed: true };

    // ====== CANCELLATION ACTIONS ======
    case 'CANCEL_MISSION':
    case 'CANCEL_EVENT':
      if (![AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN, AdminRole.OPS_SUPPORT].includes(admin.role)) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN, COUNTRY_ADMIN, or OPS_SUPPORT role' };
      }
      return { allowed: true };

    // ====== ANALYTICS & VIEWING ======
    case 'VIEW_ANALYTICS':
    case 'VIEW_SYSTEM_HEALTH':
      // All roles can view analytics (scoped to their countries)
      return { allowed: true };

    case 'EXPORT_DATA':
      if (admin.role === AdminRole.ANALYST_READONLY) {
        return { allowed: false, reason: 'ANALYST_READONLY cannot export data' };
      }
      return { allowed: true };

    case 'VIEW_AUDIT_LOGS':
      // Only SUPER_ADMIN can view full audit logs
      if (admin.role !== AdminRole.SUPER_ADMIN) {
        return { allowed: false, reason: 'Requires SUPER_ADMIN role' };
      }
      return { allowed: true };

    // ====== DEFAULT DENY ======
    default:
      return { allowed: false, reason: `Unknown action: ${action}` };
  }
}

/**
 * Helper: Check if admin has country scope access
 */
export function hasCountryAccess(admin: Admin | null, countryId: string): boolean {
  if (!admin || admin.status !== 'ACTIVE') return false;
  if (admin.countryScopes.includes('GLOBAL')) return true;
  return admin.countryScopes.includes(countryId);
}

/**
 * Helper: Get accessible country IDs for an admin
 */
export function getAccessibleCountries(admin: Admin | null, allCountries: string[]): string[] {
  if (!admin || admin.status !== 'ACTIVE') return [];
  if (admin.countryScopes.includes('GLOBAL')) return allCountries;
  return admin.countryScopes;
}
