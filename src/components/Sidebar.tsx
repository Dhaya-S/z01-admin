'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  List,
  CalendarCheck,
  Users,
  Star,
  AlertTriangle,
  BarChart2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { clearAuth, getAdminUser } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendors', label: 'Vendors', icon: Store, badgeKey: 'vendors' },
  { href: '/listings', label: 'Listings', icon: List },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/reports', label: 'Reports', icon: AlertTriangle, badgeKey: 'issues' },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

interface SidebarProps {
  pendingVendors?: number;
  unresolvedIssues?: number;
}

export default function Sidebar({ pendingVendors = 0, unresolvedIssues = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const admin = getAdminUser();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const badges: Record<string, number> = {
    vendors: pendingVendors,
    issues: unresolvedIssues,
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">Z01</div>
        <div className="sidebar-logo-sub">Admin Panel</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {navItems.map(({ href, label, icon: Icon, badgeKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const badgeCount = badgeKey ? badges[badgeKey] : 0;
          return (
            <Link key={href} href={href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} className="sidebar-link-icon" />
              <span style={{ flex: 1 }}>{label}</span>
              {badgeCount > 0 && (
                <span className="sidebar-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-admin-info">
          <div className="sidebar-admin-avatar">
            {admin?.name ? admin.name[0].toUpperCase() : 'A'}
          </div>
          <div>
            <div className="sidebar-admin-name">{admin?.name || 'Admin'}</div>
            <div className="sidebar-admin-email">{admin?.email || 'admin@z01.com'}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className="topbar">
        <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Z01 Admin</span>
      </div>

      <SidebarContent />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          style={{ display: 'block' }}
        />
      )}
    </>
  );
}
