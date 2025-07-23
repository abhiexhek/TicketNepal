'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '@/context/UserContext';
import { OrganizerDashboard } from '@/components/organizer-dashboard';
import { StaffDashboard } from '@/components/staff-dashboard';
import { AdminSuperDashboard } from '@/components/admin-super-dashboard';

export default function AdminDashboard() {
  const { currentUser } = useContext(UserContext);
  const router = useRouter();

  // Redirect if user is not allowed
  useEffect(() => {
    if (currentUser && !['Admin', 'Organizer', 'Staff'].includes(currentUser.role)) {
      router.replace('/');
    }
  }, [currentUser, router]);

  if (typeof currentUser === 'undefined' || currentUser === null) {
    // While currentUser is loading (or unauthenticated)
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  // Don't render dashboard if role is not allowed
  if (!['Admin', 'Organizer', 'Staff'].includes(currentUser.role)) {
    return null;
  }

  switch (currentUser.role) {
    case 'Admin':
      return <AdminSuperDashboard />;
    case 'Organizer':
      return <OrganizerDashboard />;
    case 'Staff':
      return <StaffDashboard />;
    default:
      return null;
  }
}
