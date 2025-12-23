# Admin Access Guide

## Admin Features Overview

As an **ADMIN user**, you have access to the complete administrative control panel for managing the Fluzio platform.

## How to Access Admin Features

### Method 1: Admin Panel Button (Visible UI)
1. Log in with your admin account (`admin@fluzio.com`)
2. Click the **profile avatar** in the top-left corner (you'll see a purple shield badge on it)
3. In the drawer menu, look for the **"Admin Panel"** button with the purple/pink gradient shield icon
4. Click "Admin Panel" to open the full admin dashboard

### Method 2: Keyboard Shortcut (Quick Access)
- **Windows/Linux**: `Ctrl + Shift + A`
- **Mac**: `Cmd + Shift + A`

## Visual Admin Indicators

When logged in as an ADMIN, you'll see:

1. **Shield Badge on Avatar**: A small purple/pink shield icon on your profile picture
2. **"ADMIN MODE" Label**: Displayed under the Fluzio logo in the header
3. **Admin Panel Menu Item**: Purple/pink gradient button in the user drawer
4. **ADMIN Badge**: Next to "Admin Panel" text in the menu

## Admin Dashboard Features

The admin dashboard includes 9 comprehensive tabs:

### 1. Overview Tab
- Platform statistics (users, businesses, missions, rewards)
- Quick actions (verify business, approve mission, manage event)
- Recent activity feed
- System health indicators

### 2. Users Tab
- View all platform users
- Search and filter users
- Ban/unban user accounts
- View user details and activity

### 3. Businesses Tab
- Manage all business accounts
- Verify/unverify businesses
- View business metrics
- Search and filter businesses

### 4. Missions Tab
- View all platform missions
- Approve or reject pending missions
- Content moderation
- Mission analytics

### 5. Events Tab ⭐ (Primary Feature)
- **Create platform-wide events**
- Edit existing events
- Delete events
- View event registrations
- Categories: Networking, Workshop, Meetup, Conference, Social

### 6. Rewards Tab
- Oversee reward redemptions
- View reward analytics
- Manage reward catalog
- Track redemption trends

### 7. Moderation Tab
- Content moderation tools
- Report management
- User-generated content review
- Flagged content queue

### 8. Analytics Tab
- Platform insights and metrics
- User engagement statistics
- Revenue analytics
- Growth trends

### 9. Settings Tab
- Platform configuration
- Feature flags
- System settings
- Admin preferences

## Creating Platform Events

As an admin, you can create events that appear to all users:

1. Open Admin Dashboard
2. Navigate to **Events** tab
3. Click **"Create Event"** button
4. Fill in event details:
   - **Title**: Event name
   - **Description**: Full event description
   - **Date**: Event date (YYYY-MM-DD)
   - **Time**: Event time (HH:MM)
   - **Location**: Event venue/address
   - **Max Attendees** (optional): Capacity limit
   - **Category**: Event type
5. Click **"Create Event"**

Events will be saved to the `premium_events` collection in Firestore with:
- `organizerId: "ADMIN"`
- `organizerName: "Fluzio"`
- `status: "REGISTRATION_OPEN"`

## Admin Account Details

- **Email**: `admin@fluzio.com`
- **Role**: `ADMIN` (set in Firestore)
- **UID**: `CJDGOcJEBJPDgMVyupbqFHYJxRi2`

## Security & Permissions

Admin access is controlled by:
```typescript
user.role === UserRole.ADMIN || user.email === 'admin@fluzio.com'
```

Firestore security rules ensure only authenticated admins can:
- Create/edit/delete events
- Moderate content
- Verify businesses
- Access user data

## Tips

- **Admin panel is modal**: Click the X or outside to close
- **Keyboard shortcut works anywhere**: Press `Ctrl+Shift+A` from any screen
- **Search functionality**: Available in all tabs for quick filtering
- **Refresh button**: Keep data up-to-date with live platform changes
- **Visual distinction**: Admin features use purple/pink gradient theme

## Deployment

Admin features are live at: **https://fluzio-13af2.web.app/**

---

**Last Updated**: Admin UI visibility enhancements deployed
**Status**: ✅ Fully functional and accessible
