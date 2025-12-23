
import { MissionTheme, BusinessCategory } from '../types';

export const MISSION_THEMES: MissionTheme[] = [
  // --- Gastronomy ---
  {
    id: 'theme_g1', category: 'GASTRONOMY', code: 'THE_FOODIE_CLOSEUP',
    title: 'The Foodie Close-Up',
    defaultDescription: 'Take a high-quality, mouth-watering close-up photo of your favorite dish. Lighting is key!',
    requirements: ['Close-up Photo', 'Tag us in Story'],
    goal: 'CONTENT', suggestedPoints: 50, icon: 'Camera', isPremium: false
  },
  {
    id: 'theme_g2', category: 'GASTRONOMY', code: 'THE_HONEST_REVIEW',
    title: 'Honest Taste Test',
    defaultDescription: 'Order our special and film a reaction video of your first bite. Be honest and descriptive!',
    requirements: ['Video Reaction', 'Google Review'],
    goal: 'GROWTH', suggestedPoints: 100, icon: 'Star', isPremium: true
  },
  {
    id: 'theme_g3', category: 'GASTRONOMY', code: 'DATE_NIGHT_VIBES',
    title: 'Date Night Vibes',
    defaultDescription: 'Bring a plus one and capture the romantic atmosphere of our corner table.',
    requirements: ['Photo with Partner', 'Tag Location'],
    goal: 'SALES', suggestedPoints: 75, icon: 'Heart', isPremium: false
  },
  
  // --- Nightlife ---
  {
    id: 'theme_n1', category: 'NIGHTLIFE', code: 'BOOMERANG_CHEERS',
    title: 'Boomerang Cheers',
    defaultDescription: 'Capture a fun boomerang clinking glasses with friends. Show off the drinks!',
    requirements: ['Boomerang Story', 'Tag 2 Friends'],
    goal: 'CONTENT', suggestedPoints: 40, icon: 'Clapperboard', isPremium: false
  },
  {
    id: 'theme_n2', category: 'NIGHTLIFE', code: 'SIGNATURE_COCKTAIL',
    title: 'Signature Sip',
    defaultDescription: 'Order our signature cocktail and post a stylish photo of it on the bar.',
    requirements: ['Aesthetic Photo', 'Mention Drink Name'],
    goal: 'SALES', suggestedPoints: 60, icon: 'Martini', isPremium: false
  },
  {
    id: 'theme_n3', category: 'NIGHTLIFE', code: 'SQUAD_CHECKIN',
    title: 'Squad Check-In',
    defaultDescription: 'Arrive with a group of 3+ and check in on Facebook/Instagram to get a round of shots.',
    requirements: ['Group Selfie', 'Check-in'],
    goal: 'TRAFFIC', suggestedPoints: 150, icon: 'Users', isPremium: false
  },

  // --- Ecommerce ---
  {
    id: 'theme_e1', category: 'ECOMMERCE', code: 'UNBOXING_REVEAL',
    title: 'Unboxing Reveal',
    defaultDescription: 'Film the moment you open your package. Show the packaging details and your excitement.',
    requirements: ['Unboxing Video', 'Tag Brand'],
    goal: 'CONTENT', suggestedPoints: 120, icon: 'Package', isPremium: true
  },
  {
    id: 'theme_e2', category: 'ECOMMERCE', code: 'MY_WISHLIST',
    title: 'My Wishlist',
    defaultDescription: 'Browse our website and share a screenshot of your top 3 favorite items in your cart.',
    requirements: ['Screenshot Story', 'Link to Products'],
    goal: 'SALES', suggestedPoints: 30, icon: 'ShoppingBag', isPremium: false
  },
  {
    id: 'theme_e3', category: 'ECOMMERCE', code: 'PRODUCT_IN_ACTION',
    title: 'Product in Action',
    defaultDescription: 'Show us how you use our product in your daily life. Practicality wins points!',
    requirements: ['Lifestyle Photo/Video', 'Explanation Text'],
    goal: 'CONTENT', suggestedPoints: 100, icon: 'Play', isPremium: true
  },

  // --- Retail ---
  {
    id: 'theme_r1', category: 'RETAIL', code: 'MIRROR_SELFIE',
    title: 'The Mirror Selfie',
    defaultDescription: 'Try on an outfit and take a mirror selfie in our changing rooms. Ask your followers "Yes or No?".',
    requirements: ['Mirror Selfie', 'Poll Sticker'],
    goal: 'CONTENT', suggestedPoints: 50, icon: 'Smartphone', isPremium: false
  },
  {
    id: 'theme_r2', category: 'RETAIL', code: 'STORE_TOUR_REEL',
    title: 'Mini Store Tour',
    defaultDescription: 'Walk through our aisles and show your followers the coolest sections of the shop.',
    requirements: ['15s Reel', 'Tag Location'],
    goal: 'TRAFFIC', suggestedPoints: 150, icon: 'Video', isPremium: true
  },
  {
    id: 'theme_r3', category: 'RETAIL', code: 'HIDDEN_GEM_FIND',
    title: 'Hidden Gem Find',
    defaultDescription: 'Find one item under €20 that you think is a steal and share it.',
    requirements: ['Photo of Item', 'Price Mention'],
    goal: 'SALES', suggestedPoints: 40, icon: 'Search', isPremium: false
  },

  // --- Wellness ---
  {
    id: 'theme_w1', category: 'WELLNESS', code: 'SWEAT_SELFIE',
    title: 'Sweat Selfie',
    defaultDescription: 'Post a post-workout selfie proving you crushed your session at our gym today.',
    requirements: ['Selfie', 'Tag Gym'],
    goal: 'CONTENT', suggestedPoints: 40, icon: 'Dumbbell', isPremium: false
  },
  {
    id: 'theme_w2', category: 'WELLNESS', code: 'TRANSFORMATION_TUESDAY',
    title: 'Transformation Story',
    defaultDescription: 'Share a small win or progress update since you started using our services/products.',
    requirements: ['Story with Text', 'Before/After (Optional)'],
    goal: 'GROWTH', suggestedPoints: 100, icon: 'TrendingUp', isPremium: false
  },
  {
    id: 'theme_w3', category: 'WELLNESS', code: 'MORNING_ROUTINE',
    title: 'Morning Routine',
    defaultDescription: 'Incorporate our wellness product into your morning routine video.',
    requirements: ['Reel/TikTok', 'Tag Product'],
    goal: 'CONTENT', suggestedPoints: 120, icon: 'Sun', isPremium: true
  },

  // --- Universal (ALL) ---
  {
    id: 'theme_a1', category: 'ALL', code: 'GOOGLE_5_STAR',
    title: 'Google 5-Star',
    defaultDescription: 'Leave us a kind 5-star review on Google Maps mentioning your favorite thing about us.',
    requirements: ['Screenshot of Review'],
    goal: 'GROWTH', suggestedPoints: 50, icon: 'MapPin', isPremium: false
  },
  {
    id: 'theme_a2', category: 'ALL', code: 'REFER_A_FRIEND',
    title: 'Refer a Friend',
    defaultDescription: 'Bring a friend who has never visited before. We will give you both a discount!',
    requirements: ['Photo with Friend', 'Purchase Proof'],
    goal: 'SALES', suggestedPoints: 100, icon: 'UserPlus', isPremium: false
  },
  {
    id: 'theme_a3', category: 'ALL', code: 'FOLLOW_US',
    title: 'Follow Spree',
    defaultDescription: 'Follow us on Instagram and TikTok. Send a screenshot to prove it.',
    requirements: ['Follow Screenshot'],
    goal: 'GROWTH', suggestedPoints: 20, icon: 'ThumbsUp', isPremium: false
  },
  {
    id: 'theme_a4', category: 'ALL', code: 'TAG_A_BESTIE',
    title: 'Tag a Bestie',
    defaultDescription: 'Comment on our latest post and tag a friend you want to bring here.',
    requirements: ['Comment Screenshot'],
    goal: 'GROWTH', suggestedPoints: 10, icon: 'MessageCircle', isPremium: false
  },
  {
    id: 'theme_a5', category: 'ALL', code: 'STORY_SHOUTOUT',
    title: 'Story Shoutout',
    defaultDescription: 'Simply post a story mentioning you are here or using our service.',
    requirements: ['Story Mention'],
    goal: 'CONTENT', suggestedPoints: 30, icon: 'Mic', isPremium: false
  }
];

export const getThemesForBusiness = (businessCategory: BusinessCategory): MissionTheme[] => {
  // 1. Get Universal Themes
  const universal = MISSION_THEMES.filter(t => t.category === 'ALL');

  // 2. Map BusinessCategory to ThemeCategory
  let targetCategory = '';
  
  switch (businessCategory) {
    case BusinessCategory.GASTRONOMY:
      // Gastronomy can see Gastronomy AND Nightlife themes
      targetCategory = 'GASTRONOMY'; 
      break;
    case BusinessCategory.FITNESS:
      targetCategory = 'WELLNESS';
      break;
    case BusinessCategory.RETAIL:
      targetCategory = 'RETAIL';
      break;
    case BusinessCategory.SERVICES:
      targetCategory = 'WELLNESS'; // Assuming services align often with wellness/care
      break;
    default:
      targetCategory = 'ALL';
  }

  const specific = MISSION_THEMES.filter(t => t.category === targetCategory);
  
  // Special case: Gastronomy also gets Nightlife suggestions
  const nightlife = businessCategory === BusinessCategory.GASTRONOMY 
    ? MISSION_THEMES.filter(t => t.category === 'NIGHTLIFE') 
    : [];

  // Special case: Retail also gets Ecommerce suggestions
  const ecommerce = businessCategory === BusinessCategory.RETAIL 
    ? MISSION_THEMES.filter(t => t.category === 'ECOMMERCE') 
    : [];

  return [...specific, ...nightlife, ...ecommerce, ...universal];
};
