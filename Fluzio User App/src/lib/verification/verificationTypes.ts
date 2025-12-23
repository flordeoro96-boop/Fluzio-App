/**
 * Business Verification Types
 * For verified business badge (L5+ Gold/Platinum, L6 Silver+)
 */

export type VerificationStatus = 
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type DocumentType = 
  | 'BUSINESS_REGISTRATION'
  | 'TAX_ID'
  | 'PROOF_OF_ADDRESS'
  | 'FINANCIAL_STATEMENT'
  | 'PORTFOLIO'
  | 'CLIENT_TESTIMONIAL'
  | 'MEDIA_COVERAGE'
  | 'PROFESSIONAL_REFERENCE';

export interface VerificationDocument {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verified: boolean;
  rejectionReason?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName: string;
  
  // Business Details
  registrationNumber?: string;
  taxId?: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  
  businessType: 'SOLE_PROPRIETOR' | 'LLC' | 'CORPORATION' | 'PARTNERSHIP' | 'NON_PROFIT';
  industry: string;
  yearsInBusiness: number;
  website?: string;
  
  // Documents
  documents: VerificationDocument[];
  
  // Status
  status: VerificationStatus;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin user ID
  reviewNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document requirements by level
 */
export const VERIFICATION_REQUIREMENTS = {
  // Level 4: Basic verification
  4: {
    required: ['BUSINESS_REGISTRATION', 'TAX_ID', 'PROOF_OF_ADDRESS'],
    optional: []
  },
  
  // Level 5: Advanced verification
  5: {
    required: ['BUSINESS_REGISTRATION', 'TAX_ID', 'PROOF_OF_ADDRESS', 'PORTFOLIO'],
    optional: ['CLIENT_TESTIMONIAL', 'MEDIA_COVERAGE']
  },
  
  // Level 6: Elite verification
  6: {
    required: ['BUSINESS_REGISTRATION', 'TAX_ID', 'FINANCIAL_STATEMENT', 'PORTFOLIO', 'PROFESSIONAL_REFERENCE'],
    optional: ['MEDIA_COVERAGE', 'CLIENT_TESTIMONIAL']
  }
};

/**
 * Badge eligibility rules
 */
export function isEligibleForVerifiedBadge(
  level: number,
  tier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM'
): boolean {
  if (level >= 6) {
    // Level 6: Silver, Gold, Platinum
    return tier === 'SILVER' || tier === 'GOLD' || tier === 'PLATINUM';
  }
  
  if (level === 5) {
    // Level 5: Gold, Platinum only
    return tier === 'GOLD' || tier === 'PLATINUM';
  }
  
  return false;
}

/**
 * Get required documents for level
 */
export function getRequiredDocuments(level: number): DocumentType[] {
  const reqs = VERIFICATION_REQUIREMENTS[level as keyof typeof VERIFICATION_REQUIREMENTS];
  return (reqs?.required || []) as DocumentType[];
}

/**
 * Check if verification request is complete
 */
export function isVerificationComplete(
  request: VerificationRequest,
  level: number
): { complete: boolean; missing: DocumentType[] } {
  const required = getRequiredDocuments(level);
  const uploaded = request.documents.map(doc => doc.type);
  const missing = required.filter(type => !uploaded.includes(type));
  
  return {
    complete: missing.length === 0,
    missing
  };
}

export default {
  VERIFICATION_REQUIREMENTS,
  isEligibleForVerifiedBadge,
  getRequiredDocuments,
  isVerificationComplete
};
