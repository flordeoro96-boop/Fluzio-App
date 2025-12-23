/**
 * Navigation Configuration for Fluzio Customer App
 * 
 * Defines bottom tab navigation structure with routes and icons.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Main tab keys for bottom navigation
 */
export type MainTabKey = 'home' | 'discover' | 'rewards' | 'missions' | 'events';

/**
 * Tab configuration interface
 */
export interface TabConfig {
  /** Unique tab key */
  key: MainTabKey;
  
  /** Display label */
  label: string;
  
  /** Icon name (using Lucide React icons) */
  iconName: string;
  
  /** Route/screen name */
  routeName: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Main bottom navigation tabs configuration
 */
export const MAIN_TABS: TabConfig[] = [
  {
    key: 'home',
    label: 'Home',
    iconName: 'home',
    routeName: 'HomeScreen'
  },
  {
    key: 'discover',
    label: 'Discover',
    iconName: 'search',
    routeName: 'DiscoverScreen'
  },
  {
    key: 'rewards',
    label: 'Rewards',
    iconName: 'gift',
    routeName: 'RewardsScreen'
  },
  {
    key: 'missions',
    label: 'Missions',
    iconName: 'target',
    routeName: 'MissionsScreen'
  },
  {
    key: 'events',
    label: 'Events',
    iconName: 'calendar',
    routeName: 'EventsScreen'
  }
];
