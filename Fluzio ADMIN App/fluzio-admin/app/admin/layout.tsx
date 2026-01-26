'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Globe,
  Users,
  Briefcase,
  UserCircle,
  Target,
  Calendar,
  Gift,
  Shield,
  Flag,
  BarChart3,
  Cog,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { AdminRole } from '@/lib/types';
import NotificationBell from '@/components/NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Approvals', href: '/admin/approvals', icon: CheckCircle, badge: true },
  { name: 'Countries', href: '/admin/countries', icon: Globe },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Businesses', href: '/admin/businesses', icon: Briefcase },
  { name: 'Creators', href: '/admin/creators', icon: UserCircle },
  { name: 'Missions', href: '/admin/missions', icon: Target },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Rewards', href: '/admin/rewards', icon: Gift },
  { name: 'Finance', href: '/admin/finance', icon: BarChart3 },
  { name: 'Moderation', href: '/admin/moderation', icon: Flag },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Governance', href: '/admin/governance', icon: Shield },
  { name: 'System', href: '/admin/system', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, admin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [user, loading, router, pathname]);

  // Allow login page to bypass layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !admin) {
    return null;
  }

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case AdminRole.COUNTRY_ADMIN:
        return 'bg-blue-100 text-blue-800';
      case AdminRole.FINANCE:
        return 'bg-green-100 text-green-800';
      case AdminRole.MODERATOR:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = () => {
    const scopeDisplay = admin.countryScopes.includes('GLOBAL')
      ? 'Global'
      : admin.countryScopes.join(', ');
    return `${admin.role.replace('_', ' ')} • ${scopeDisplay}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white block">Fluzio</span>
                <span className="text-xs text-slate-400">Admin Portal</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 font-semibold'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'animate-pulse' : ''
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Info */}
          <div className="p-4 border-t border-slate-700">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-slate-700">
                  <span className="text-white font-bold text-lg">
                    {admin.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{admin.email}</p>
                  <div className="mt-1">
                    <Badge className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                      {admin.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Search */}
              <div className="hidden md:flex items-center max-w-lg w-full">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search users, businesses, events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-2.5 bg-gray-50 border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Role & Scope Badge */}
              <Badge variant="outline" className="hidden sm:flex bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 font-semibold px-3 py-1.5">
                {getRoleDisplay()}
              </Badge>

              {/* Notifications */}
              <NotificationBell />

              <Separator orientation="vertical" className="h-8 bg-gray-300" />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Cog className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
