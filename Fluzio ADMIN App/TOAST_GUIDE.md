# Toast Notification System - Quick Reference

## Setup (Already Done ✅)

The toast system is ready to use. Just import the hook in any component.

## Basic Usage

```typescript
import { useToast } from '../hooks/useToast';

function MyComponent() {
  const { success, error, warning, info, toasts, removeToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      success('Profile saved successfully!');
    } catch (err) {
      error('Failed to save profile');
    }
  };

  return (
    <div>
      {/* Your component */}
      <button onClick={handleSave}>Save</button>
      
      {/* Toast Container - place at end of component */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
```

## Toast Types

### Success (Green)
```typescript
success('Profile updated successfully!');
success('File uploaded!');
success('Message sent!');
```

### Error (Red)
```typescript
error('Failed to upload file');
error('Invalid email address');
error('Connection lost');
```

### Warning (Yellow)
```typescript
warning('File size exceeds 5MB limit');
warning('Session expires in 5 minutes');
warning('Unsaved changes will be lost');
```

### Info (Blue)
```typescript
info('New message received');
info('System maintenance scheduled');
info('Profile viewed by 12 people');
```

## Replacing alert() Calls

### Before (❌ Blocking UI):
```typescript
alert('Profile saved successfully!');
alert('Failed to upload file');
confirm('Are you sure?'); // Use Modal component instead
```

### After (✅ Non-blocking):
```typescript
const { success, error } = useToast();

success('Profile saved successfully!');
error('Failed to upload file');
// For confirms, use Modal component, not toasts
```

## Migration Examples

### Example 1: SignUpScreen.tsx
```typescript
// ❌ Before
alert('Please enter both email and password');

// ✅ After
const { warning } = useToast();
warning('Please enter both email and password');
```

### Example 2: BusinessProfileScreen.tsx
```typescript
// ❌ Before
alert('Google account connected successfully!');

// ✅ After
const { success } = useToast();
success('Google account connected successfully!');
```

### Example 3: InboxScreen.tsx
```typescript
// ❌ Before
alert('Failed to create conversation. Please try again.');

// ✅ After
const { error } = useToast();
error('Failed to create conversation. Please try again.');
```

## Advanced: Custom Duration

```typescript
import { Toast } from '../components/Toast';

<Toast
  message="This will stay for 10 seconds"
  type="info"
  duration={10000}  // 10 seconds
  onClose={() => {}}
/>
```

## Integration Checklist

For each component with alert():

1. ✅ Import useToast hook
2. ✅ Destructure toast functions
3. ✅ Replace alert() calls
4. ✅ Add ToastContainer to JSX
5. ✅ Test notifications

## Component Template

```typescript
import React from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

export const MyComponent = () => {
  const { success, error, warning, info, toasts, removeToast } = useToast();

  const handleAction = async () => {
    try {
      // Your logic
      success('Action completed!');
    } catch (err) {
      error('Action failed');
    }
  };

  return (
    <div>
      {/* Your UI */}
      
      {/* Toast Container - at end */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
```

## Files to Update (50+ alerts)

High priority files with most alerts:

1. **BusinessProfileScreen.tsx** (12 alerts)
2. **EditBusinessProfile.tsx** (14 alerts)
3. **SignUpScreen.tsx** (7 alerts)
4. **InboxScreen.tsx** (6 alerts)
5. **ExploreScreen.tsx** (4 alerts)
6. **SquadView.tsx** (3 alerts)
7. **ChatScreen.tsx** (2 alerts)
8. **SettingsView.tsx** (5 alerts)
9. **MissionCreationModal.tsx** (2 alerts)
10. **SquadActivityPlanner.tsx** (1 alert)

## Benefits

✅ **Non-blocking**: User can continue working  
✅ **Auto-dismiss**: No manual closing needed  
✅ **Stacked**: Multiple notifications visible  
✅ **Animated**: Smooth slide-in/out  
✅ **Accessible**: Proper contrast and sizing  
✅ **Mobile-friendly**: Responsive design  
✅ **Type-safe**: TypeScript support  
✅ **Customizable**: Duration, type, message  

## Don't Use Toasts For

❌ **Confirmations** - Use Modal component instead  
❌ **Complex forms** - Use inline validation  
❌ **Long messages** - Use Modal or page  
❌ **Critical errors** - Use error page/modal  

## Best Practices

1. **Keep messages short** (max 1-2 sentences)
2. **Be specific** ("Profile saved" not "Success")
3. **Use appropriate type** (error for failures, success for completion)
4. **Avoid overuse** (not for every click)
5. **Test on mobile** (ensure readable on small screens)

## Testing

```typescript
// Test all toast types
success('Test success');
error('Test error');
warning('Test warning');
info('Test info');

// Test multiple toasts
success('First notification');
setTimeout(() => info('Second notification'), 1000);
setTimeout(() => warning('Third notification'), 2000);
```
