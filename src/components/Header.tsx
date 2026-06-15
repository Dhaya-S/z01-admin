'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, LogOut, LayoutDashboard, Store, List, CalendarCheck, Users, Star, AlertTriangle, BarChart2
} from 'lucide-react';
import { clearAuth, getAdminUser } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Portal Home', icon: LayoutGrid },
  { href: '/dashboard/charts', label: 'Charts Dashboard', icon: LayoutDashboard },
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/listings', label: 'Listings', icon: List },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/reports', label: 'Reports', icon: AlertTriangle },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = getAdminUser();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const welcomeName = admin?.name || 'Alex Morgan';
  const roleName = admin?.role === 'admin' ? 'Super Admin' : (admin?.role || 'Super Admin');

  return (
    <header className="portal-header-wrapper">
      {/* Top Header */}
      <div className="portal-top-bar">
        {/* Left Logo Section */}
        <Link href="/dashboard" className="portal-logo-section">
          <div className="portal-logo-icon-container">
            <LayoutGrid size={18} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div className="portal-logo-text-wrapper">
            <span className="portal-logo-title">Z01 Portal</span>
            <span className="portal-logo-subtitle">Admin Dashboard</span>
          </div>
        </Link>

        {/* Right User & Actions */}
        <div className="portal-top-bar-right">
          <div className="portal-user-profile-info">
            <span className="portal-user-name">{welcomeName}</span>
            <span className="portal-user-role-badge">{roleName}</span>
          </div>
          
          <button className="portal-btn-logout" onClick={handleLogout}>
            <LogOut size={15} />
            <div className="portal-logout-text-wrapper">
              <span className="portal-logout-label">Logout</span>
              <span className="portal-logout-subtext">$0k</span>
            </div>
          </button>
        </div>
      </div>

      {/* Horizontal Navigation Menu */}
      <nav className="portal-horizontal-nav">
        <div className="portal-nav-links-container">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`portal-nav-link-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} className="portal-nav-link-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
