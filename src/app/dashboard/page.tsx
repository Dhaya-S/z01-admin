'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Users, CreditCard, RotateCcw, MessageSquare, ShieldCheck, FileText, Activity, BarChart2
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { getAdminUser } from '@/lib/auth';

export default function DashboardPortalPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [disputesCount, setDisputesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const admin = getAdminUser();

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getIssues({ limit: 1 })
    ])
      .then(([statsRes, issuesRes]) => {
        setStats(statsRes.data);
        setDisputesCount(issuesRes.data?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCompressedRevenue = (val: number | undefined | null) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr+`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L+`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K+`;
    return `₹${val}`;
  };

  const modules = [
    {
      id: 'inventory',
      title: 'Inventory Management',
      description: 'Manage products, stock levels, and catalog',
      icon: Package,
      colorClass: 'icon-bg-blue',
      href: '/listings',
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      colorClass: 'icon-bg-purple',
      href: '/users',
    },
    {
      id: 'payouts',
      title: 'Payouts',
      description: 'Process and manage seller payouts',
      icon: CreditCard,
      colorClass: 'icon-bg-green',
      href: '/bookings',
    },
    {
      id: 'refunds',
      title: 'Refunds',
      description: 'Handle refund requests and processing',
      icon: RotateCcw,
      colorClass: 'icon-bg-orange',
      href: '/bookings',
    },
    {
      id: 'disputes',
      title: 'Disputes',
      description: 'Manage customer disputes and resolutions',
      icon: MessageSquare,
      colorClass: 'icon-bg-red',
      href: '/reports',
    },
    {
      id: 'kyc',
      title: 'KYC Verification',
      description: 'Review and verify seller identity documents',
      icon: ShieldCheck,
      colorClass: 'icon-bg-teal',
      href: '/vendors?status=submitted',
    },
    {
      id: 'documents',
      title: 'Document Verification',
      description: 'Verify business documents and licenses',
      icon: FileText,
      colorClass: 'icon-bg-indigo',
      href: '/vendors',
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'View system audit trail and activity logs',
      icon: Activity,
      colorClass: 'icon-bg-slate',
      href: '/analytics',
    },
  ];

  const welcomeName = admin?.name || 'Alex Morgan';
  const roleName = admin?.role === 'admin' ? 'Super Admin' : (admin?.role || 'Super Admin');

  return (
    <div className="portal-container">
      {/* Welcome Banner */}
      <div className="portal-welcome-section">
        <h1 className="portal-welcome-title">Welcome back, {welcomeName}</h1>
        <p className="portal-welcome-subtitle">
          You are logged in as <strong className="portal-role-highlight">{roleName}</strong>. Select a module to continue.
        </p>
      </div>

      {/* Featured Card: High-Signal Dashboard */}
      <div 
        className="portal-featured-card" 
        onClick={() => router.push('/dashboard/charts')}
      >
        <div className="portal-featured-header">
          <div className="portal-featured-header-left">
            <div className="portal-featured-icon-wrapper">
              <BarChart2 className="portal-featured-icon" size={24} />
            </div>
            <div>
              <h2 className="portal-featured-title">High-Signal Dashboard</h2>
              <p className="portal-featured-subtitle">View comprehensive KPIs, analytics, and drill-down into key metrics</p>
            </div>
          </div>
          <span className="portal-featured-badge">Featured</span>
        </div>

        {/* 5 Stats Inside Featured Card */}
        <div className="portal-featured-stats-grid">
          <div className="portal-featured-stat-card">
            <div className="portal-featured-stat-label">Revenue</div>
            <div className="portal-featured-stat-value">{formatCompressedRevenue(stats?.totalRevenue)}</div>
          </div>
          <div className="portal-featured-stat-card">
            <div className="portal-featured-stat-label">Vendors</div>
            <div className="portal-featured-stat-value">{loading ? '—' : (stats?.totalVendors ?? 0)}</div>
          </div>
          <div className="portal-featured-stat-card">
            <div className="portal-featured-stat-label">Freelancers</div>
            <div className="portal-featured-stat-value">{loading ? '—' : (stats?.totalUsers ?? 0)}</div>
          </div>
          <div className="portal-featured-stat-card">
            <div className="portal-featured-stat-label">Orders</div>
            <div className="portal-featured-stat-value">{loading ? '—' : (stats?.totalBookings ?? 0)}</div>
          </div>
          <div className="portal-featured-stat-card">
            <div className="portal-featured-stat-label">Disputes</div>
            <div className="portal-featured-stat-value">{loading ? '—' : disputesCount}</div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="portal-modules-section">
        <h3 className="portal-modules-title">
          Your Modules <span className="portal-modules-badge">{modules.length}</span>
        </h3>

        <div className="portal-modules-grid">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div 
                key={m.id} 
                className="portal-module-card"
                onClick={() => router.push(m.href)}
              >
                <div className="portal-module-header">
                  <div className={`portal-module-icon-box ${m.colorClass}`}>
                    <Icon size={20} color="#ffffff" />
                  </div>
                  <span className="portal-module-accessible-badge">Accessible</span>
                </div>
                <h4 className="portal-module-card-title">{m.title}</h4>
                <p className="portal-module-card-description">{m.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
