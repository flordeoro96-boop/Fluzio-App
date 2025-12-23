/**
 * Fluzio Brand Color System
 * Updated: December 2025
 * 
 * This file contains the complete color palette for the Fluzio platform.
 * All components should reference these constants instead of hardcoded colors.
 */

export const fluzioColors = {
  // LIGHT MODE
  light: {
    background: '#F7F8FA',
    cardBackground: '#FFFFFF',
    divider: '#E5E7EB',
    primary: '#00E5FF', // Electric Cyan
    secondary: '#6C4BFF', // Violet Edge
    accent: '#FFB86C', // Apricot Energy
    success: '#C8FF1A', // Lime Spark
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    gradient: 'linear-gradient(135deg, #00E5FF 0%, #6C4BFF 100%)',
  },

  // DARK MODE
  dark: {
    background: '#0F1115',
    cardBackground: '#1A1D23',
    divider: '#2A2D35',
    primary: '#00E5FF', // Electric Cyan
    secondary: '#6C4BFF', // Violet Edge
    accent: '#FFB86C', // Apricot Energy
    success: '#C8FF1A', // Lime Spark
    textPrimary: '#F3F4F6',
    textSecondary: '#9CA3AF',
    gradient: 'linear-gradient(135deg, #00E5FF 0%, #6C4BFF 100%)',
  },

  // LEVEL COLORS (for badges, profile rings, XP bars)
  levels: {
    1: '#D0D4E4',
    2: '#00E5FF',
    3: '#00E5FF', // gradient with #6C4BFF
    4: '#6C4BFF',
    5: '#6C4BFF', // gradient
    6: '#6C4BFF', // strong glow
    7: '#6C4BFF', // violet glow
    8: '#6C4BFF', // halo
    9: '#6C4BFF', // neon
    10: '#FFB86C',
    11: '#FFB86C', // glow
    12: '#FFB86C', // gradient
    13: '#C8FF1A',
    14: '#C8FF1A', // neon
    15: '#FFFFFF', // Diamond white glow (with #E5E7EB, animated)
  },
} as const;

/**
 * Tailwind CSS class mappings for Fluzio colors
 * Use these in className strings
 */
export const fluzioTailwind = {
  // Primary Colors
  primary: {
    bg: 'bg-[#00E5FF]',
    text: 'text-[#00E5FF]',
    border: 'border-[#00E5FF]',
    ring: 'ring-[#00E5FF]',
    hover: {
      bg: 'hover:bg-[#00E5FF]',
      text: 'hover:text-[#00E5FF]',
      border: 'hover:border-[#00E5FF]',
    },
  },

  // Secondary Colors
  secondary: {
    bg: 'bg-[#6C4BFF]',
    text: 'text-[#6C4BFF]',
    border: 'border-[#6C4BFF]',
    ring: 'ring-[#6C4BFF]',
    hover: {
      bg: 'hover:bg-[#6C4BFF]',
      text: 'hover:text-[#6C4BFF]',
      border: 'hover:border-[#6C4BFF]',
    },
  },

  // Accent Colors
  accent: {
    bg: 'bg-[#FFB86C]',
    text: 'text-[#FFB86C]',
    border: 'border-[#FFB86C]',
    ring: 'ring-[#FFB86C]',
    hover: {
      bg: 'hover:bg-[#FFB86C]',
      text: 'hover:text-[#FFB86C]',
      border: 'hover:border-[#FFB86C]',
    },
  },

  // Success Colors
  success: {
    bg: 'bg-[#C8FF1A]',
    text: 'text-[#C8FF1A]',
    border: 'border-[#C8FF1A]',
    ring: 'ring-[#C8FF1A]',
    hover: {
      bg: 'hover:bg-[#C8FF1A]',
      text: 'hover:text-[#C8FF1A]',
      border: 'hover:border-[#C8FF1A]',
    },
  },

  // Gradients
  gradients: {
    primary: 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF]',
    primaryDiagonal: 'bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF]',
    primaryVertical: 'bg-gradient-to-b from-[#00E5FF] to-[#6C4BFF]',
    accent: 'bg-gradient-to-r from-[#FFB86C] to-[#00E5FF]',
    success: 'bg-gradient-to-r from-[#C8FF1A] to-[#00E5FF]',
    text: 'bg-clip-text text-transparent bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF]',
  },

  // Backgrounds
  bg: {
    light: 'bg-[#F7F8FA]',
    dark: 'bg-[#0F1115]',
    card: {
      light: 'bg-[#FFFFFF]',
      dark: 'bg-[#1A1D23]',
    },
  },

  // Text
  text: {
    primary: {
      light: 'text-[#111827]',
      dark: 'text-[#F3F4F6]',
    },
    secondary: {
      light: 'text-[#6B7280]',
      dark: 'text-[#9CA3AF]',
    },
  },

  // Dividers
  divider: {
    light: 'border-[#E5E7EB]',
    dark: 'border-[#2A2D35]',
  },
} as const;

/**
 * Get level color based on user level
 */
export const getLevelColor = (level: number): string => {
  if (level <= 0 || level > 15) return fluzioColors.levels[1];
  return fluzioColors.levels[level as keyof typeof fluzioColors.levels];
};

/**
 * Get level gradient class for Tailwind
 */
export const getLevelGradient = (level: number): string => {
  if (level >= 13) return 'from-[#C8FF1A] to-[#00E5FF]';
  if (level >= 10) return 'from-[#FFB86C] to-[#6C4BFF]';
  if (level >= 3) return 'from-[#00E5FF] to-[#6C4BFF]';
  return 'from-[#D0D4E4] to-[#00E5FF]';
};

/**
 * Get level ring color (for profile avatars, badges)
 */
export const getLevelRing = (level: number): string => {
  const color = getLevelColor(level);
  return `ring-4 ring-[${color}]`;
};

/**
 * Old color mapping (for migration reference)
 * DO NOT USE - Use fluzioColors instead
 */
export const OLD_COLORS = {
  pink: '#F72585',
  purple: '#7209B7',
  deepPurple: '#560BAD',
  blue: '#3A0CA3',
  lightBlue: '#4361EE',
  yellow: '#FFC300',
  oldGradient: 'from-[#FFC300] via-[#F72585] to-[#7209B7]',
} as const;
