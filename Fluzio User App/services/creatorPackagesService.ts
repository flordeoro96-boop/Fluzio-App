/**
 * Creator Service Packages Service
 * 
 * Manages creator service packages (Bronze, Silver, Gold tiers):
 * - Create and manage package offerings
 * - Pricing and deliverables
 * - Turnaround times
 * - Package comparison
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp
} from '../services/firestoreCompat';
import { db } from './apiService';

// ============================================================================
// TYPES
// ============================================================================

export type PackageTier = 'bronze' | 'silver' | 'gold' | 'custom';

export interface ServicePackage {
  id: string;
  creatorId: string;
  creatorName: string;
  tier: PackageTier;
  name: string;
  description: string;
  price: number;
  currency: string;
  deliveryDays: number;
  revisions: number; // -1 for unlimited
  features: string[];
  deliverables: string[];
  isActive: boolean;
  isPopular?: boolean; // Highlight as most popular
  displayOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PackageComparison {
  bronze?: ServicePackage;
  silver?: ServicePackage;
  gold?: ServicePackage;
  custom?: ServicePackage[];
}

// ============================================================================
// PACKAGE MANAGEMENT
// ============================================================================

/**
 * Create a new service package
 */
export const createServicePackage = async (
  packageData: Omit<ServicePackage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const newPackage: Omit<ServicePackage, 'id'> = {
      ...packageData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'servicePackages'), newPackage);
    console.log('✅ Service package created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating service package:', error);
    throw error;
  }
};

/**
 * Update an existing service package
 */
export const updateServicePackage = async (
  packageId: string,
  updates: Partial<Omit<ServicePackage, 'id' | 'creatorId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const packageRef = doc(db, 'servicePackages', packageId);
    
    await updateDoc(packageRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Service package updated');
  } catch (error) {
    console.error('❌ Error updating service package:', error);
    throw error;
  }
};

/**
 * Delete a service package
 */
export const deleteServicePackage = async (packageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'servicePackages', packageId));
    console.log('✅ Service package deleted');
  } catch (error) {
    console.error('❌ Error deleting service package:', error);
    throw error;
  }
};

/**
 * Toggle package active status
 */
export const togglePackageStatus = async (packageId: string, isActive: boolean): Promise<void> => {
  try {
    await updateServicePackage(packageId, { isActive });
    console.log(`✅ Package ${isActive ? 'activated' : 'deactivated'}`);
  } catch (error) {
    console.error('❌ Error toggling package status:', error);
    throw error;
  }
};

// ============================================================================
// PACKAGE QUERIES
// ============================================================================

/**
 * Get all packages for a creator
 */
export const getCreatorPackages = async (creatorId: string): Promise<ServicePackage[]> => {
  try {
    const packagesQuery = query(
      collection(db, 'servicePackages'),
      where('creatorId', '==', creatorId),
      orderBy('displayOrder', 'asc')
    );
    
    const snapshot = await getDocs(packagesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ServicePackage));
  } catch (error) {
    console.error('❌ Error fetching creator packages:', error);
    return [];
  }
};

/**
 * Get active packages for a creator (public-facing)
 */
export const getActiveCreatorPackages = async (creatorId: string): Promise<ServicePackage[]> => {
  try {
    const packagesQuery = query(
      collection(db, 'servicePackages'),
      where('creatorId', '==', creatorId),
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    
    const snapshot = await getDocs(packagesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ServicePackage));
  } catch (error) {
    console.error('❌ Error fetching active packages:', error);
    return [];
  }
};

/**
 * Get a single package by ID
 */
export const getPackageById = async (packageId: string): Promise<ServicePackage | null> => {
  try {
    const packageDoc = await getDoc(doc(db, 'servicePackages', packageId));
    
    if (packageDoc.exists()) {
      return {
        id: packageDoc.id,
        ...packageDoc.data()
      } as ServicePackage;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching package:', error);
    return null;
  }
};

/**
 * Get organized package comparison for display
 */
export const getPackageComparison = async (creatorId: string): Promise<PackageComparison> => {
  try {
    const packages = await getActiveCreatorPackages(creatorId);
    
    const comparison: PackageComparison = {
      custom: []
    };
    
    packages.forEach(pkg => {
      if (pkg.tier === 'bronze') {
        comparison.bronze = pkg;
      } else if (pkg.tier === 'silver') {
        comparison.silver = pkg;
      } else if (pkg.tier === 'gold') {
        comparison.gold = pkg;
      } else if (pkg.tier === 'custom') {
        comparison.custom!.push(pkg);
      }
    });
    
    return comparison;
  } catch (error) {
    console.error('❌ Error getting package comparison:', error);
    return {};
  }
};

// ============================================================================
// PACKAGE TEMPLATES
// ============================================================================

/**
 * Get default package templates for creators to customize
 */
export const getPackageTemplates = (category: string = 'content'): Partial<ServicePackage>[] => {
  const templates: Record<string, Partial<ServicePackage>[]> = {
    content: [
      {
        tier: 'bronze',
        name: 'Starter Package',
        description: 'Perfect for getting started with professional content',
        deliveryDays: 7,
        revisions: 2,
        features: [
          '1 high-quality piece of content',
          'Basic editing',
          'Social media optimization',
          'Commercial usage rights'
        ],
        deliverables: [
          'Final content file',
          'Usage guidelines'
        ],
        displayOrder: 1
      },
      {
        tier: 'silver',
        name: 'Professional Package',
        description: 'Enhanced content with additional revisions and support',
        deliveryDays: 5,
        revisions: 4,
        features: [
          '3 high-quality pieces of content',
          'Professional editing',
          'Multi-platform optimization',
          'Priority support',
          'Commercial usage rights',
          'Source files included'
        ],
        deliverables: [
          'Final content files (3)',
          'Source files',
          'Usage guidelines',
          'Platform-specific versions'
        ],
        displayOrder: 2,
        isPopular: true
      },
      {
        tier: 'gold',
        name: 'Premium Package',
        description: 'Complete content solution with premium features',
        deliveryDays: 3,
        revisions: -1,
        features: [
          '5 high-quality pieces of content',
          'Premium editing & effects',
          'Multi-platform optimization',
          'Unlimited revisions',
          'Priority 24/7 support',
          'Commercial usage rights',
          'Source files included',
          'Strategy consultation',
          'Performance analytics'
        ],
        deliverables: [
          'Final content files (5)',
          'Source files',
          'Usage guidelines',
          'Platform-specific versions',
          'Performance report',
          'Strategy document'
        ],
        displayOrder: 3
      }
    ],
    photography: [
      {
        tier: 'bronze',
        name: 'Basic Shoot',
        description: '1-hour photo session with edited images',
        deliveryDays: 5,
        revisions: 1,
        features: [
          '1-hour photo session',
          '10 edited photos',
          'Basic retouching',
          'Digital delivery'
        ],
        deliverables: [
          '10 high-resolution images',
          'Online gallery'
        ],
        displayOrder: 1
      },
      {
        tier: 'silver',
        name: 'Professional Shoot',
        description: '2-hour session with premium editing',
        deliveryDays: 3,
        revisions: 2,
        features: [
          '2-hour photo session',
          '25 edited photos',
          'Professional retouching',
          'Multiple locations',
          'Digital delivery',
          'Print rights'
        ],
        deliverables: [
          '25 high-resolution images',
          'Online gallery',
          'Print-ready files'
        ],
        displayOrder: 2,
        isPopular: true
      },
      {
        tier: 'gold',
        name: 'Premium Experience',
        description: 'Full-day session with complete creative control',
        deliveryDays: 2,
        revisions: -1,
        features: [
          'Full-day photo session',
          '50+ edited photos',
          'Premium retouching & effects',
          'Multiple locations & outfits',
          'Hair & makeup coordination',
          'Digital delivery',
          'Print & commercial rights',
          'Custom album design'
        ],
        deliverables: [
          '50+ high-resolution images',
          'Online gallery',
          'Print-ready files',
          'Custom photo album',
          'Behind-the-scenes photos'
        ],
        displayOrder: 3
      }
    ],
    design: [
      {
        tier: 'bronze',
        name: 'Basic Design',
        description: 'Essential design for your brand',
        deliveryDays: 5,
        revisions: 2,
        features: [
          '2 initial concepts',
          'Basic design',
          'Standard formats',
          'Email support'
        ],
        deliverables: [
          'Final design files',
          'Standard formats (PNG, JPG)'
        ],
        displayOrder: 1
      },
      {
        tier: 'silver',
        name: 'Professional Design',
        description: 'Comprehensive design with multiple formats',
        deliveryDays: 3,
        revisions: 4,
        features: [
          '4 initial concepts',
          'Professional design',
          'Multiple format exports',
          'Source files included',
          'Priority support',
          'Brand guidelines'
        ],
        deliverables: [
          'Final design files',
          'Source files (AI, PSD)',
          'Multiple formats',
          'Brand guide document'
        ],
        displayOrder: 2,
        isPopular: true
      },
      {
        tier: 'gold',
        name: 'Premium Branding',
        description: 'Complete branding solution',
        deliveryDays: 2,
        revisions: -1,
        features: [
          'Unlimited concepts',
          'Premium design',
          'Full brand identity',
          'Source files included',
          '24/7 priority support',
          'Complete brand guidelines',
          'Social media templates',
          'Brand strategy consultation'
        ],
        deliverables: [
          'Complete brand package',
          'Source files',
          'Brand guidelines',
          'Social media kit',
          'Marketing templates',
          'Style guide'
        ],
        displayOrder: 3
      }
    ]
  };
  
  return templates[category] || templates.content;
};

/**
 * Create packages from template
 */
export const createPackagesFromTemplate = async (
  creatorId: string,
  creatorName: string,
  category: string = 'content',
  basePrices: { bronze: number; silver: number; gold: number }
): Promise<string[]> => {
  try {
    const templates = getPackageTemplates(category);
    const packageIds: string[] = [];
    
    for (const template of templates) {
      const price = template.tier === 'bronze' ? basePrices.bronze :
                   template.tier === 'silver' ? basePrices.silver :
                   basePrices.gold;
      
      const packageData: Omit<ServicePackage, 'id' | 'createdAt' | 'updatedAt'> = {
        creatorId,
        creatorName,
        tier: template.tier as PackageTier,
        name: template.name!,
        description: template.description!,
        price,
        currency: 'USD',
        deliveryDays: template.deliveryDays!,
        revisions: template.revisions!,
        features: template.features!,
        deliverables: template.deliverables!,
        isActive: true,
        isPopular: template.isPopular || false,
        displayOrder: template.displayOrder!
      };
      
      const id = await createServicePackage(packageData);
      packageIds.push(id);
    }
    
    console.log(`✅ Created ${packageIds.length} packages from template`);
    return packageIds;
  } catch (error) {
    console.error('❌ Error creating packages from template:', error);
    throw error;
  }
};

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get package performance stats
 */
export const getPackageStats = async (creatorId: string): Promise<{
  totalPackages: number;
  activePackages: number;
  mostPopular: ServicePackage | null;
  averagePrice: number;
  priceRange: { min: number; max: number };
}> => {
  try {
    const packages = await getCreatorPackages(creatorId);
    const activePackages = packages.filter(p => p.isActive);
    
    if (packages.length === 0) {
      return {
        totalPackages: 0,
        activePackages: 0,
        mostPopular: null,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 }
      };
    }
    
    const prices = packages.map(p => p.price);
    const totalPrice = prices.reduce((sum, p) => sum + p, 0);
    const mostPopular = packages.find(p => p.isPopular) || packages[0];
    
    return {
      totalPackages: packages.length,
      activePackages: activePackages.length,
      mostPopular,
      averagePrice: totalPrice / packages.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    };
  } catch (error) {
    console.error('❌ Error getting package stats:', error);
    return {
      totalPackages: 0,
      activePackages: 0,
      mostPopular: null,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 }
    };
  }
};
