# Quick Implementation Guide - Building Admin Modules

## 🎯 Pattern for Each Module

Every module follows this structure:

\`\`\`
app/admin/[module]/
├── page.tsx              # List view with filters
├── [id]/
│   └── page.tsx          # Detail view with tabs
├── new/
│   └── page.tsx          # Create form (if applicable)
└── actions.ts            # Server actions for mutations
\`\`\`

## 📋 Checklist for Each Module

### 1. List Page (`page.tsx`)

\`\`\`typescript
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// ... more imports

export default function ModulePage() {
  const { admin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    country: 'all',
    status: 'all',
  });

  useEffect(() => {
    loadItems();
  }, [filters, admin]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/module/list', {
        method: 'POST',
        body: JSON.stringify({ filters }),
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Module Name</h1>
        <Button onClick={() => router.push('/admin/module/new')}>
          Create New
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            {/* More filters */}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Badge>{item.status}</Badge>
                </TableCell>
                <TableCell>{item.countryId}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(\`/admin/module/\${item.id}\`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
\`\`\`

### 2. Detail Page (`[id]/page.tsx`)

\`\`\`typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DetailPage() {
  const params = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [params.id]);

  const loadItem = async () => {
    // Fetch item data
  };

  const handleAction = async (action: string) => {
    // Call server action
  };

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Not found</div>;

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <Badge className="mt-2">{item.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="destructive">Suspend</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Stats, summary */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          {/* Detail content */}
        </TabsContent>

        <TabsContent value="audit">
          {/* Audit trail */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
\`\`\`

### 3. Server Actions (`actions.ts`)

\`\`\`typescript
'use server';

import { canAccess } from '@/lib/policies/access-control';
import { writeAuditLog } from '@/lib/audit/logger';
import { getAdminById } from '@/lib/repositories';
import { getBusinessById, updateBusiness } from '@/lib/repositories';
import { auth } from '@/lib/firebase/admin';

export async function verifyBusiness(businessId: string, reason: string) {
  // 1. Get current admin
  const currentUser = await auth().currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  
  const admin = await getAdminById(currentUser.uid);
  if (!admin) throw new Error('Not an admin');

  // 2. Get entity
  const business = await getBusinessById(businessId);
  if (!business) throw new Error('Business not found');

  // 3. Check permission
  const decision = canAccess(admin, 'VERIFY_BUSINESS', { entity: business });
  if (!decision.allowed) {
    throw new Error(decision.reason);
  }

  // 4. Perform mutation
  const before = { ...business };
  await updateBusiness(businessId, {
    verified: true,
    updatedAt: new Date(),
  });
  const after = { ...business, verified: true };

  // 5. Write audit log
  await writeAuditLog(
    admin,
    'VERIFY_BUSINESS',
    'BUSINESS',
    businessId,
    before,
    after,
    reason
  );

  return { success: true };
}

export async function suspendBusiness(businessId: string, reason: string) {
  // Same pattern:
  // 1. Get admin
  // 2. Get entity
  // 3. Check permission
  // 4. Perform mutation
  // 5. Write audit log
}
\`\`\`

### 4. API Route (Alternative to Server Actions)

\`\`\`typescript
// app/api/businesses/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyBusiness } from '@/app/admin/businesses/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { reason } = await request.json();
    await verifyBusiness(params.id, reason);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
\`\`\`

## 🔧 Common Components to Create

### ConfirmDialog Component

\`\`\`typescript
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
\`\`\`

### ReasonDialog Component

\`\`\`typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (reason: string) => void;
  required?: boolean;
}

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  required = true,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (required && !reason.trim()) {
      alert('Reason is required');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">
              Reason {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this action..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
\`\`\`

### AuditTrail Component

\`\`\`typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface AuditTrailProps {
  entityType: string;
  entityId: string;
}

export function AuditTrail({ entityType, entityId }: AuditTrailProps) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [entityType, entityId]);

  const loadLogs = async () => {
    // Fetch audit logs from API
    const response = await fetch(\`/api/audit/\${entityType}/\${entityId}\`);
    const data = await response.json();
    setLogs(data);
    setLoading(false);
  };

  if (loading) return <div>Loading audit trail...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border-l-2 border-gray-300 pl-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>{log.action}</Badge>
                  <span className="text-sm text-gray-600">{log.actorEmail}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(log.createdAt)} ago
                </span>
              </div>
              {log.reason && (
                <p className="text-sm text-gray-700 mt-1">{log.reason}</p>
              )}
              {log.before && log.after && (
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer">
                    View changes
                  </summary>
                  <div className="mt-2 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Before:</strong>
                        <pre className="bg-gray-100 p-2 rounded mt-1">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <strong>After:</strong>
                        <pre className="bg-gray-100 p-2 rounded mt-1">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
\`\`\`

## 🎯 Quick Start for Each Module

### Countries Module

1. Create `app/admin/countries/page.tsx` - list with phase badges
2. Create `app/admin/countries/[countryId]/page.tsx` - tabs (Overview, Launch, Settings, Admins, Audit)
3. Create `app/admin/countries/actions.ts` - updateCountryPhase, updateCountrySettings
4. Add launch checklist component
5. Add phase change workflow with reason dialog

### Businesses Module

1. Create `app/admin/businesses/page.tsx` - list with filters (tier, verified, risk score)
2. Create `app/admin/businesses/[id]/page.tsx` - tabs (Profile, Missions, Finance, Audit)
3. Create `app/admin/businesses/actions.ts` - verifyBusiness, suspendBusiness, adjustTier
4. Add action buttons with confirm dialogs

### (Repeat for each module...)

## 💡 Tips

- **Start with the simplest module first** (e.g., Analytics with read-only views)
- **Reuse components** - Create DataTable, EntityHeader, etc., and use everywhere
- **Test permissions** - Try actions with different admin roles
- **Check audit logs** - Verify every mutation creates a log
- **Handle errors** - Show helpful messages to users
- **Add loading states** - Use Suspense or loading flags

## ⚡ Shortcuts

Instead of building 10 separate modules, you could:

1. **Start with 3 core modules**: Countries, Businesses, Creators
2. **Build shared components** while implementing those 3
3. **Copy/paste and adapt** for remaining modules

The pattern is the same for all modules. Once you have 1-2 working, the rest are fast!
