# Fluzio Admin - Setup & Deployment Guide

## ⚠️ Important: Node.js Version

**Required**: Node.js >= 20.9.0

Current system has Node.js 18.20.8. You need to upgrade:

### Option 1: Using NVM (Recommended)
\`\`\`bash
# Install NVM if not already installed
# Then:
nvm install 20
nvm use 20
\`\`\`

### Option 2: Direct Download
Download from: https://nodejs.org/ (LTS version)

## 📦 What's Been Built

### ✅ Completed (Phase 1-2)

1. **Project Scaffold**
   - Next.js 16 with App Router
   - TypeScript configuration
   - Tailwind CSS + shadcn/ui
   - Firebase client & admin SDK setup

2. **Authentication System**
   - Login page with email/password
   - AuthContext provider with session management
   - Protected admin layout with sidebar navigation
   - Role-based UI elements

3. **Policy Engine (PBAC)**
   - Comprehensive access control (`lib/policies/access-control.ts`)
   - 30+ action types with role + scope + threshold checks
   - Helper functions for country access
   - Policy decision logic

4. **Audit Logger**
   - Immutable audit log writer (`lib/audit/logger.ts`)
   - Query functions (by entity, admin, country)
   - Server-side only writes

5. **Type System**
   - Complete TypeScript types for all collections
   - AdminRole, CountryStatus, entity types
   - Policy context and decision types

6. **Validation Schemas**
   - Zod schemas for all collections
   - Create/update schemas
   - Type-safe validation

7. **Repository Layer**
   - CRUD functions for all collections
   - Type-safe with Zod validation
   - Server-side Firestore access

8. **Security Rules**
   - Comprehensive Firestore rules
   - Role-based collection access
   - Country scope enforcement
   - Immutable audit logs

9. **Seed Script**
   - Creates 3 admin users
   - 2 countries (DE, AE)
   - Sample data (businesses, creators, missions, events, payouts)
   - Initial policies

10. **UI Components**
    - Login page
    - Admin dashboard layout with sidebar
    - Dashboard overview page
    - shadcn/ui components installed

### 🚧 Remaining Work (Phase 3-12)

Still need to implement the actual module pages:

1. **Countries Module** (Prompt 4)
   - Country list page
   - Country detail with tabs (Overview, Launch, Settings, Admins, Audit)
   - Launch checklist system
   - Phase change workflow

2. **Businesses Module** (Prompt 5)
   - Business list with filters
   - Business detail page
   - Verification workflow
   - Tier management

3. **Creators Module** (Prompt 5)
   - Creator list with filters
   - Creator detail page
   - Payout freeze/unfreeze
   - Trust score management

4. **Missions Module** (Prompt 6)
   - Mission list
   - Mission detail
   - Dispute resolution center

5. **Events Module** (Prompt 7)
   - Event list
   - Create/edit event form
   - Approval workflow

6. **Finance Module** (Prompt 8)
   - Ledger (transactions)
   - Payouts queue
   - Refunds management

7. **Moderation Module** (Prompt 9)
   - Reports queue
   - Strike system
   - Resolution workflow

8. **Governance Module** (Prompt 10)
   - Policy threshold editor
   - Feature flags management
   - Version history

9. **Analytics Module** (Prompt 11)
   - KPI dashboards
   - Launch metrics
   - Country breakdown

10. **System Module** (Prompt 11)
    - Logs viewer
    - Health checks
    - Feature flags view

11. **Server Actions**
    - Mutation handlers for all actions
    - Integration with policy engine
    - Audit log integration

12. **Shared Components**
    - DataTable with filters/pagination
    - EntityHeader component
    - TabsLayout component
    - ConfirmDialog component
    - ReasonDialog component
    - AuditTrailPanel component
    - CountryScopeSelector
    - AlertsDrawer

## 🚀 Next Steps

### 1. Upgrade Node.js to version 20+

\`\`\`bash
# Verify Node version
node --version
# Should show v20.x.x or higher
\`\`\`

### 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore and Authentication
3. Add Email/Password authentication provider
4. Create a service account:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

5. Update `.env.local` with your credentials:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
\`\`\`

### 3. Deploy Firestore Rules

\`\`\`bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
\`\`\`

### 4. Seed the Database

\`\`\`bash
npm run seed
\`\`\`

This will create:
- **super@fluzio.com** / SuperAdmin123! (SUPER_ADMIN)
- **admin.de@fluzio.com** / AdminDE123! (COUNTRY_ADMIN for DE)
- **finance@fluzio.com** / Finance123! (FINANCE)

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit: http://localhost:3000/admin/login

### 6. Implement Remaining Modules

Follow the prompts in order (Prompts 4-11 from the specification):

1. Build Countries module with launch system
2. Build Businesses + Creators modules
3. Build Missions + Disputes
4. Build Events module
5. Build Finance module
6. Build Moderation module
7. Build Governance module
8. Build Analytics + System modules

For each module:
- Create page files in `app/admin/[module]/`
- Create server actions in `app/admin/[module]/actions.ts`
- Use policy engine for access checks
- Write audit logs for mutations
- Use shared components for consistency

## 📊 Architecture Summary

\`\`\`
┌─────────────────────────────────────────────────┐
│            Browser (Client)                      │
│  ┌──────────────────────────────────────────┐  │
│  │   Next.js App Router Pages               │  │
│  │   - Login                                 │  │
│  │   - Dashboard                             │  │
│  │   - Module Pages (Countries, Business, etc)│ │
│  └──────────────────────────────────────────┘  │
│                    │                             │
│                    │ AuthContext                 │
│                    ↓                             │
│  ┌──────────────────────────────────────────┐  │
│  │   Firebase Client SDK                     │  │
│  │   - Auth (email/password)                 │  │
│  │   - Firestore (read-only via rules)       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────┐
│        Next.js Server (Server Components)        │
│  ┌──────────────────────────────────────────┐  │
│  │   Server Actions / API Routes             │  │
│  │   - Validation (Zod)                      │  │
│  │   - Policy Engine (canAccess)             │  │
│  │   - Audit Logger (writeAuditLog)          │  │
│  │   - Repository Functions                  │  │
│  └──────────────────────────────────────────┘  │
│                    │                             │
│                    ↓                             │
│  ┌──────────────────────────────────────────┐  │
│  │   Firebase Admin SDK                      │  │
│  │   - Firestore (full access)               │  │
│  │   - Auth Admin                            │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                     │
                     │ gRPC
                     ↓
┌─────────────────────────────────────────────────┐
│            Firebase (Cloud)                      │
│  ┌──────────────────────────────────────────┐  │
│  │   Firestore                               │  │
│  │   - Collections (admins, countries, etc)  │  │
│  │   - Security Rules (enforce access)       │  │
│  │   - Indexes                               │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │   Firebase Auth                           │  │
│  │   - User management                       │  │
│  │   - Email/password                        │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
\`\`\`

## 🔒 Security Model

### Layer 1: UI (Convenience)
- Hide/disable actions user can't perform
- Show only data user has access to
- Provide helpful error messages

### Layer 2: Firestore Rules (Defense)
- Enforce role-based access
- Country scope filtering
- Read-only audit logs
- Block direct client writes for sensitive operations

### Layer 3: Server Actions (Truth)
- Validate all inputs with Zod
- Check permissions with policy engine
- Write audit logs
- Perform mutations
- Return errors if not allowed

## 📝 Development Workflow

### Adding a New Action

1. **Define in Policy Engine** (`lib/policies/access-control.ts`)
   \`\`\`typescript
   export type AdminAction = 
     | 'EXISTING_ACTION'
     | 'NEW_ACTION';  // Add here
   
   // In canAccess function:
   case 'NEW_ACTION':
     if (!hasAnyRole(['SUPER_ADMIN', 'REQUIRED_ROLE'])) {
       return { allowed: false, reason: '...' };
     }
     return { allowed: true };
   \`\`\`

2. **Create Server Action** (`app/admin/[module]/actions.ts`)
   \`\`\`typescript
   'use server';
   
   import { canAccess } from '@/lib/policies/access-control';
   import { writeAuditLog } from '@/lib/audit/logger';
   
   export async function performNewAction(data: Data) {
     const admin = await getAdminById(uid);
     
     // Check permission
     const decision = canAccess(admin, 'NEW_ACTION', { entity: data });
     if (!decision.allowed) {
       throw new Error(decision.reason);
     }
     
     // Get before state
     const before = await getEntity(data.id);
     
     // Perform mutation
     await updateEntity(data.id, data);
     
     // Write audit log
     await writeAuditLog(
       admin,
       'NEW_ACTION',
       'ENTITY_TYPE',
       data.id,
       before,
       data,
       data.reason
     );
   }
   \`\`\`

3. **Call from UI**
   \`\`\`typescript
   const handleAction = async () => {
     try {
       await performNewAction(data);
       toast.success('Action completed');
     } catch (error) {
       toast.error(error.message);
     }
   };
   \`\`\`

## 🐛 Troubleshooting

### Build Fails with Node.js Version Error
- Upgrade to Node.js 20+ (see instructions above)

### Firebase Connection Error
- Check `.env.local` has correct credentials
- Ensure Firebase project has Firestore and Auth enabled
- Check network/firewall settings

### Auth Not Working
- Verify email/password provider is enabled in Firebase Console
- Check admin user exists in `admins` collection
- Verify admin status is 'ACTIVE'

### Permissions Not Working
- Check Firestore rules are deployed
- Verify admin has correct role and countryScopes
- Check policy engine logic in `lib/policies/access-control.ts`
- Review audit logs to see what's being checked

### Data Not Loading
- Check Firestore rules allow read access for your role
- Verify country scope filtering is correct
- Check browser console for errors
- Verify data exists (run seed script)

## 📧 Support

Contact the development team for assistance with:
- Module implementation
- Server action creation
- Policy engine configuration
- Deployment issues

## 🎯 Definition of Done (for remaining modules)

Before considering a module complete:

✅ **Functionality**
- [ ] Page loads without crashing
- [ ] All CRUD operations work
- [ ] Filters work correctly
- [ ] Pagination works (if applicable)

✅ **Security**
- [ ] Permission checks on all mutations
- [ ] Country scope filtering enforced
- [ ] Audit logs written for all mutations
- [ ] Firestore rules prevent unauthorized access

✅ **UX**
- [ ] Loading states shown
- [ ] Error messages displayed
- [ ] Success feedback given
- [ ] Confirmation dialogs for destructive actions
- [ ] Reason input for overrides

✅ **Code Quality**
- [ ] TypeScript types used correctly
- [ ] Zod validation on all inputs
- [ ] Server actions for mutations
- [ ] Shared components used
- [ ] Code is readable and documented
