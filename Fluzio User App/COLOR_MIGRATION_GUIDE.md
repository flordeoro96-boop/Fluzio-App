# Fluzio Color Palette Migration Guide

## Overview
This document outlines the complete color refactoring from the old pink/purple palette to the new Electric Cyan/Violet Edge palette.

## Color Mapping

### Old → New

| Old Color | Hex | New Color | Hex | Usage |
|-----------|-----|-----------|-----|-------|
| Hot Pink | `#F72585` | Electric Cyan | `#00E5FF` | Primary actions, highlights |
| Purple | `#7209B7` | Violet Edge | `#6C4BFF` | Secondary actions, accents |
| Deep Purple | `#560BAD` | (merged into Violet Edge) | `#6C4BFF` | - |
| Dark Blue | `#3A0CA3` | (removed) | - | Use Violet Edge instead |
| Light Blue | `#4361EE` | (removed) | - | Use Electric Cyan instead |
| Yellow | `#FFC300` | Apricot Energy | `#FFB86C` | Accent highlights |
| - | - | Lime Spark (NEW) | `#C8FF1A` | Success states |

### Gradients

**Old:**
```css
background: linear-gradient(135deg, #FFC300 0%, #F72585 50%, #7209B7 100%);
```

**New:**
```css
background: linear-gradient(135deg, #00E5FF 0%, #6C4BFF 100%);
```

## Migration Strategy

### Phase 1: Create Theme System ✅
- [x] Create `styles/fluzioTheme.ts` with color constants
- [x] Export Tailwind class mappings
- [x] Create helper functions for level colors

### Phase 2: Update Common Components (Priority 1)
Core components that affect the entire app:

#### High Priority
- [ ] `components/Common.tsx` - Button, Input, Select, TextArea base components
- [ ] `components/CustomerHeader.tsx` - Header gradient and logo
- [ ] `components/CustomerSidebar.tsx` - Navigation, profile avatar ring
- [ ] `App.tsx` - Bottom navigation, notification badges, spinner

#### Medium Priority
- [ ] `components/SignUpScreen.tsx` - Registration flow
- [ ] `components/CustomerScreens.tsx` - Main customer screens
- [ ] `components/RewardsScreen.tsx` - Rewards catalog
- [ ] `components/InboxScreen.tsx` - Messaging interface

### Phase 3: Update Business Components (Priority 2)
- [ ] `components/RewardsManagement.tsx`
- [ ] `components/business/RewardsManagement.tsx`
- [ ] `components/business/AnalyticsDashboard.tsx`
- [ ] `components/business/CustomerCRM.tsx`
- [ ] `components/MissionCreationModal.tsx`

### Phase 4: Update Feature Components (Priority 3)
- [ ] `components/CustomerProfileModal.tsx`
- [ ] `components/DailyChallengesModal.tsx`
- [ ] `components/LeaderboardModal.tsx`
- [ ] `components/OnboardingFlow.tsx`
- [ ] `components/MissionsMapView.tsx`

### Phase 5: Update Admin & Settings (Priority 4)
- [ ] `components/admin/*.tsx` - All admin components
- [ ] `components/security/*.tsx` - Security settings
- [ ] `components/notifications/*.tsx` - Notification system

### Phase 6: Update Backend (Priority 5)
- [ ] `functions/index.js` - Email templates
- [ ] Email HTML templates

## Search & Replace Patterns

### Pattern 1: Simple Color Replacement
```bash
# Find
#F72585

# Replace  
#00E5FF
```

### Pattern 2: Gradient Updates
```bash
# Find
from-[#FFC300] via-[#F72585] to-[#7209B7]

# Replace
from-[#00E5FF] to-[#6C4BFF]
```

### Pattern 3: Shadow Colors
```bash
# Find
shadow-[#F72585]/20

# Replace
shadow-[#00E5FF]/20
```

### Pattern 4: Ring/Border Colors
```bash
# Find
ring-[#F72585]

# Replace
ring-[#00E5FF]
```

## Testing Checklist

After each component update:

- [ ] Light mode appearance
- [ ] Dark mode appearance (if applicable)
- [ ] Hover states
- [ ] Active/selected states
- [ ] Loading spinners
- [ ] Gradients render correctly
- [ ] Shadows have appropriate opacity
- [ ] Accessibility contrast ratios maintained

## Component-Specific Notes

### Buttons
- Primary buttons: Electric Cyan (`#00E5FF`)
- Secondary buttons: Violet Edge (`#6C4BFF`)
- Gradient buttons: `from-[#00E5FF] to-[#6C4BFF]`
- Success buttons: Lime Spark (`#C8FF1A`)

### Level Badges
Use `getLevelColor(level)` function from `fluzioTheme.ts`:
- Levels 1-2: Gray/Cyan
- Levels 3-9: Cyan to Violet gradient
- Levels 10-12: Apricot
- Levels 13-15: Lime Spark

### Avatars
- Profile rings: Use `getLevelRing(level)`
- Gradient backgrounds: `from-[#00E5FF] to-[#6C4BFF]`

### Notifications
- Unread badge: Electric Cyan (`#00E5FF`)
- Success: Lime Spark (`#C8FF1A`)
- Info: Violet Edge (`#6C4BFF`)
- Warning: Apricot Energy (`#FFB86C`)

## Files Requiring Manual Review

These files have complex color usage that needs careful migration:

1. **App.tsx** (3081 lines)
   - Bottom navigation active states
   - Notification badges
   - Profile avatar rings
   - Loading spinners

2. **SignUpScreen.tsx** (1887 lines)
   - Progress bars
   - Step indicators
   - Category selection cards

3. **CustomerScreens.tsx** (560 lines)
   - Filter buttons
   - Mission cards
   - Story rings

4. **RewardsManagement.tsx** (780 lines)
   - AI generation button
   - Form inputs focus states
   - Reward cards

5. **InboxScreen.tsx** (870 lines)
   - Message bubbles
   - Unread indicators
   - Search input

## Automated Migration Script

Due to the scope (800+ occurrences), consider using this VSCode find/replace sequence:

```json
{
  "replacements": [
    { "find": "#F72585", "replace": "#00E5FF" },
    { "find": "#7209B7", "replace": "#6C4BFF" },
    { "find": "#560BAD", "replace": "#6C4BFF" },
    { "find": "#4361EE", "replace": "#00E5FF" },
    { "find": "#3A0CA3", "replace": "#6C4BFF" },
    { "find": "#FFC300", "replace": "#FFB86C" },
    { "find": "from-[#FFC300] via-[#F72585] to-[#7209B7]", "replace": "from-[#00E5FF] to-[#6C4BFF]" },
    { "find": "from-[#F72585] to-[#7209B7]", "replace": "from-[#00E5FF] to-[#6C4BFF]" },
    { "find": "from-[#F72585] via-[#7209B7] to-[#560BAD]", "replace": "from-[#00E5FF] to-[#6C4BFF]" }
  ]
}
```

## Rollout Plan

### Step 1: Theme Foundation (Completed)
✅ Create `styles/fluzioTheme.ts`

### Step 2: Core Components (Week 1)
- Update Common.tsx
- Update CustomerHeader.tsx
- Update bottom navigation in App.tsx

### Step 3: Customer Experience (Week 1-2)
- Update all customer-facing screens
- Update rewards, missions, messaging

### Step 4: Business Dashboard (Week 2)
- Update business components
- Update analytics, CRM, reward management

### Step 5: Admin & Backend (Week 3)
- Update admin panels
- Update email templates
- Update Firebase functions

### Step 6: Testing & Refinement (Week 3-4)
- Visual regression testing
- Accessibility audit
- Performance testing
- User feedback

## Success Criteria

- ✅ No hardcoded old colors (#F72585, #7209B7, etc.)
- ✅ All components use `fluzioTheme.ts` or Tailwind classes
- ✅ Gradients follow new palette
- ✅ Level colors properly mapped
- ✅ Accessibility contrast ratios maintained (4.5:1 minimum)
- ✅ All loading spinners use new colors
- ✅ All shadows use new color palette
- ✅ Email templates updated

## Notes

- The new Electric Cyan (#00E5FF) is brighter and more energetic than the old Hot Pink
- Violet Edge (#6C4BFF) is more saturated than the old purple
- Apricot Energy (#FFB86C) provides warmth previously lacking
- Lime Spark (#C8FF1A) adds high-energy success states
- New palette has better contrast ratios for accessibility
- Gradients are simplified (2 colors instead of 3)

## Questions & Decisions

1. **Q**: Should we maintain a "legacy mode" toggle?
   **A**: No - complete migration preferred

2. **Q**: What about user-uploaded content with old colors?
   **A**: Not affected - only UI components change

3. **Q**: Do email templates need immediate update?
   **A**: Lower priority - can be done in Phase 6

4. **Q**: Should we update Firebase storage URLs?
   **A**: No - only code/styles affected
