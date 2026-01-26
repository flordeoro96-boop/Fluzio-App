/**
 * Weather-Based Recommendations Service
 * Suggests businesses and activities based on current and forecasted weather
 * Note: Requires weather API integration (OpenWeatherMap or similar)
 */

export interface WeatherCondition {
  temperature: number; // Celsius
  feelsLike: number;
  condition: 'SUNNY' | 'CLOUDY' | 'RAINY' | 'SNOWY' | 'WINDY' | 'STORMY';
  description: string;
  humidity: number;
  timestamp: Date;
}

export interface WeatherBasedRecommendation {
  businessId?: string;
  businessName?: string;
  category: string;
  title: string;
  description: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  weatherFactor: string; // e.g., "Perfect sunny weather"
}

export interface WeatherAlert {
  severity: 'INFO' | 'WARNING' | 'SEVERE';
  message: string;
  suggestion: string;
}

/**
 * Get weather-based business recommendations
 * Note: This uses mock data. Integrate with real weather API in production.
 */
export async function getWeatherRecommendations(
  userLocation: { latitude: number; longitude: number },
  userCity: string
): Promise<WeatherBasedRecommendation[]> {
  try {
    // In production, call weather API here
    // const weather = await fetchWeatherData(userLocation);
    
    // Mock weather data for demonstration
    const weather: WeatherCondition = {
      temperature: 22,
      feelsLike: 24,
      condition: 'SUNNY',
      description: 'Clear sky',
      humidity: 45,
      timestamp: new Date()
    };
    
    const recommendations: WeatherBasedRecommendation[] = [];
    
    // Sunny weather recommendations
    if (weather.condition === 'SUNNY' && weather.temperature >= 20) {
      recommendations.push({
        category: 'OUTDOOR_DINING',
        title: 'Perfect Day for Outdoor Dining',
        description: 'Enjoy the sunshine at local cafes with patio seating',
        reason: `Beautiful ${weather.temperature}°C weather - ideal for outdoor activities`,
        priority: 'HIGH',
        weatherFactor: 'Sunny and warm'
      });
      
      recommendations.push({
        category: 'ICE_CREAM',
        title: 'Cool Down with Ice Cream',
        description: 'Visit local ice cream shops and gelaterias',
        reason: 'Hot weather calls for refreshing treats',
        priority: 'MEDIUM',
        weatherFactor: `${weather.temperature}°C - perfect ice cream weather`
      });
      
      recommendations.push({
        category: 'BEACH_BAR',
        title: 'Beach Bars & Waterfront',
        description: 'Head to the beach or waterfront venues',
        reason: 'Make the most of this beautiful weather',
        priority: 'HIGH',
        weatherFactor: 'Clear skies and warm sun'
      });
    }
    
    // Rainy weather recommendations
    if (weather.condition === 'RAINY') {
      recommendations.push({
        category: 'INDOOR_CAFE',
        title: 'Cozy Indoor Cafes',
        description: 'Perfect weather to relax indoors with coffee and a book',
        reason: 'Stay dry and comfortable',
        priority: 'HIGH',
        weatherFactor: 'Rainy weather - indoor activities recommended'
      });
      
      recommendations.push({
        category: 'CINEMA',
        title: 'Movie Time',
        description: 'Catch a film at local cinemas',
        reason: 'Great indoor entertainment option',
        priority: 'MEDIUM',
        weatherFactor: 'Rainy day - perfect for movies'
      });
      
      recommendations.push({
        category: 'MUSEUM',
        title: 'Museums & Galleries',
        description: 'Explore art and culture indoors',
        reason: 'Beat the rain with cultural activities',
        priority: 'MEDIUM',
        weatherFactor: 'Weather-proof entertainment'
      });
    }
    
    // Cold weather recommendations
    if (weather.temperature < 10) {
      recommendations.push({
        category: 'RESTAURANT',
        title: 'Warm Comfort Food',
        description: 'Visit restaurants with hearty comfort food',
        reason: 'Warm up with hot meals',
        priority: 'HIGH',
        weatherFactor: `Cold at ${weather.temperature}°C - comfort food perfect`
      });
      
      recommendations.push({
        category: 'HOT_DRINKS',
        title: 'Hot Chocolate & Coffee',
        description: 'Cozy cafes with warm beverages',
        reason: 'Nothing beats a hot drink in cold weather',
        priority: 'HIGH',
        weatherFactor: 'Chilly weather ideal for warm drinks'
      });
    }
    
    // Hot weather recommendations
    if (weather.temperature > 30) {
      recommendations.push({
        category: 'AIR_CONDITIONED',
        title: 'Cool Indoor Venues',
        description: 'Air-conditioned restaurants and shops',
        reason: 'Escape the heat',
        priority: 'HIGH',
        weatherFactor: `Very hot (${weather.temperature}°C) - stay cool indoors`
      });
      
      recommendations.push({
        category: 'POOL_BAR',
        title: 'Pool Bars & Swim Spots',
        description: 'Places with pools or water features',
        reason: 'Beat the heat with a swim',
        priority: 'HIGH',
        weatherFactor: 'Hot day - perfect for water activities'
      });
    }
    
    // Windy weather
    if (weather.condition === 'WINDY') {
      recommendations.push({
        category: 'INDOOR',
        title: 'Indoor Activities',
        description: 'Skip outdoor dining and opt for sheltered venues',
        reason: 'Strong winds make outdoor activities uncomfortable',
        priority: 'MEDIUM',
        weatherFactor: 'Windy conditions - indoor options better'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  } catch (error) {
    console.error('[Weather Recommendations] Error getting recommendations:', error);
    return [];
  }
}

/**
 * Get weather alerts for user
 */
export async function getWeatherAlerts(
  userLocation: { latitude: number; longitude: number }
): Promise<WeatherAlert[]> {
  try {
    // Mock weather data - in production, use real API
    const weather: WeatherCondition = {
      temperature: 22,
      feelsLike: 24,
      condition: 'SUNNY',
      description: 'Clear sky',
      humidity: 45,
      timestamp: new Date()
    };
    
    const alerts: WeatherAlert[] = [];
    
    // Temperature alerts
    if (weather.temperature > 35) {
      alerts.push({
        severity: 'WARNING',
        message: 'Extreme heat warning',
        suggestion: 'Stay hydrated and seek air-conditioned venues. Limit outdoor activity.'
      });
    } else if (weather.temperature < 0) {
      alerts.push({
        severity: 'WARNING',
        message: 'Freezing temperatures',
        suggestion: 'Dress warmly. Many outdoor venues may be closed.'
      });
    }
    
    // Weather condition alerts
    if (weather.condition === 'STORMY') {
      alerts.push({
        severity: 'SEVERE',
        message: 'Severe weather alert',
        suggestion: 'Stay indoors. Avoid unnecessary travel.'
      });
    } else if (weather.condition === 'RAINY') {
      alerts.push({
        severity: 'INFO',
        message: 'Rain expected',
        suggestion: 'Bring an umbrella or plan indoor activities.'
      });
    }
    
    // Humidity alerts
    if (weather.humidity > 80) {
      alerts.push({
        severity: 'INFO',
        message: 'High humidity',
        suggestion: 'Air-conditioned venues will be more comfortable.'
      });
    }
    
    return alerts;
  } catch (error) {
    console.error('[Weather Recommendations] Error getting alerts:', error);
    return [];
  }
}

/**
 * Suggest best time to visit based on weather forecast
 * Note: Requires weather forecast API in production
 */
export async function suggestBestVisitTime(
  businessId: string,
  nextDays: number = 3
): Promise<{
  bestTime: Date;
  weather: string;
  reason: string;
  alternativeTimes: Array<{ time: Date; weather: string }>;
}> {
  try {
    // Mock forecast data - in production, fetch real 3-7 day forecast
    const now = new Date();
    
    // Simulate: Best weather in 2 days
    const bestTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    bestTime.setHours(14, 0, 0, 0);
    
    return {
      bestTime,
      weather: 'Sunny, 24°C',
      reason: 'Perfect weather conditions and typically less crowded',
      alternativeTimes: [
        {
          time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          weather: 'Partly cloudy, 22°C'
        },
        {
          time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          weather: 'Sunny, 26°C'
        }
      ]
    };
  } catch (error) {
    console.error('[Weather Recommendations] Error suggesting visit time:', error);
    return {
      bestTime: new Date(),
      weather: 'Unknown',
      reason: 'Insufficient weather data',
      alternativeTimes: []
    };
  }
}

/**
 * Get weather-appropriate mission suggestions
 */
export async function getWeatherAppropriateMissions(
  userLocation: { latitude: number; longitude: number },
  availableMissions: any[]
): Promise<any[]> {
  try {
    // Mock weather
    const weather: WeatherCondition = {
      temperature: 22,
      feelsLike: 24,
      condition: 'SUNNY',
      description: 'Clear sky',
      humidity: 45,
      timestamp: new Date()
    };
    
    // Filter missions based on weather
    const appropriateMissions = availableMissions.filter(mission => {
      // Outdoor missions good for sunny weather
      if (mission.missionType === 'IN_PERSON' && mission.outdoorActivity) {
        return weather.condition === 'SUNNY' || weather.condition === 'CLOUDY';
      }
      
      // Indoor missions good for rainy/stormy weather
      if (mission.missionType !== 'IN_PERSON' || mission.indoorOnly) {
        return true; // Always appropriate
      }
      
      // Default: appropriate unless severe weather
      return weather.condition !== 'STORMY';
    });
    
    // Sort by weather suitability
    return appropriateMissions.sort((a, b) => {
      // Prioritize outdoor missions in good weather
      if (weather.condition === 'SUNNY') {
        if (a.outdoorActivity && !b.outdoorActivity) return -1;
        if (!a.outdoorActivity && b.outdoorActivity) return 1;
      }
      
      // Prioritize indoor missions in bad weather
      if (weather.condition === 'RAINY' || weather.condition === 'STORMY') {
        if (a.indoorOnly && !b.indoorOnly) return -1;
        if (!a.indoorOnly && b.indoorOnly) return 1;
      }
      
      return 0;
    });
  } catch (error) {
    console.error('[Weather Recommendations] Error filtering missions:', error);
    return availableMissions;
  }
}

/**
 * Integration helper: Fetch real weather data
 * This function shows how to integrate with OpenWeatherMap API
 * Requires API key to be set in environment variables
 */
export async function fetchRealWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherCondition | null> {
  try {
    // Example OpenWeatherMap API integration
    // const apiKey = process.env.VITE_OPENWEATHER_API_KEY;
    // if (!apiKey) return null;
    
    // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    // const response = await fetch(url);
    // const data = await response.json();
    
    // return {
    //   temperature: data.main.temp,
    //   feelsLike: data.main.feels_like,
    //   condition: mapWeatherCondition(data.weather[0].main),
    //   description: data.weather[0].description,
    //   humidity: data.main.humidity,
    //   timestamp: new Date()
    // };
    
    // For now, return mock data
    console.warn('[Weather] Using mock weather data. Integrate real API in production.');
    return null;
  } catch (error) {
    console.error('[Weather Recommendations] Error fetching weather:', error);
    return null;
  }
}

/**
 * Helper to map API weather codes to our conditions
 */
function mapWeatherCondition(apiCondition: string): WeatherCondition['condition'] {
  const mapping: Record<string, WeatherCondition['condition']> = {
    'Clear': 'SUNNY',
    'Clouds': 'CLOUDY',
    'Rain': 'RAINY',
    'Drizzle': 'RAINY',
    'Snow': 'SNOWY',
    'Thunderstorm': 'STORMY',
    'Mist': 'CLOUDY',
    'Fog': 'CLOUDY'
  };
  
  return mapping[apiCondition] || 'CLOUDY';
}
