# Performance & Animation Quick Reference

## 🎨 Using Skeleton Components

### Basic Usage
```tsx
import { Skeleton, SkeletonCard, SkeletonMissionCard } from './Skeleton';

// Simple skeleton
<Skeleton variant="rectangular" width="100%" height="200px" />

// Generic card skeleton
<SkeletonCard />

// Mission-specific skeleton
<SkeletonMissionCard />

// Business card skeleton
<SkeletonBusinessCard />

// Multiple skeletons
<SkeletonList count={3} />
```

### Variants
- `text` - Single line text placeholder
- `circular` - Round avatar/icon placeholder
- `rectangular` - Full rectangle
- `rounded` - Rounded corners rectangle

### Animations
- `pulse` - Default breathing effect
- `wave` - Shimmer wave effect
- `none` - Static placeholder

## ⤵️ Using Pull-to-Refresh

```tsx
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

const MyScreen = () => {
  const handleRefresh = async () => {
    await loadData();
  };

  const { containerRef, isPulling, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    resistance: 2.5
  });

  return (
    <div ref={containerRef} className="overflow-y-auto">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={80}
        isRefreshing={isRefreshing}
      />
      {/* content */}
    </div>
  );
};
```

## 🎭 Using Transitions

```tsx
import { TabTransition, FadeTransition, SlideTransition, ScaleTransition } from './Transitions';

// Tab transitions
<TabTransition tabKey={activeTab}>
  {activeTab === 'home' && <HomeContent />}
</TabTransition>

// Simple fade
<FadeTransition show={isVisible} duration={300}>
  <Content />
</FadeTransition>

// Slide in from bottom
<SlideTransition show={isVisible} from="bottom" duration={300}>
  <Modal />
</SlideTransition>

// Scale animation
<ScaleTransition show={isVisible} duration={300}>
  <Popup />
</ScaleTransition>
```

## 🎊 Using Confetti

```tsx
import { Confetti, SuccessAnimation } from './Confetti';

const MyComponent = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRewardClaim = async () => {
    await claimReward();
    setShowSuccess(true);
  };

  return (
    <>
      <button onClick={handleRewardClaim}>Claim Reward</button>
      
      {/* Just confetti */}
      <Confetti active={showConfetti} duration={3000} particleCount={50} />
      
      {/* Confetti + success modal */}
      <SuccessAnimation
        show={showSuccess}
        message="Reward Claimed!"
        confetti={true}
        duration={3000}
        onComplete={() => setShowSuccess(false)}
      />
    </>
  );
};
```

## 📏 Component Props Reference

### Skeleton
```tsx
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}
```

### usePullToRefresh
```tsx
interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;        // Default: 80
  resistance?: number;       // Default: 2.5
}

// Returns
{
  containerRef: RefObject<HTMLDivElement>;
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  shouldTrigger: boolean;
}
```

### Confetti
```tsx
interface ConfettiProps {
  active: boolean;
  duration?: number;         // Default: 3000ms
  particleCount?: number;    // Default: 50
}
```

### SuccessAnimation
```tsx
interface SuccessAnimationProps {
  show: boolean;
  message?: string;          // Default: "Success!"
  confetti?: boolean;        // Default: true
  duration?: number;         // Default: 3000ms
  onComplete?: () => void;
}
```

## 🎨 Animation Timing

### Standard Durations
- **Quick**: 150-200ms (micro-interactions)
- **Normal**: 200-300ms (transitions, modals)
- **Slow**: 300-500ms (complex animations)
- **Celebration**: 2000-3000ms (confetti, success)

### Easing Functions
- `ease-out` - Fast start, slow end (default for exits)
- `ease-in` - Slow start, fast end (default for entrances)
- `ease-in-out` - Slow start and end (smooth both ways)
- `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - Spring bounce

## 🚀 Performance Best Practices

### Skeleton Loading
1. Match skeleton layout to actual content (prevents layout shift)
2. Use consistent animation (pulse recommended)
3. Show skeletons immediately (no delay)
4. Transition smoothly to real content

### Pull-to-Refresh
1. Only enable when scrolled to top
2. Use passive event listeners
3. Clean up event listeners in useEffect
4. Provide visual feedback at all stages

### Animations
1. Use `transform` and `opacity` (GPU-accelerated)
2. Avoid animating `width`, `height`, `left`, `right`
3. Keep animations under 500ms
4. Test on low-end devices

### Confetti
1. Limit particle count on mobile (30-50)
2. Auto-cleanup after animation
3. Use fixed positioning (no document scroll)
4. Disable on reduced motion preference

## 🔧 Customization Examples

### Custom Skeleton Colors
```tsx
<Skeleton 
  className="bg-gradient-to-r from-purple-100 to-pink-100"
  variant="rectangular"
/>
```

### Custom Pull Threshold
```tsx
const { ... } = usePullToRefresh({
  onRefresh: handleRefresh,
  threshold: 100,  // Longer pull required
  resistance: 3    // More resistance
});
```

### Custom Confetti Colors
Edit `components/Confetti.tsx`:
```tsx
const colors = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
];
```

### Custom Success Message
```tsx
<SuccessAnimation
  show={true}
  message="🎉 Mission Complete!"
  confetti={true}
/>
```

## 📱 Mobile Considerations

### Touch Events
- Pull-to-refresh uses `touchstart`, `touchmove`, `touchend`
- Prevent default on scroll when pulling
- Use passive listeners for better performance

### Reduced Motion
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Disable animations if user prefers reduced motion
<Skeleton animation={prefersReducedMotion ? 'none' : 'pulse'} />
```

### Viewport Size
```tsx
// Responsive skeleton sizing
<Skeleton 
  width="100%"
  height="clamp(100px, 20vh, 200px)"
/>
```

## 🎯 Common Patterns

### Loading State Pattern
```tsx
const [loading, setLoading] = useState(true);

return (
  <>
    {loading && <SkeletonMissionCard />}
    {!loading && <MissionCard data={mission} />}
  </>
);
```

### Empty State Pattern
```tsx
{loading && <SkeletonList count={3} />}
{!loading && data.length === 0 && <EmptyState />}
{!loading && data.length > 0 && data.map(item => <Item {...item} />)}
```

### Success Flow Pattern
```tsx
const [showSuccess, setShowSuccess] = useState(false);

const handleAction = async () => {
  try {
    await performAction();
    setShowSuccess(true);
  } catch (error) {
    showError(error);
  }
};

return (
  <>
    <button onClick={handleAction}>Do Action</button>
    <SuccessAnimation
      show={showSuccess}
      message="Action completed!"
      onComplete={() => {
        setShowSuccess(false);
        // Navigate or update UI
      }}
    />
  </>
);
```

## 🐛 Troubleshooting

### Skeleton Not Showing
- Check loading state is `true`
- Verify component is imported correctly
- Check parent container has height

### Pull-to-Refresh Not Triggering
- Ensure `containerRef` is attached to scrollable element
- Check element's `scrollTop === 0`
- Verify `touchAction: 'pan-y'` is set

### Confetti Not Visible
- Check `z-index` (should be 9999)
- Verify `active={true}` is set
- Check particles are created (console log)

### Animation Jank
- Use `transform` instead of `top/left`
- Check for re-renders during animation
- Reduce particle count on confetti
- Test on actual mobile device

## 📚 Further Reading

- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

**Version**: 2.0.0  
**Last Updated**: November 30, 2025
