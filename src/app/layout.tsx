'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ToastProvider } from '@/components/Toast';
import { isAuthenticated } from '@/lib/auth';
import { adminApi } from '@/lib/api';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Z01 Admin — Platform Management</title>
        <meta name="description" content="Z01 marketplace admin dashboard for managing vendors, bookings, listings and analytics." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoginPage && !isAuthenticated()) {
      router.replace('/login');
    }
    setChecked(true);
  }, [pathname, router, isLoginPage]);

  if (!checked) return null;

  if (isLoginPage) return <>{children}</>;

  if (!isAuthenticated()) return null;

  return (
    <div className="app-layout-portal">
      <Header />
      <main className="main-content-portal">
        <div className="page-content-portal">
          {children}
        </div>
      </main>
    </div>
  );
}
