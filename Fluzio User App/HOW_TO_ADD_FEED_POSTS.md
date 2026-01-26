# How to Add Feed Posts

## 🎯 Quick Access

**App URL:** https://fluzio-13af2.web.app/

**Feed Tab Location:**
- **Users:** First tab (leftmost) in bottom navigation
- **Creators:** First tab (leftmost) in bottom navigation  
- **Businesses:** First tab (leftmost) in bottom navigation

---

## 👤 **As a Regular USER**

### What You Can Post:
1. **Experience Posts** - Share places you've discovered
2. **Moments** - Quick snapshots from your day

### How to Create a Post:

1. **Navigate to Feed Tab** (leftmost icon)
2. **Click the + FAB** (floating purple button, bottom right)
3. **Select Content Type:**
   - Choose "Experience Post" or "Moment"
4. **Add Details:**
   - **Caption:** Describe your experience (max 2000 characters)
   - **Media:** Click "Choose Files" to add photos/videos (max 5)
   - **Location:** Add place name (e.g., "Café Mitte, Berlin")
   - **Business Tag:** Optional - tag the business if it exists in Fluzio
   - **Tags:** Add hashtags for discovery (e.g., #coffee #berlin #cafe)
5. **Click "Post"**

### Example User Post:

```
Content Type: Experience Post
Caption: Just had the most amazing brunch at this hidden gem in Kreuzberg! 🥐☕ 
         The avocado toast is to die for and the vibe is perfect for lazy Sundays.
         Highly recommend!
Location: Sunday Brunch Spot, Berlin
Tags: #brunch #berlin #kreuzberg #foodie #weekend
Media: [Photo of food and interior]
```

---

## 🎨 **As a CREATOR**

### What You Can Post:
1. **Creator Content** - Showcase your portfolio work
2. **Behind-the-scenes** - Show your creative process
3. **Concept Work** - Share ideas and inspiration

### How to Create a Post:

1. **Navigate to Feed Tab** (leftmost icon)
2. **Click the + FAB** (floating purple button)
3. **Select Content Type:**
   - Choose "Creator Content"
4. **Add Details:**
   - **Caption:** Describe your work, process, or inspiration
   - **Media:** Upload your best work (photos/videos, max 5)
   - **Location:** Optional - where the work was created
   - **Tags:** Add relevant skills/categories (#photography #fashion #portrait)
5. **Click "Post"**

### Example Creator Post:

```
Content Type: Creator Content
Caption: Product photography session for a local sustainable fashion brand 📸✨
         Shot on natural light with minimal editing to showcase the organic textures.
         Love working with brands that align with my values!
Location: Studio Berlin
Tags: #photography #productphotography #sustainablefashion #berlin #commercial
Media: [3-4 professional product photos]
```

### How to Apply to Collaborations:

1. **Browse Feed** (Discover tab)
2. **Find a Collaboration Call** (green "Apply" button)
3. **Click "Apply"**
4. **System submits your application** (notification sent to business)
5. **Business contacts you** if selected

---

## 🏢 **As a BUSINESS**

### What You Can Post:
1. **Business Announcements** - New products, events, updates
2. **Collaboration Calls** - Recruit creators for campaigns
3. **Experience Posts** - Showcase your venue/offerings

### How to Create an Announcement:

1. **Navigate to Feed Tab** (leftmost icon)
2. **Click the + FAB** (floating purple button)
3. **Select Content Type:**
   - Choose "Business Announcement"
4. **Add Details:**
   - **Caption:** Share your news or update
   - **Media:** High-quality photos/videos of your business
   - **Location:** Your business location
   - **Tags:** Relevant categories (#restaurant #newmenu #grandopening)
5. **Click "Post"**

### Example Business Announcement:

```
Content Type: Business Announcement
Caption: 🎉 Grand Opening Next Week! 
         We're excited to announce the opening of our new location in Prenzlauer Berg!
         Join us for our soft launch on Friday - first 50 guests get a complimentary drink 🥂
Location: New Location, Prenzlauer Berg, Berlin
Tags: #grandopening #berlin #prenzlauerberg #newrestaurant #event
Media: [Interior photos, food photos, team photo]
```

### How to Create a Collaboration Call:

1. **Navigate to Feed Tab**
2. **Click the + FAB**
3. **Select Content Type:**
   - Choose "Collaboration Call"
4. **Fill Collaboration Details:**
   - **Caption:** What you're looking for
   - **Budget:** Amount (in EUR)
   - **Compensation:** Select type (Paid/Points/Product/Experience)
   - **Requirements:** What you expect from creators (add multiple)
   - **Deadline:** Application deadline date
   - **Spots Available:** How many creators you need
   - **Media:** Add campaign visuals or mood board
   - **Tags:** Relevant skills (#photography #fashion #contentcreator)
5. **Click "Post"**

### Example Collaboration Call:

```
Content Type: Collaboration Call
Caption: Looking for food photographers to capture our new seasonal menu! 📸🍽️
         We need high-quality content for social media and our website.
Budget: €800
Compensation: Paid
Requirements:
  - Portfolio with food photography
  - Experience with natural light
  - Available for 4-hour shoot in early February
  - Minimum 1 year experience
Deadline: January 20, 2026
Spots Available: 2
Location: Our Restaurant, Berlin Mitte
Tags: #foodphotography #collaboration #berlin #restaurant #contentcreator
Media: [Current menu photos, restaurant interior]
```

---

## 📱 **Content Creator Interface**

### Modal Layout:

```
+------------------------------------------+
|  [X]           New Post                  |
+------------------------------------------+
|                                          |
|  Content Type: [Dropdown]                |
|   - Experience Post                      |
|   - Moment                               |
|   - Creator Content (Creators only)      |
|   - Business Announcement (Business)     |
|   - Collaboration Call (Business)        |
|                                          |
|  Caption: [Text Area - 2000 chars max]   |
|                                          |
|  Media: [Choose Files Button]            |
|   Preview: [Image] [X] [Image] [X]       |
|                                          |
|  Location: [Text Input]                  |
|  Business Tag: [Text Input - Optional]   |
|                                          |
|  Tags: [Tag Input]                       |
|   [#coffee] [X] [#berlin] [X] [+ Add]    |
|                                          |
|  --- IF Collaboration Call ---           |
|  Budget (EUR): [Number Input]            |
|  Compensation: [Dropdown]                |
|  Requirements: [Text] [+ Add]            |
|  Deadline: [Date Picker]                 |
|  Spots Available: [Number]               |
|                                          |
|  [Cancel]              [Post]            |
+------------------------------------------+
```

### Field Validation:

- **Caption:** Required, 1-2000 characters
- **Media:** At least 1 image/video required
- **Tags:** Optional, max 5 tags
- **Budget:** Required for Collaboration Calls
- **Post Button:** Disabled until caption + media are added

---

## 🔍 **Finding Your Posts**

After posting:
1. **Immediately visible** in your feed (no refresh needed)
2. **Moderation:** Posts start as "PENDING" approval
3. **Visible to others** once approved (automatic for now, admin moderation coming)
4. **Engagement:** You'll see saves, shares, applications (no public like counts)

---

## 💡 **Tips for Great Posts**

### For Users:
- ✅ Be specific about location
- ✅ Share genuine experiences
- ✅ Use relevant tags for discovery
- ❌ Don't promote businesses you don't actually visit

### For Creators:
- ✅ Show your best work
- ✅ Include process/behind-the-scenes
- ✅ Tag relevant skills and tools
- ❌ Don't oversaturate feed with every project

### For Businesses:
- ✅ High-quality visuals
- ✅ Clear collaboration requirements
- ✅ Realistic budgets for paid work
- ❌ Don't spam announcements daily

---

## 🎯 **What Makes a Good Post**

**High Discovery Potential:**
- Clear, descriptive captions
- Relevant location tags
- 3-5 specific hashtags
- High-quality media (well-lit, in-focus)

**Low Discovery Potential:**
- Generic captions ("Great place!")
- No location
- No tags or too many tags
- Poor quality media

---

## 🚀 **Coming Soon**

- **Search functionality** (search by keyword/hashtag)
- **Advanced filters** (content type, location radius, date range)
- **Admin moderation dashboard** (approve/reject posts)
- **Analytics** (see your post performance)
- **Profile integration** (tap creator name to view full profile)
- **Event integration** (join events directly from feed)

---

## ❓ **Troubleshooting**

**"I don't see the + button"**
- Make sure you're on the Feed tab
- Check you're logged in
- Try refreshing the page

**"My post isn't showing up"**
- Posts need moderation approval (may take a moment)
- Check you have both caption AND media
- Ensure you're in the right user role

**"I can't upload media"**
- Max 5 files per post
- Supported: JPG, PNG, MP4, MOV
- Max file size: Check your Firebase Storage limits

**"Collaboration Call form missing"**
- Only Business accounts see this option
- Must select "Collaboration Call" content type

---

**Need Help?** Check the app's Settings → Help & Support
