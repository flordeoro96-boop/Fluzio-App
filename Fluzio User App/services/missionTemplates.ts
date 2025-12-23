import { MissionCategory, ProofType, RewardType } from '../types';

export interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  category: MissionCategory;
  icon: string;
  popularity: number; // 1-5 stars
  estimatedReach: string;
  requirements: string[];
  suggestedPoints: number;
  suggestedRewardType: RewardType;
  proofType: ProofType;
  hashtags?: string[];
  mentions?: string[];
  postType?: 'STORY' | 'POST' | 'REEL' | 'VIDEO' | 'ANY';
  goal: 'GROWTH' | 'CONTENT' | 'TRAFFIC' | 'SALES';
  templateType: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  bestFor: string[]; // e.g., ['Restaurants', 'Cafes', 'Food Businesses']
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  // COFFEE & CAFE TEMPLATES
  {
    id: 'coffee_story_tag',
    name: 'Share Your Coffee Moment',
    description: 'Post a story enjoying your favorite drink and tag our location',
    category: MissionCategory.COFFEE,
    icon: '☕',
    popularity: 5,
    estimatedReach: '500-1000 people',
    requirements: [
      'Post an Instagram story with your drink',
      'Tag our location',
      'Use our hashtag'
    ],
    suggestedPoints: 100,
    suggestedRewardType: RewardType.POINTS_ONLY,
    proofType: ProofType.SCREENSHOT,
    hashtags: ['#CoffeeLover', '#LocalCafe'],
    postType: 'STORY',
    goal: 'GROWTH',
    templateType: 'BEGINNER',
    bestFor: ['Cafes', 'Coffee Shops', 'Bakeries']
  },
  {
    id: 'coffee_latte_art',
    name: 'Capture Our Latte Art',
    description: 'Take a photo of your latte art and share it on Instagram',
    category: MissionCategory.COFFEE,
    icon: '☕',
    popularity: 4,
    estimatedReach: '1000-2000 people',
    requirements: [
      'Order a latte or cappuccino',
      'Take a photo of the latte art',
      'Post on your feed with our hashtag',
      'Tag our account'
    ],
    suggestedPoints: 150,
    suggestedRewardType: RewardType.POINTS_AND_ITEM,
    proofType: ProofType.LINK,
    hashtags: ['#LatteArt', '#CoffeeArt'],
    postType: 'POST',
    goal: 'CONTENT',
    templateType: 'INTERMEDIATE',
    bestFor: ['Specialty Coffee Shops', 'Artisan Cafes']
  },
  {
    id: 'coffee_morning_routine',
    name: 'Morning Routine Reel',
    description: 'Create a reel featuring our coffee in your morning routine',
    category: MissionCategory.COFFEE,
    icon: '☕',
    popularity: 5,
    estimatedReach: '2000-5000 people',
    requirements: [
      'Create a 15-30 second Reel',
      'Show our coffee/cafe in your morning routine',
      'Tag our account and location',
      'Use trending audio'
    ],
    suggestedPoints: 300,
    suggestedRewardType: RewardType.POINTS_AND_DISCOUNT,
    proofType: ProofType.LINK,
    hashtags: ['#MorningRoutine', '#CoffeeFirst'],
    postType: 'REEL',
    goal: 'GROWTH',
    templateType: 'ADVANCED',
    bestFor: ['Coffee Shops', 'Breakfast Spots', 'Cafes']
  },

  // FOOD & RESTAURANT TEMPLATES
  {
    id: 'food_dish_photo',
    name: 'Snap & Share Your Meal',
    description: 'Take a photo of your dish and share it on your story',
    category: MissionCategory.FOOD,
    icon: '🍽️',
    popularity: 5,
    estimatedReach: '500-1500 people',
    requirements: [
      'Order any dish from our menu',
      'Take a high-quality photo',
      'Post on Instagram story',
      'Tag our location'
    ],
    suggestedPoints: 120,
    suggestedRewardType: RewardType.POINTS_ONLY,
    proofType: ProofType.SCREENSHOT,
    hashtags: ['#Foodie', '#Instafood'],
    postType: 'STORY',
    goal: 'CONTENT',
    templateType: 'BEGINNER',
    bestFor: ['Restaurants', 'Food Trucks', 'Bars']
  },
  {
    id: 'food_review_reel',
    name: 'Taste Test Reel',
    description: 'Create a taste test reel trying 3+ items from our menu',
    category: MissionCategory.FOOD,
    icon: '🍽️',
    popularity: 4,
    estimatedReach: '2000-5000 people',
    requirements: [
      'Order at least 3 different items',
      'Create a Reel showing your reactions',
      'Tag our restaurant',
      'Give honest reviews'
    ],
    suggestedPoints: 400,
    suggestedRewardType: RewardType.POINTS_AND_ITEM,
    proofType: ProofType.LINK,
    hashtags: ['#FoodReview', '#TasteTest'],
    postType: 'REEL',
    goal: 'SALES',
    templateType: 'ADVANCED',
    bestFor: ['Restaurants', 'Fast Food', 'Brunch Spots']
  },
  {
    id: 'food_table_spread',
    name: 'Table Spread Post',
    description: 'Share a full table spread photo showing multiple dishes',
    category: MissionCategory.FOOD,
    icon: '🍽️',
    popularity: 4,
    estimatedReach: '1000-3000 people',
    requirements: [
      'Visit with friends (2+ people)',
      'Order multiple dishes',
      'Take an aesthetic overhead shot',
      'Post on your feed with our tag'
    ],
    suggestedPoints: 250,
    suggestedRewardType: RewardType.POINTS_AND_DISCOUNT,
    proofType: ProofType.LINK,
    hashtags: ['#FoodSpread', '#TableGoals'],
    postType: 'POST',
    goal: 'TRAFFIC',
    templateType: 'INTERMEDIATE',
    bestFor: ['Restaurants', 'Brunch Places', 'Sharing Plates Venues']
  },

  // FASHION & RETAIL TEMPLATES
  {
    id: 'fashion_outfit_post',
    name: 'Style Our Pieces',
    description: 'Create an outfit post featuring our products',
    category: MissionCategory.FASHION,
    icon: '👗',
    popularity: 5,
    estimatedReach: '1000-2500 people',
    requirements: [
      'Wear at least one item from our store',
      'Create a full outfit post',
      'Tag our brand',
      'Use #OOTD hashtag'
    ],
    suggestedPoints: 200,
    suggestedRewardType: RewardType.POINTS_AND_DISCOUNT,
    proofType: ProofType.LINK,
    hashtags: ['#OOTD', '#Fashion', '#Style'],
    postType: 'POST',
    goal: 'GROWTH',
    templateType: 'INTERMEDIATE',
    bestFor: ['Clothing Stores', 'Boutiques', 'Fashion Brands']
  },
  {
    id: 'fashion_try_on_reel',
    name: 'Try-On Haul Reel',
    description: 'Film a try-on haul showing multiple pieces from our collection',
    category: MissionCategory.FASHION,
    icon: '👗',
    popularity: 5,
    estimatedReach: '2000-6000 people',
    requirements: [
      'Try on 3+ items from our store',
      'Create a Reel with trending audio',
      'Show styling tips',
      'Link our store'
    ],
    suggestedPoints: 350,
    suggestedRewardType: RewardType.POINTS_AND_ITEM,
    proofType: ProofType.LINK,
    hashtags: ['#TryOnHaul', '#FashionHaul'],
    postType: 'REEL',
    goal: 'SALES',
    templateType: 'ADVANCED',
    bestFor: ['Fashion Retailers', 'Clothing Brands', 'Boutiques']
  },

  // BEAUTY TEMPLATES
  {
    id: 'beauty_get_ready',
    name: 'Get Ready With Me',
    description: 'Show your makeup routine using our products',
    category: MissionCategory.BEAUTY,
    icon: '💄',
    popularity: 5,
    estimatedReach: '1500-4000 people',
    requirements: [
      'Use at least 2 of our products',
      'Create a GRWM Reel',
      'Show before/after',
      'Tag products used'
    ],
    suggestedPoints: 300,
    suggestedRewardType: RewardType.POINTS_AND_DISCOUNT,
    proofType: ProofType.LINK,
    hashtags: ['#GRWM', '#MakeupRoutine'],
    postType: 'REEL',
    goal: 'CONTENT',
    templateType: 'INTERMEDIATE',
    bestFor: ['Beauty Salons', 'Makeup Stores', 'Cosmetics Brands']
  },

  // FITNESS & LIFESTYLE TEMPLATES
  {
    id: 'lifestyle_workout_reel',
    name: 'Gym Session Reel',
    description: 'Film your workout at our facility',
    category: MissionCategory.LIFESTYLE,
    icon: '✨',
    popularity: 4,
    estimatedReach: '1000-3000 people',
    requirements: [
      'Record a workout session',
      'Show 3-5 exercises',
      'Tag our location',
      'Use fitness hashtags'
    ],
    suggestedPoints: 250,
    suggestedRewardType: RewardType.POINTS_AND_ITEM,
    proofType: ProofType.LINK,
    hashtags: ['#FitnessJourney', '#GymLife'],
    postType: 'REEL',
    goal: 'GROWTH',
    templateType: 'INTERMEDIATE',
    bestFor: ['Gyms', 'Fitness Studios', 'Wellness Centers']
  },

  // TRAVEL & EXPERIENCES
  {
    id: 'travel_checkin',
    name: 'Check-In & Share',
    description: 'Check in at our location and share your experience',
    category: MissionCategory.TRAVEL,
    icon: '✈️',
    popularity: 4,
    estimatedReach: '500-1500 people',
    requirements: [
      'Visit our location',
      'Check in on Instagram',
      'Share a story or post',
      'Tag your friends'
    ],
    suggestedPoints: 150,
    suggestedRewardType: RewardType.POINTS_ONLY,
    proofType: ProofType.SCREENSHOT,
    hashtags: ['#TravelGram', '#Explore'],
    postType: 'ANY',
    goal: 'TRAFFIC',
    templateType: 'BEGINNER',
    bestFor: ['Hotels', 'Tourist Attractions', 'Experiences']
  },

  // PETS TEMPLATES
  {
    id: 'pets_cute_moment',
    name: 'Pet-Friendly Moment',
    description: 'Share a photo of your pet enjoying our space',
    category: MissionCategory.PETS,
    icon: '🐾',
    popularity: 5,
    estimatedReach: '1000-2500 people',
    requirements: [
      'Bring your pet to our location',
      'Capture a cute moment',
      'Post on Instagram',
      'Tag us and use #PetFriendly'
    ],
    suggestedPoints: 180,
    suggestedRewardType: RewardType.POINTS_AND_ITEM,
    proofType: ProofType.LINK,
    hashtags: ['#PetFriendly', '#DogsOfInstagram'],
    postType: 'POST',
    goal: 'CONTENT',
    templateType: 'BEGINNER',
    bestFor: ['Pet-Friendly Cafes', 'Pet Stores', 'Dog Parks']
  },

  // TECH & INNOVATION
  {
    id: 'tech_unboxing',
    name: 'Unboxing Experience',
    description: 'Create an unboxing video of our product',
    category: MissionCategory.TECH,
    icon: '💻',
    popularity: 4,
    estimatedReach: '1500-4000 people',
    requirements: [
      'Purchase a product',
      'Film unboxing experience',
      'Show features and first impressions',
      'Tag our brand'
    ],
    suggestedPoints: 400,
    suggestedRewardType: RewardType.POINTS_AND_DISCOUNT,
    proofType: ProofType.LINK,
    hashtags: ['#Unboxing', '#TechReview'],
    postType: 'REEL',
    goal: 'SALES',
    templateType: 'ADVANCED',
    bestFor: ['Electronics Stores', 'Tech Brands', 'Gadget Shops']
  },

  // GENERIC TEMPLATES
  {
    id: 'generic_story_mention',
    name: 'Story Mention',
    description: 'Mention us in your Instagram story',
    category: MissionCategory.OTHER,
    icon: '📌',
    popularity: 5,
    estimatedReach: '300-1000 people',
    requirements: [
      'Visit our location',
      'Post a story mentioning us',
      'Tag our account'
    ],
    suggestedPoints: 80,
    suggestedRewardType: RewardType.POINTS_ONLY,
    proofType: ProofType.SCREENSHOT,
    postType: 'STORY',
    goal: 'GROWTH',
    templateType: 'BEGINNER',
    bestFor: ['All Business Types']
  },
  {
    id: 'generic_friend_referral',
    name: 'Bring a Friend',
    description: 'Visit with a friend and both post about your experience',
    category: MissionCategory.OTHER,
    icon: '📌',
    popularity: 4,
    estimatedReach: '1000-2000 people',
    requirements: [
      'Visit with a friend who hasn\'t been here',
      'Both post on Instagram',
      'Tag each other and our location',
      'Use our hashtag'
    ],
    suggestedPoints: 200,
    suggestedRewardType: RewardType.POINTS_AND_DISCOUNT,
    proofType: ProofType.SCREENSHOT,
    postType: 'ANY',
    goal: 'TRAFFIC',
    templateType: 'INTERMEDIATE',
    bestFor: ['All Business Types']
  },
  {
    id: 'generic_review_post',
    name: 'Detailed Review Post',
    description: 'Write a detailed review post about your experience',
    category: MissionCategory.OTHER,
    icon: '📌',
    popularity: 3,
    estimatedReach: '800-2000 people',
    requirements: [
      'Visit and try our service/product',
      'Write a detailed caption (100+ words)',
      'Include 3+ photos',
      'Tag our business',
      'Share pros and honest feedback'
    ],
    suggestedPoints: 280,
    suggestedRewardType: RewardType.POINTS_AND_ITEM,
    proofType: ProofType.LINK,
    postType: 'POST',
    goal: 'CONTENT',
    templateType: 'INTERMEDIATE',
    bestFor: ['All Business Types']
  }
];

// Helper function to get templates by category
export const getTemplatesByCategory = (category: MissionCategory): MissionTemplate[] => {
  return MISSION_TEMPLATES.filter(t => t.category === category);
};

// Helper function to get templates by business type
export const getTemplatesByBusinessType = (businessType: string): MissionTemplate[] => {
  return MISSION_TEMPLATES.filter(t => 
    t.bestFor.some(bf => bf.toLowerCase().includes(businessType.toLowerCase())) ||
    t.bestFor.includes('All Business Types')
  );
};

// Helper function to get beginner-friendly templates
export const getBeginnerTemplates = (): MissionTemplate[] => {
  return MISSION_TEMPLATES.filter(t => t.templateType === 'BEGINNER');
};

// Helper function to get popular templates
export const getPopularTemplates = (limit: number = 5): MissionTemplate[] => {
  return MISSION_TEMPLATES
    .filter(t => t.popularity >= 4)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};
