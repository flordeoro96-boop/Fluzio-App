import { db } from '../../services/apiService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from '../../services/firestoreCompat';

// ============================================================================
// TYPES
// ============================================================================

export interface MediaKitData {
  // Personal Info
  creatorName: string;
  bio: string;
  profileImage?: string;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;
  
  // Social Media
  instagram?: string;
  youtube?: string;
  twitter?: string;
  
  // Professional Stats
  totalProjects: number;
  avgRating: number;
  completionRate: number;
  responseRate: number;
  
  // Skills & Services
  skills: string[];
  services: string[];
  
  // Portfolio
  portfolioItems: Array<{
    title: string;
    description: string;
    imageUrl?: string;
    category: string;
  }>;
  
  // Testimonials
  testimonials: Array<{
    clientName: string;
    rating: number;
    review: string;
    date: Date;
  }>;
  
  // Rate Card
  packages: Array<{
    name: string;
    price: number;
    deliveryDays: number;
    description: string;
  }>;
  
  // Additional Info
  availability: string;
  preferredWorkStyle: string;
  languages: string[];
}

export interface SavedMediaKit {
  id: string;
  creatorId: string;
  templateId: string;
  data: MediaKitData;
  pdfUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MediaKitTemplate = 'professional' | 'creative' | 'minimal' | 'modern';

// ============================================================================
// MEDIA KIT GENERATION
// ============================================================================

/**
 * Gather all data needed for media kit from various sources
 */
export const gatherMediaKitData = async (creatorId: string): Promise<MediaKitData> => {
  try {
    // Get creator profile
    const userDoc = await getDoc(doc(db, 'users', creatorId));
    const userData = userDoc.exists() ? userDoc.data() : {};

    // Get creator stats from analytics
    const analyticsDoc = await getDoc(doc(db, 'creatorAnalytics', creatorId));
    const analyticsData = analyticsDoc.exists() ? analyticsDoc.data() : {};

    // Get creator reviews
    const reviewsQuery = query(
      collection(db, 'creatorReviews'),
      where('creatorId', '==', creatorId),
      where('overallRating', '>=', 4),
      orderBy('overallRating', 'desc'),
      orderBy('createdAt', 'desc')
    );
    const reviewsSnap = await getDocs(reviewsQuery);
    const testimonials = reviewsSnap.docs.slice(0, 5).map(doc => {
      const data = doc.data();
      return {
        clientName: data.reviewerName || 'Client',
        rating: data.overallRating,
        review: data.reviewText,
        date: data.createdAt?.toDate() || new Date(),
      };
    });

    // Get creator packages
    const packagesQuery = query(
      collection(db, 'creatorPackages'),
      where('creatorId', '==', creatorId),
      where('isActive', '==', true),
      orderBy('price', 'asc')
    );
    const packagesSnap = await getDocs(packagesQuery);
    const packages = packagesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.name,
        price: data.price,
        deliveryDays: data.deliveryDays,
        description: data.description || '',
      };
    });

    // Get portfolio items (from completed bookings or portfolio collection)
    const portfolioQuery = query(
      collection(db, 'creatorPortfolio'),
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc')
    );
    const portfolioSnap = await getDocs(portfolioQuery);
    const portfolioItems = portfolioSnap.docs.slice(0, 6).map(doc => {
      const data = doc.data();
      return {
        title: data.title || 'Untitled Project',
        description: data.description || '',
        imageUrl: data.imageUrl,
        category: data.category || 'General',
      };
    });

    // Compile all data
    const mediaKitData: MediaKitData = {
      creatorName: userData.name || userData.displayName || 'Creator',
      bio: userData.bio || userData.about || 'Professional creator',
      profileImage: userData.profileImage || userData.photoURL,
      location: userData.city ? `${userData.city}, ${userData.country || ''}` : undefined,
      email: userData.email,
      phone: userData.phone,
      website: userData.website,
      
      instagram: userData.instagram,
      youtube: userData.youtube,
      twitter: userData.twitter,
      
      totalProjects: analyticsData.totalProjects || 0,
      avgRating: analyticsData.avgRating || 0,
      completionRate: analyticsData.completionRate || 0,
      responseRate: analyticsData.responseRate || 0,
      
      skills: userData.skills || [],
      services: userData.services || [],
      
      portfolioItems,
      testimonials,
      packages,
      
      availability: userData.availability || 'Available',
      preferredWorkStyle: userData.workStyle || 'Remote',
      languages: userData.languages || ['English'],
    };

    return mediaKitData;
  } catch (error) {
    console.error('Error gathering media kit data:', error);
    throw error;
  }
};

/**
 * Generate HTML for media kit (for PDF conversion)
 */
export const generateMediaKitHTML = (data: MediaKitData, template: MediaKitTemplate): string => {
  const styles = getTemplateStyles(template);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.creatorName} - Media Kit</title>
      <style>${styles}</style>
    </head>
    <body>
      ${generateHeaderSection(data, template)}
      ${generateStatsSection(data)}
      ${generateAboutSection(data)}
      ${generateSkillsSection(data)}
      ${generatePortfolioSection(data)}
      ${generateTestimonialsSection(data)}
      ${generateRateCardSection(data)}
      ${generateContactSection(data)}
    </body>
    </html>
  `;
};

/**
 * Get template-specific styles
 */
const getTemplateStyles = (template: MediaKitTemplate): string => {
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px; }
    .section { margin-bottom: 50px; page-break-inside: avoid; }
    h1 { font-size: 48px; margin-bottom: 10px; }
    h2 { font-size: 32px; margin-bottom: 20px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    h3 { font-size: 24px; margin-bottom: 15px; }
    .header { text-align: center; margin-bottom: 60px; }
    .profile-image { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .stat-card { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 10px; }
    .stat-value { font-size: 36px; font-weight: bold; color: #3b82f6; }
    .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
    .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .skill-tag { padding: 10px 15px; background: #e0f2fe; border-radius: 20px; text-align: center; }
    .portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .portfolio-item { border: 1px solid #e5e7eb; border-radius: 10px; padding: 15px; }
    .portfolio-image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; }
    .testimonial { background: #f9fafb; padding: 20px; border-left: 4px solid #3b82f6; margin-bottom: 20px; }
    .rating { color: #fbbf24; font-size: 20px; }
    .package-card { border: 2px solid #3b82f6; border-radius: 10px; padding: 25px; margin-bottom: 20px; }
    .package-price { font-size: 36px; font-weight: bold; color: #3b82f6; }
    .contact-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .contact-item { display: flex; align-items: center; gap: 10px; }
  `;

  const templateSpecific: Record<MediaKitTemplate, string> = {
    professional: `
      body { color: #1e293b; }
      h2 { color: #0f172a; border-color: #64748b; }
      .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
      .stat-value { color: white; }
    `,
    creative: `
      body { color: #374151; }
      h1, h2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .skill-tag { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; }
    `,
    minimal: `
      body { font-family: 'Helvetica', sans-serif; color: #000; }
      h2 { border-bottom: 1px solid #000; }
      .stat-card { background: #fff; border: 1px solid #000; }
    `,
    modern: `
      body { color: #111827; }
      h2 { background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 15px; border-radius: 8px; }
      .package-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; }
    `,
  };

  return baseStyles + templateSpecific[template];
};

const generateHeaderSection = (data: MediaKitData, template: MediaKitTemplate): string => `
  <div class="header">
    ${data.profileImage ? `<img src="${data.profileImage}" alt="${data.creatorName}" class="profile-image" />` : ''}
    <h1>${data.creatorName}</h1>
    <p style="font-size: 20px; color: #6b7280;">${data.bio}</p>
    ${data.location ? `<p style="font-size: 16px; color: #9ca3af; margin-top: 10px;">📍 ${data.location}</p>` : ''}
  </div>
`;

const generateStatsSection = (data: MediaKitData): string => `
  <div class="section">
    <h2>Professional Stats</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.totalProjects}</div>
        <div class="stat-label">Completed Projects</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.avgRating.toFixed(1)}</div>
        <div class="stat-label">Average Rating</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.completionRate}%</div>
        <div class="stat-label">Completion Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.responseRate}%</div>
        <div class="stat-label">Response Rate</div>
      </div>
    </div>
  </div>
`;

const generateAboutSection = (data: MediaKitData): string => `
  <div class="section">
    <h2>About</h2>
    <p style="font-size: 16px; line-height: 1.8;">${data.bio}</p>
    <div style="margin-top: 20px;">
      <strong>Availability:</strong> ${data.availability}<br/>
      <strong>Work Style:</strong> ${data.preferredWorkStyle}<br/>
      <strong>Languages:</strong> ${data.languages.join(', ')}
    </div>
  </div>
`;

const generateSkillsSection = (data: MediaKitData): string => `
  <div class="section">
    <h2>Skills & Services</h2>
    <h3>Skills</h3>
    <div class="skills-grid">
      ${data.skills.map(skill => `<div class="skill-tag">${skill}</div>`).join('')}
    </div>
    <h3 style="margin-top: 30px;">Services</h3>
    <div class="skills-grid">
      ${data.services.map(service => `<div class="skill-tag">${service}</div>`).join('')}
    </div>
  </div>
`;

const generatePortfolioSection = (data: MediaKitData): string => `
  <div class="section">
    <h2>Portfolio</h2>
    <div class="portfolio-grid">
      ${data.portfolioItems.map(item => `
        <div class="portfolio-item">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" class="portfolio-image" />` : ''}
          <h3>${item.title}</h3>
          <p style="color: #6b7280; font-size: 14px;">${item.category}</p>
          <p style="margin-top: 10px;">${item.description}</p>
        </div>
      `).join('')}
    </div>
  </div>
`;

const generateTestimonialsSection = (data: MediaKitData): string => `
  <div class="section">
    <h2>Client Testimonials</h2>
    ${data.testimonials.map(testimonial => `
      <div class="testimonial">
        <div class="rating">${'⭐'.repeat(testimonial.rating)}</div>
        <p style="margin-top: 10px; font-style: italic;">"${testimonial.review}"</p>
        <p style="margin-top: 10px; font-weight: bold;">— ${testimonial.clientName}</p>
      </div>
    `).join('')}
  </div>
`;

const generateRateCardSection = (data: MediaKitData): string => `
  <div class="section">
    <h2>Rate Card</h2>
    ${data.packages.map(pkg => `
      <div class="package-card">
        <h3>${pkg.name}</h3>
        <div class="package-price">$${pkg.price}</div>
        <p style="margin-top: 10px;">Delivery: ${pkg.deliveryDays} days</p>
        <p style="margin-top: 15px;">${pkg.description}</p>
      </div>
    `).join('')}
  </div>
`;

const generateContactSection = (data: MediaKitData): string => `
  <div class="section">
    <h2>Get In Touch</h2>
    <div class="contact-info">
      ${data.email ? `<div class="contact-item">📧 ${data.email}</div>` : ''}
      ${data.phone ? `<div class="contact-item">📞 ${data.phone}</div>` : ''}
      ${data.website ? `<div class="contact-item">🌐 ${data.website}</div>` : ''}
      ${data.instagram ? `<div class="contact-item">📷 @${data.instagram}</div>` : ''}
      ${data.youtube ? `<div class="contact-item">▶️ ${data.youtube}</div>` : ''}
    </div>
  </div>
`;

/**
 * Save media kit to Firestore
 */
export const saveMediaKit = async (
  creatorId: string,
  templateId: MediaKitTemplate,
  data: MediaKitData
): Promise<string> => {
  try {
    const mediaKitDoc = await addDoc(collection(db, 'mediaKits'), {
      creatorId,
      templateId,
      data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return mediaKitDoc.id;
  } catch (error) {
    console.error('Error saving media kit:', error);
    throw error;
  }
};

/**
 * Get creator's saved media kits
 */
export const getCreatorMediaKits = async (creatorId: string): Promise<SavedMediaKit[]> => {
  try {
    const q = query(
      collection(db, 'mediaKits'),
      where('creatorId', '==', creatorId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedMediaKit));
  } catch (error) {
    console.error('Error fetching media kits:', error);
    return [];
  }
};

/**
 * Update existing media kit
 */
export const updateMediaKit = async (
  mediaKitId: string,
  data: Partial<MediaKitData>
): Promise<void> => {
  try {
    const mediaKitRef = doc(db, 'mediaKits', mediaKitId);
    await updateDoc(mediaKitRef, {
      data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating media kit:', error);
    throw error;
  }
};
