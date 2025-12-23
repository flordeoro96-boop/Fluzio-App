'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Briefcase,
  UserCircle,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { AdminRole } from '@/lib/types';

export default function AdminDashboard() {
  const { admin } = useAuth();

  if (!admin) return null;

  // Mock stats (will be replaced with real data)
  const stats = [
    {
      title: 'Total Users',
      value: '12,543',
      change: '+12.5%',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Active Businesses',
      value: '1,234',
      change: '+8.2%',
      icon: Briefcase,
      href: '/admin/businesses',
    },
    {
      title: 'Verified Creators',
      value: '892',
      change: '+15.3%',
      icon: UserCircle,
      href: '/admin/creators',
    },
    {
      title: 'Active Missions',
      value: '456',
      change: '-2.1%',
      icon: Target,
      href: '/admin/missions',
    },
    {
      title: 'Upcoming Events',
      value: '67',
      change: '+25.4%',
      icon: Calendar,
      href: '/admin/events',
    },
    {
      title: 'Pending Payouts',
      value: '€45,230',
      change: '+5.7%',
      icon: DollarSign,
      href: '/admin/finance',
    },
  ];

  const alerts = [
    {
      type: 'urgent',
      message: '8 payouts held for review',
      href: '/admin/finance?tab=payouts&filter=held',
    },
    {
      type: 'warning',
      message: '12 unresolved disputes',
      href: '/admin/missions?filter=disputed',
    },
    {
      type: 'info',
      message: '3 countries pending launch approval',
      href: '/admin/countries?filter=pre-launch',
    },
  ];

  return (
    <div className="min-h-screen" style={{ padding: '2rem', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(to right, #2563eb, #4f46e5)',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        color: 'white',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)' }}>
          Welcome back, {admin.email} • <span style={{ 
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}>{admin.role.replace('_', ' ')}</span>
        </p>
        {admin.countryScopes.includes('GLOBAL') ? (
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
            🌍 Viewing: All countries (Global access)
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            Viewing: {admin.countryScopes.join(', ')}
          </p>
        )}
      </div>

      {/* Alerts */}
      {admin.role !== AdminRole.ANALYST_READONLY && alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-amber-900">Action Required</h3>
              <ul className="space-y-1">
                {alerts.map((alert, index) => (
                  <li key={index}>
                    <Link
                      href={alert.href}
                      className="text-sm text-amber-800 hover:text-amber-900 underline"
                    >
                      {alert.message}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer border-gray-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="flex items-center">
                  <TrendingUp
                    className={`w-4 h-4 mr-1 ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1.5">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      {[AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN].includes(admin.role) && (
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto py-4 justify-start hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
                <Link href="/admin/events/new">
                  <Calendar className="w-5 h-5 mr-3" />
                  <span className="font-semibold">Create Event</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 justify-start hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors">
                <Link href="/admin/businesses?filter=pending-verification">
                  <Briefcase className="w-5 h-5 mr-3" />
                  <span className="font-semibold">Review Businesses</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 justify-start hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors">
                <Link href="/admin/creators?filter=pending-verification">
                  <UserCircle className="w-5 h-5 mr-3" />
                  <span className="font-semibold">Verify Creators</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 justify-start hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors">
                <Link href="/admin/finance?tab=payouts">
                  <DollarSign className="w-5 h-5 mr-3" />
                  <span className="font-semibold">Process Payouts</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Activity feed coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
