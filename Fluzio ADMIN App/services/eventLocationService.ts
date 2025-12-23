/**
 * AI Event Location Suggestion Service
 * 
 * Provides intelligent location suggestions for events based on:
 * - Event type/category
 * - Time of year
 * - User preferences
 * - Geographic categories (beaches, mountains, cities, etc.)
 */

import { EventLocationCategory } from '../types';

// ============================================================================
// LOCATION SUGGESTIONS BY CATEGORY
// ============================================================================

export const LOCATION_SUGGESTIONS: Record<string, string[]> = {
  // Continents
  [EventLocationCategory.EUROPE]: [
    'Paris, France', 'Rome, Italy', 'Barcelona, Spain', 'Amsterdam, Netherlands',
    'Vienna, Austria', 'Prague, Czech Republic', 'Budapest, Hungary', 'Berlin, Germany'
  ],
  [EventLocationCategory.ASIA]: [
    'Tokyo, Japan', 'Bangkok, Thailand', 'Singapore', 'Seoul, South Korea',
    'Bali, Indonesia', 'Dubai, UAE', 'Hong Kong', 'Mumbai, India'
  ],
  [EventLocationCategory.AFRICA]: [
    'Marrakech, Morocco', 'Cape Town, South Africa', 'Cairo, Egypt',
    'Nairobi, Kenya', 'Zanzibar, Tanzania', 'Victoria Falls, Zimbabwe'
  ],
  [EventLocationCategory.NORTH_AMERICA]: [
    'New York, USA', 'Los Angeles, USA', 'Toronto, Canada', 'Mexico City, Mexico',
    'Vancouver, Canada', 'Miami, USA', 'San Francisco, USA', 'Montreal, Canada'
  ],
  [EventLocationCategory.SOUTH_AMERICA]: [
    'Rio de Janeiro, Brazil', 'Buenos Aires, Argentina', 'Lima, Peru',
    'Cartagena, Colombia', 'Santiago, Chile', 'Cusco, Peru'
  ],
  [EventLocationCategory.OCEANIA]: [
    'Sydney, Australia', 'Melbourne, Australia', 'Auckland, New Zealand',
    'Queenstown, New Zealand', 'Fiji Islands', 'Great Barrier Reef, Australia'
  ],

  // Geographic Features
  [EventLocationCategory.BEACHES]: [
    'Santorini, Greece', 'Maldives', 'Bali, Indonesia', 'Costa Brava, Spain',
    'Algarve, Portugal', 'Amalfi Coast, Italy', 'Mykonos, Greece', 'Ibiza, Spain',
    'Nice, France', 'Croatian Coast', 'Canary Islands, Spain', 'Malta'
  ],
  [EventLocationCategory.MOUNTAINS]: [
    'Swiss Alps, Switzerland', 'Dolomites, Italy', 'Austrian Alps, Austria',
    'Scottish Highlands, UK', 'Pyrenees, France/Spain', 'Bavarian Alps, Germany',
    'Tatra Mountains, Slovakia', 'Black Forest, Germany'
  ],
  [EventLocationCategory.LAKES]: [
    'Lake Como, Italy', 'Lake Geneva, Switzerland', 'Lake Bled, Slovenia',
    'Lake Garda, Italy', 'Lake Constance, Germany/Austria/Switzerland',
    'Hallstatt Lake, Austria', 'Plitvice Lakes, Croatia'
  ],
  [EventLocationCategory.FORESTS]: [
    'Black Forest, Germany', 'Bavarian Forest, Germany', 'Sherwood Forest, UK',
    'Białowieża Forest, Poland', 'Ardennes, Belgium', 'Harz Mountains, Germany'
  ],
  [EventLocationCategory.DESERTS]: [
    'Sahara Desert, Morocco', 'Wadi Rum, Jordan', 'Dubai Desert, UAE',
    'Atacama Desert, Chile', 'Namib Desert, Namibia'
  ],
  [EventLocationCategory.ISLANDS]: [
    'Mallorca, Spain', 'Crete, Greece', 'Sicily, Italy', 'Sardinia, Italy',
    'Cyprus', 'Iceland', 'Corsica, France', 'Madeira, Portugal', 'Canary Islands'
  ],

  // Climate/Activity Zones
  [EventLocationCategory.TROPICAL]: [
    'Maldives', 'Seychelles', 'Mauritius', 'Bali, Indonesia', 'Phuket, Thailand',
    'Cancun, Mexico', 'Hawaii, USA', 'Costa Rica', 'Caribbean Islands'
  ],
  [EventLocationCategory.WINTER_SPORTS]: [
    'Chamonix, France', 'Zermatt, Switzerland', 'St. Anton, Austria',
    'Cortina d\'Ampezzo, Italy', 'Verbier, Switzerland', 'Innsbruck, Austria',
    'Whistler, Canada', 'Aspen, USA'
  ],
  [EventLocationCategory.SUMMER_RESORTS]: [
    'Marbella, Spain', 'Saint-Tropez, France', 'Capri, Italy', 'Bodrum, Turkey',
    'Mykonos, Greece', 'Ibiza, Spain', 'Monaco', 'Portofino, Italy'
  ],
  [EventLocationCategory.COASTAL]: [
    'Côte d\'Azur, France', 'Amalfi Coast, Italy', 'Algarve, Portugal',
    'Costa del Sol, Spain', 'Dalmatian Coast, Croatia', 'Turkish Riviera'
  ],

  // Specific Countries
  [EventLocationCategory.GERMANY]: [
    'Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart',
    'Dresden', 'Heidelberg', 'Rothenburg', 'Neuschwanstein', 'Black Forest'
  ],
  [EventLocationCategory.FRANCE]: [
    'Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux', 'Strasbourg',
    'Mont Saint-Michel', 'French Riviera', 'Loire Valley', 'Provence'
  ],
  [EventLocationCategory.ITALY]: [
    'Rome', 'Venice', 'Florence', 'Milan', 'Naples', 'Tuscany',
    'Amalfi Coast', 'Cinque Terre', 'Lake Como', 'Sicily'
  ],
  [EventLocationCategory.SPAIN]: [
    'Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada', 'Bilbao',
    'San Sebastian', 'Mallorca', 'Ibiza', 'Costa Brava'
  ],
  [EventLocationCategory.GREECE]: [
    'Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu',
    'Meteora', 'Delphi', 'Zakynthos', 'Paros'
  ],
  [EventLocationCategory.PORTUGAL]: [
    'Lisbon', 'Porto', 'Algarve', 'Madeira', 'Azores', 'Sintra',
    'Cascais', 'Évora', 'Douro Valley'
  ],
  [EventLocationCategory.SWITZERLAND]: [
    'Zurich', 'Geneva', 'Lucerne', 'Interlaken', 'Zermatt', 'St. Moritz',
    'Jungfrau Region', 'Lake Geneva', 'Matterhorn'
  ],
  [EventLocationCategory.AUSTRIA]: [
    'Vienna', 'Salzburg', 'Innsbruck', 'Hallstatt', 'Graz',
    'Austrian Alps', 'Tyrol', 'Wachau Valley'
  ],
  [EventLocationCategory.NETHERLANDS]: [
    'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Maastricht',
    'Giethoorn', 'Keukenhof', 'Kinderdijk'
  ],
  [EventLocationCategory.BELGIUM]: [
    'Brussels', 'Bruges', 'Ghent', 'Antwerp', 'Leuven', 'Ardennes'
  ],

  // Cities
  [EventLocationCategory.MAJOR_CITIES]: [
    'London, UK', 'Paris, France', 'Berlin, Germany', 'Madrid, Spain',
    'Rome, Italy', 'Amsterdam, Netherlands', 'Vienna, Austria', 'Barcelona, Spain'
  ],
  [EventLocationCategory.SMALL_TOWNS]: [
    'Hallstatt, Austria', 'Rothenburg, Germany', 'Colmar, France',
    'Bruges, Belgium', 'Cesky Krumlov, Czech Republic', 'Ronda, Spain'
  ],
  [EventLocationCategory.HISTORIC_CITIES]: [
    'Rome, Italy', 'Athens, Greece', 'Prague, Czech Republic',
    'Edinburgh, Scotland', 'Krakow, Poland', 'Dubrovnik, Croatia'
  ],
  [EventLocationCategory.MODERN_CITIES]: [
    'Dubai, UAE', 'Singapore', 'Tokyo, Japan', 'Hong Kong',
    'Seoul, South Korea', 'Shanghai, China'
  ]
};

// ============================================================================
// AI SUGGESTION ENGINE
// ============================================================================

/**
 * Get location suggestions based on category
 */
export const getLocationsByCategory = (category: EventLocationCategory): string[] => {
  return LOCATION_SUGGESTIONS[category] || [];
};

/**
 * Get seasonal recommendations
 */
export const getSeasonalRecommendations = (month: number): EventLocationCategory[] => {
  // December - February (Winter)
  if (month === 12 || month === 1 || month === 2) {
    return [
      EventLocationCategory.WINTER_SPORTS,
      EventLocationCategory.TROPICAL,
      EventLocationCategory.MAJOR_CITIES,
      EventLocationCategory.MOUNTAINS
    ];
  }
  
  // March - May (Spring)
  if (month >= 3 && month <= 5) {
    return [
      EventLocationCategory.EUROPE,
      EventLocationCategory.HISTORIC_CITIES,
      EventLocationCategory.SMALL_TOWNS,
      EventLocationCategory.FORESTS
    ];
  }
  
  // June - August (Summer)
  if (month >= 6 && month <= 8) {
    return [
      EventLocationCategory.BEACHES,
      EventLocationCategory.SUMMER_RESORTS,
      EventLocationCategory.ISLANDS,
      EventLocationCategory.COASTAL,
      EventLocationCategory.LAKES
    ];
  }
  
  // September - November (Fall)
  return [
    EventLocationCategory.EUROPE,
    EventLocationCategory.MOUNTAINS,
    EventLocationCategory.HISTORIC_CITIES,
    EventLocationCategory.FORESTS
  ];
};

/**
 * Get all available categories
 */
export const getAllCategories = (): EventLocationCategory[] => {
  return Object.values(EventLocationCategory);
};

/**
 * Get category suggestions based on event type/keywords
 */
export const suggestCategoriesForEvent = (
  eventTitle: string,
  eventDescription: string
): EventLocationCategory[] => {
  const text = `${eventTitle} ${eventDescription}`.toLowerCase();
  const suggestions: EventLocationCategory[] = [];
  
  // Beach/coastal keywords
  if (text.match(/beach|coast|sea|ocean|sand|surf|swim/)) {
    suggestions.push(
      EventLocationCategory.BEACHES,
      EventLocationCategory.COASTAL,
      EventLocationCategory.ISLANDS
    );
  }
  
  // Mountain/hiking keywords
  if (text.match(/mountain|hik|climb|trek|ski|snow|alpine/)) {
    suggestions.push(
      EventLocationCategory.MOUNTAINS,
      EventLocationCategory.WINTER_SPORTS
    );
  }
  
  // City/urban keywords
  if (text.match(/city|urban|museum|restaurant|shopping|nightlife/)) {
    suggestions.push(
      EventLocationCategory.MAJOR_CITIES,
      EventLocationCategory.HISTORIC_CITIES
    );
  }
  
  // Nature keywords
  if (text.match(/nature|forest|lake|wildlife|camping|outdoor/)) {
    suggestions.push(
      EventLocationCategory.FORESTS,
      EventLocationCategory.LAKES
    );
  }
  
  // Tropical/warm keywords
  if (text.match(/tropical|warm|summer|sun|paradise/)) {
    suggestions.push(
      EventLocationCategory.TROPICAL,
      EventLocationCategory.SUMMER_RESORTS
    );
  }
  
  // Default to seasonal recommendations if no matches
  if (suggestions.length === 0) {
    const currentMonth = new Date().getMonth() + 1;
    suggestions.push(...getSeasonalRecommendations(currentMonth));
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
};

/**
 * Format location suggestion for display
 */
export const formatLocationSuggestion = (
  category: EventLocationCategory,
  specificLocation?: string
): string => {
  if (specificLocation) {
    return `${specificLocation} (${category})`;
  }
  return category;
};
