# Fluzio Admin - Quick Reference

## 🔑 Admin Credentials (After Seeding)

### Super Admin
- **Email**: super@fluzio.com
- **Password**: SuperAdmin123!
- **Role**: SUPER_ADMIN
- **Access**: GLOBAL (all countries)
- **Can do**: Everything, including overrides

### Country Admin (Germany)
- **Email**: admin.de@fluzio.com
- **Password**: AdminDE123!
- **Role**: COUNTRY_ADMIN
- **Access**: DE only
- **Can do**: Manage businesses, creators, events in Germany

### Finance Admin
- **Email**: finance@fluzio.com
- **Password**: Finance123!
- **Role**: FINANCE
- **Access**: GLOBAL
- **Can do**: Approve payouts, view transactions, issue refunds

## 🌍 Sample Countries (After Seeding)

### Germany (DE)
- **Status**: SOFT_LAUNCH
- **Currency**: EUR
- **Features Enabled**:
  - ✅ Public Signup
  - ✅ Missions
  - ❌ Events
  - ❌ Payout Automation
  - ❌ Marketing Tools
- **Readiness**: 75%
- **Admin**: admin.de@fluzio.com

### United Arab Emirates (AE)
- **Status**: PLANNED
- **Currency**: AED
- **Features Enabled**: None (all disabled)
- **Readiness**: 30%
- **Admin**: None assigned

## 📊 Sample Data (After Seeding)

### Businesses (2)
- Berlin Coffee House (GOLD tier, verified)
- Munich Fashion Boutique (PLATINUM tier, verified)

### Creators (3)
- Anna Schmidt (verified, trust score: 85)
- Max Mueller (verified, trust score: 92)
- Sarah Weber (not verified, trust score: 45, payout frozen)

### Missions (3)
- 1 COMPLETED
- 1 LIVE
- 1 DISPUTED

### Events (2)
- Berlin Creator Meetup (PUBLISHED)
- Fashion Brand Launch Party (DRAFT, high budget)

### Payouts (3)
- 1 PAID
- 1 PENDING
- 1 HELD

## 🔐 Permission Matrix

| Action | SUPER_ADMIN | COUNTRY_ADMIN | FINANCE | MODERATOR | OPS_SUPPORT | ANALYST |
|--------|-------------|---------------|---------|-----------|-------------|---------|
| Change country phase | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit country settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign country admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Verify business | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Suspend business | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Verify creator | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Freeze payout | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve payout | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve event | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Resolve dispute | ✅ | ✅* | ❌ | ❌ | ✅* | ❌ |
| Add strikes | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit policies | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

*With threshold limits (requires SUPER_ADMIN if exceeds threshold)

## 🎯 Policy Thresholds (Default)

- **Event Approval Limit**: €20,000
  - Events with budget > €20,000 require SUPER_ADMIN approval
  
- **Payout Release Trust Min**: 70
  - Creators with trust score < 70 require SUPER_ADMIN approval for payouts
  
- **High Risk Score**: 80
  - Entities with risk score > 80 flagged for review

- **Dispute Refund Limit**: 50%
  - Refunds > 50% require SUPER_ADMIN approval

- **New Creator Hold Days**: 14 days (DE), 21 days (AE)
  - Payouts held for new creators

- **Strike Limit**: 3 (both countries)
  - Auto-suspend after 3 strikes

- **Auto-Suspend Dispute Rate**: 20% (DE), 15% (AE)
  - Auto-suspend if dispute rate exceeds threshold

## 📱 Quick Actions by Role

### SUPER_ADMIN Can:
- Change country launch phases
- Assign/remove country admins
- Override any threshold
- Edit governance policies
- View all audit logs
- Access all countries

### COUNTRY_ADMIN Can:
- Manage businesses in their countries
- Verify/suspend entities in their countries
- Approve normal-budget events
- Resolve small disputes
- Add internal notes

### FINANCE Can:
- Approve/hold/release payouts
- View transaction ledger
- Issue refunds
- View financial reports
- Freeze creator payouts

### MODERATOR Can:
- Review moderation reports
- Add strikes to entities
- Suspend flagged content
- Resolve moderation issues

### OPS_SUPPORT Can:
- Resolve customer disputes
- Cancel missions/events
- Add internal notes
- View support tickets

### ANALYST_READONLY Can:
- View all analytics
- View dashboards
- View KPIs
- Export reports (limited)

## 🚨 Common Errors & Solutions

### "Not authorized"
- Check admin role has permission for action
- Verify country scope includes entity's country
- Check if threshold requires higher role

### "Country not found"
- Ensure admin has access to that country
- Verify countryScopes includes country or GLOBAL

### "Trust score too low"
- Creator needs SUPER_ADMIN approval for payout
- Can increase trust score or override with reason

### "Budget exceeds limit"
- Event requires SUPER_ADMIN approval
- Can reduce budget or escalate to super admin

### "Audit log not found"
- Only SUPER_ADMIN can view audit logs
- Check permissions

## 🔗 Important URLs

### Local Development
- **Login**: http://localhost:3000/admin/login
- **Dashboard**: http://localhost:3000/admin
- **Countries**: http://localhost:3000/admin/countries

### Firebase Console
- **Project**: https://console.firebase.google.com/project/YOUR_PROJECT
- **Firestore**: https://console.firebase.google.com/project/YOUR_PROJECT/firestore
- **Auth**: https://console.firebase.google.com/project/YOUR_PROJECT/authentication

## 📞 Support Contacts

### Technical Issues
- Check SETUP.md for troubleshooting
- Review PROJECT_SUMMARY.md for architecture
- See IMPLEMENTATION_GUIDE.md for code examples

### Security Questions
- All mutations go through server actions
- Policy engine enforces permissions
- Audit logs track all changes
- Firestore rules provide defense layer

## 🎓 Learning Path

1. **Start Here**: Read PROJECT_SUMMARY.md
2. **Setup**: Follow SETUP.md to configure Firebase
3. **Run Seed**: `npm run seed` to create sample data
4. **Login**: Use super@fluzio.com / SuperAdmin123!
5. **Explore**: Navigate through dashboard, check permissions
6. **Build**: Follow IMPLEMENTATION_GUIDE.md to add modules
7. **Test**: Try actions with different admin roles
8. **Deploy**: Build and deploy to production

## ⚡ Quick Commands

\`\`\`bash
# Install dependencies
npm install

# Run seed (creates admins + sample data)
npm run seed

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy to Firebase Hosting
firebase deploy --only hosting
\`\`\`

## 🎯 Next 3 Tasks

1. **Upgrade Node.js to 20+** (required to run)
2. **Configure Firebase** (add real credentials to .env.local)
3. **Run seed script** (npm run seed)

After that, you can login and start building modules!
