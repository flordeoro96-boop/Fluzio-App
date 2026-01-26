import { db } from '../../services/apiService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
  increment,
} from '../../services/firestoreCompat';

// ============================================================================
// TYPES
// ============================================================================

export type CourseCategory = 'pricing' | 'marketing' | 'content' | 'business' | 'legal' | 'technical';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'article' | 'quiz' | 'resource';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: number; // minutes
  content: string; // Article text, video URL, or quiz data
  order: number;
  isCompleted?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  estimatedTime: number; // minutes
  lessons: Lesson[];
  thumbnail?: string;
  tags: string[];
  enrolledCount: number;
  completionRate: number;
  rating: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  type: 'template' | 'guide' | 'checklist' | 'calculator';
  fileUrl?: string;
  content?: string; // For text-based resources
  downloadCount: number;
  createdAt: Timestamp;
}

export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  progress: number; // 0-100
  lastAccessedAt: Timestamp;
  completedAt?: Timestamp;
  certificateIssued: boolean;
}

// ============================================================================
// COURSE MANAGEMENT
// ============================================================================

/**
 * Get all published courses
 */
export const getPublishedCourses = async (
  category?: CourseCategory,
  difficulty?: CourseDifficulty
): Promise<Course[]> => {
  try {
    let q = query(
      collection(db, 'academyCourses'),
      where('isPublished', '==', true),
      orderBy('enrolledCount', 'desc')
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    if (difficulty) {
      q = query(q, where('difficulty', '==', difficulty));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

/**
 * Get a single course by ID
 */
export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const docRef = doc(db, 'academyCourses', courseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Course;
    }
    return null;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

/**
 * Enroll in a course
 */
export const enrollInCourse = async (userId: string, courseId: string): Promise<string> => {
  try {
    // Create user progress entry
    const progressDoc = await addDoc(collection(db, 'academyProgress'), {
      userId,
      courseId,
      completedLessons: [],
      progress: 0,
      lastAccessedAt: Timestamp.now(),
      certificateIssued: false,
    });

    // Increment enrolled count
    const courseRef = doc(db, 'academyCourses', courseId);
    await updateDoc(courseRef, {
      enrolledCount: increment(1),
    });

    return progressDoc.id;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

/**
 * Mark a lesson as completed
 */
export const markLessonCompleted = async (
  progressId: string,
  lessonId: string,
  totalLessons: number
): Promise<void> => {
  try {
    const progressRef = doc(db, 'academyProgress', progressId);
    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) {
      throw new Error('Progress record not found');
    }

    const currentProgress = progressSnap.data() as UserProgress;
    const completedLessons = [...currentProgress.completedLessons];

    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    }

    const progress = Math.round((completedLessons.length / totalLessons) * 100);
    const updateData: any = {
      completedLessons,
      progress,
      lastAccessedAt: Timestamp.now(),
    };

    // If course is completed, set completion date
    if (progress === 100 && !currentProgress.completedAt) {
      updateData.completedAt = Timestamp.now();
    }

    await updateDoc(progressRef, updateData);
  } catch (error) {
    console.error('Error marking lesson completed:', error);
    throw error;
  }
};

/**
 * Get user's course progress
 */
export const getUserCourseProgress = async (userId: string, courseId: string): Promise<UserProgress | null> => {
  try {
    const q = query(
      collection(db, 'academyProgress'),
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserProgress;
  } catch (error) {
    console.error('Error fetching progress:', error);
    return null;
  }
};

/**
 * Get all enrolled courses for a user
 */
export const getUserEnrolledCourses = async (userId: string): Promise<Array<Course & { progressId: string; progress: number }>> => {
  try {
    const progressQuery = query(
      collection(db, 'academyProgress'),
      where('userId', '==', userId),
      orderBy('lastAccessedAt', 'desc')
    );

    const progressSnapshot = await getDocs(progressQuery);
    const enrolledCourses: Array<Course & { progressId: string; progress: number }> = [];

    for (const progressDoc of progressSnapshot.docs) {
      const progressData = progressDoc.data() as UserProgress;
      const course = await getCourseById(progressData.courseId);
      
      if (course) {
        enrolledCourses.push({
          ...course,
          progressId: progressDoc.id,
          progress: progressData.progress,
        });
      }
    }

    return enrolledCourses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return [];
  }
};

/**
 * Issue certificate for course completion
 */
export const issueCertificate = async (progressId: string): Promise<void> => {
  try {
    const progressRef = doc(db, 'academyProgress', progressId);
    await updateDoc(progressRef, {
      certificateIssued: true,
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    throw error;
  }
};

// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

/**
 * Get all resources
 */
export const getAcademyResources = async (category?: CourseCategory): Promise<Resource[]> => {
  try {
    let q = query(
      collection(db, 'academyResources'),
      orderBy('downloadCount', 'desc')
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
  } catch (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
};

/**
 * Get a single resource
 */
export const getResourceById = async (resourceId: string): Promise<Resource | null> => {
  try {
    const docRef = doc(db, 'academyResources', resourceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Resource;
    }
    return null;
  } catch (error) {
    console.error('Error fetching resource:', error);
    return null;
  }
};

/**
 * Track resource download
 */
export const trackResourceDownload = async (resourceId: string): Promise<void> => {
  try {
    const resourceRef = doc(db, 'academyResources', resourceId);
    await updateDoc(resourceRef, {
      downloadCount: increment(1),
    });
  } catch (error) {
    console.error('Error tracking download:', error);
  }
};

// ============================================================================
// PRESET COURSES
// ============================================================================

/**
 * Get default/preset courses (for initial setup)
 */
export const getPresetCourses = (): Omit<Course, 'id'>[] => {
  return [
    {
      title: 'Pricing Your Creative Services',
      description: 'Learn how to price your services competitively while ensuring profitability',
      category: 'pricing',
      difficulty: 'beginner',
      estimatedTime: 60,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Understanding Your Worth',
          type: 'video',
          duration: 15,
          content: 'https://example.com/video/pricing-1',
          order: 1,
        },
        {
          id: 'lesson-2',
          title: 'Market Research Techniques',
          type: 'article',
          duration: 20,
          content: 'Learn how to research competitor pricing...',
          order: 2,
        },
        {
          id: 'lesson-3',
          title: 'Pricing Models',
          type: 'article',
          duration: 15,
          content: 'Explore hourly, project-based, and value-based pricing...',
          order: 3,
        },
        {
          id: 'lesson-4',
          title: 'Pricing Quiz',
          type: 'quiz',
          duration: 10,
          content: JSON.stringify([
            { question: 'What is value-based pricing?', options: ['A', 'B', 'C'], answer: 'B' },
          ]),
          order: 4,
        },
      ],
      tags: ['pricing', 'business', 'strategy'],
      enrolledCount: 0,
      completionRate: 0,
      rating: 0,
      isPublished: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      title: 'Social Media Marketing for Creators',
      description: 'Master social media strategies to grow your creator brand',
      category: 'marketing',
      difficulty: 'intermediate',
      estimatedTime: 90,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Platform Strategy',
          type: 'video',
          duration: 20,
          content: 'https://example.com/video/social-1',
          order: 1,
        },
        {
          id: 'lesson-2',
          title: 'Content Calendar Planning',
          type: 'article',
          duration: 25,
          content: 'How to plan and schedule your content...',
          order: 2,
        },
        {
          id: 'lesson-3',
          title: 'Analytics & Growth',
          type: 'video',
          duration: 30,
          content: 'https://example.com/video/social-2',
          order: 3,
        },
        {
          id: 'lesson-4',
          title: 'Social Media Quiz',
          type: 'quiz',
          duration: 15,
          content: JSON.stringify([
            { question: 'What is engagement rate?', options: ['A', 'B', 'C'], answer: 'A' },
          ]),
          order: 4,
        },
      ],
      tags: ['marketing', 'social media', 'growth'],
      enrolledCount: 0,
      completionRate: 0,
      rating: 0,
      isPublished: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      title: 'Content Creation Fundamentals',
      description: 'Essential skills for creating high-quality content that engages your audience',
      category: 'content',
      difficulty: 'beginner',
      estimatedTime: 75,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Understanding Your Audience',
          type: 'video',
          duration: 20,
          content: 'https://example.com/video/content-1',
          order: 1,
        },
        {
          id: 'lesson-2',
          title: 'Storytelling Techniques',
          type: 'article',
          duration: 25,
          content: 'Learn the art of compelling storytelling...',
          order: 2,
        },
        {
          id: 'lesson-3',
          title: 'Visual Design Basics',
          type: 'video',
          duration: 20,
          content: 'https://example.com/video/content-2',
          order: 3,
        },
        {
          id: 'lesson-4',
          title: 'Content Creation Quiz',
          type: 'quiz',
          duration: 10,
          content: JSON.stringify([
            { question: 'What is the hero\'s journey?', options: ['A', 'B', 'C'], answer: 'C' },
          ]),
          order: 4,
        },
      ],
      tags: ['content', 'storytelling', 'design'],
      enrolledCount: 0,
      completionRate: 0,
      rating: 0,
      isPublished: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      title: 'Creator Legal Essentials',
      description: 'Protect yourself with contracts, rights management, and legal best practices',
      category: 'legal',
      difficulty: 'intermediate',
      estimatedTime: 120,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Contracts 101',
          type: 'article',
          duration: 30,
          content: 'Understanding creator contracts...',
          order: 1,
        },
        {
          id: 'lesson-2',
          title: 'Copyright & Licensing',
          type: 'video',
          duration: 35,
          content: 'https://example.com/video/legal-1',
          order: 2,
        },
        {
          id: 'lesson-3',
          title: 'Terms of Service',
          type: 'article',
          duration: 25,
          content: 'Crafting your TOS...',
          order: 3,
        },
        {
          id: 'lesson-4',
          title: 'Contract Templates',
          type: 'resource',
          duration: 20,
          content: 'Download ready-to-use templates...',
          order: 4,
        },
        {
          id: 'lesson-5',
          title: 'Legal Knowledge Quiz',
          type: 'quiz',
          duration: 10,
          content: JSON.stringify([
            { question: 'What is fair use?', options: ['A', 'B', 'C'], answer: 'B' },
          ]),
          order: 5,
        },
      ],
      tags: ['legal', 'contracts', 'copyright'],
      enrolledCount: 0,
      completionRate: 0,
      rating: 0,
      isPublished: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];
};

/**
 * Get preset resources
 */
export const getPresetResources = (): Omit<Resource, 'id'>[] => {
  return [
    {
      title: 'Service Contract Template',
      description: 'Customizable contract template for creative services',
      category: 'legal',
      type: 'template',
      content: 'SERVICE AGREEMENT\n\nThis agreement is made between...',
      downloadCount: 0,
      createdAt: Timestamp.now(),
    },
    {
      title: 'Pricing Calculator',
      description: 'Interactive calculator to determine your hourly rate',
      category: 'pricing',
      type: 'calculator',
      content: 'Calculate your ideal rate based on expenses and desired income',
      downloadCount: 0,
      createdAt: Timestamp.now(),
    },
    {
      title: 'Content Calendar Template',
      description: 'Pre-built template for planning your content schedule',
      category: 'marketing',
      type: 'template',
      content: 'Monthly content planning template with best practices',
      downloadCount: 0,
      createdAt: Timestamp.now(),
    },
    {
      title: 'Client Onboarding Checklist',
      description: 'Step-by-step checklist for onboarding new clients',
      category: 'business',
      type: 'checklist',
      content: '☐ Send welcome email\n☐ Sign contract\n☐ Collect deposit...',
      downloadCount: 0,
      createdAt: Timestamp.now(),
    },
  ];
};
