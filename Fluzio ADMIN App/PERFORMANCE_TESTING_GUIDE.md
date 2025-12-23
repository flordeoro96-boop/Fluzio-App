# Performance Testing Guide

## Overview
Comprehensive performance testing strategy for Fluzio app.

## Test Categories

### 1. Query Performance Tests
**File:** `tests/performance/queryPerformance.test.ts`

Tests Firestore query optimization and data processing:
- Mission queries (100-1000 records)
- Redemption aggregations (500 records)
- Transaction filtering (200 records)
- Analytics calculations (90 days)
- Batch operations (50 items)
- Index utilization verification

**Thresholds:**
- Single query: < 500ms
- Batch operations: < 2000ms
- Complex aggregations: < 500ms

**Run:**
```bash
npm test queryPerformance
```

---

### 2. Component Performance Tests
**File:** `tests/performance/componentPerformance.test.tsx`

Tests React component rendering efficiency:
- Large list rendering (100+ items)
- Virtualized lists (1000+ items)
- Rapid state updates
- Conditional rendering toggles
- Memoization benefits
- Image loading (20 images)
- Form inputs (20 fields)
- Modal mount/unmount

**Thresholds:**
- Initial render: < 100ms
- Re-render: < 50ms
- List virtualization: < 100ms

**Run:**
```bash
npm test componentPerformance
```

---

### 3. Memory Performance Tests
**File:** `tests/performance/memoryPerformance.test.ts`

Tests memory usage and optimization:
- Memory leak detection
- Event listener cleanup
- Large array operations (10,000 items)
- Data structure efficiency (Set, Map, WeakMap)
- String operations
- Object cloning
- Array filtering/mapping/sorting
- Cache performance

**Thresholds:**
- Memory increase: < 10MB
- Array operations: < 50-200ms
- Cache lookup: < 1ms

**Run:**
```bash
npm test memoryPerformance
```

---

### 4. Lighthouse Performance Audit
**File:** `lighthouse.config.json`

Automated performance auditing:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)
- Speed Index
- Time to Interactive (TTI)

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Manual Run:**
1. Build production: `npm run build`
2. Serve: `npm run preview`
3. Run Lighthouse in Chrome DevTools (Desktop & Mobile)

**Automated Run (requires lighthouse-cli):**
```bash
npm install -g @lhci/cli
lhci autorun --config=lighthouse.config.json
```

---

## Running All Performance Tests

```bash
# Run all performance tests
npm test performance

# Run with coverage
npm test performance -- --coverage

# Run in UI mode
npm test performance -- --ui

# Run in watch mode
npm test performance -- --watch
```

---

## Performance Optimization Checklist

### ✅ Implemented Optimizations

1. **Database Indexes**
   - Composite indexes for mission queries
   - Indexes for user lookups
   - Indexes for redemption filtering

2. **Code Splitting**
   - Dynamic imports for services
   - Lazy loading for modals
   - Route-based code splitting (if implemented)

3. **React Optimizations**
   - React.memo for expensive components
   - useMemo for expensive calculations
   - useCallback for event handlers
   - Key props for list items

4. **Image Optimization**
   - Lazy loading with `loading="lazy"`
   - Responsive images
   - WebP format support

5. **Bundle Optimization**
   - Tree shaking enabled
   - Minification in production
   - Compression (gzip)

### 🔄 Recommended Future Optimizations

1. **Advanced Caching**
   - Service Worker for offline support
   - Cache API for static assets
   - IndexedDB for offline data

2. **Rendering Optimization**
   - Virtual scrolling for large lists
   - Skeleton screens for loading states
   - Progressive rendering

3. **Network Optimization**
   - HTTP/2 server push
   - CDN for static assets
   - Resource hints (preconnect, prefetch)

4. **Firebase Optimization**
   - Query result caching
   - Batched writes
   - Connection pooling

---

## Monitoring Performance in Production

### Firebase Performance Monitoring
Already integrated via `firebaseAnalytics.ts`:
- Automatic page load metrics
- Custom trace measurements
- Network request monitoring

### Sentry Performance Tracking
Already integrated via `@sentry/react`:
- Transaction monitoring
- Slow query detection
- Error correlation

### Custom Metrics
Track in `firebaseAnalytics.ts`:
```typescript
trackTiming('mission_load', duration);
trackTiming('analytics_calculation', duration);
```

---

## Performance Budgets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Bundle Size | < 2.5 MB | 2.1 MB | ✅ Pass |
| FCP | < 1.8s | TBD | ⏳ Test |
| LCP | < 2.5s | TBD | ⏳ Test |
| TBT | < 300ms | TBD | ⏳ Test |
| CLS | < 0.1 | TBD | ⏳ Test |
| Query Time | < 500ms | ✅ Pass | ✅ Pass |

---

## Troubleshooting Slow Performance

### Slow Queries
1. Check Firestore indexes in console
2. Verify composite indexes deployed
3. Review query complexity
4. Add query limits where appropriate

### Slow Rendering
1. Use React DevTools Profiler
2. Check for unnecessary re-renders
3. Verify memoization usage
4. Review large list rendering

### Memory Issues
1. Check for event listener cleanup
2. Review closure usage
3. Verify WeakMap/WeakSet for cleanup
4. Monitor heap size in DevTools

### Large Bundle
1. Analyze bundle with `vite build --report`
2. Review dynamic import usage
3. Check for duplicate dependencies
4. Remove unused code

---

## Next Steps

1. ✅ Performance tests created
2. ⏳ Run Lighthouse audit on production build
3. ⏳ Establish performance baselines
4. ⏳ Set up automated performance monitoring
5. ⏳ Create performance dashboard
6. ⏳ Implement performance budgets in CI/CD

---

**Last Updated:** December 2, 2025
**Status:** Performance testing framework complete ✅
