
'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from "@/components/header";
import { UserContext } from '@/context/UserContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!currentUser || !['Admin', 'Organizer', 'Staff'].includes(currentUser.role))) {
      router.replace('/auth/login?redirect=/admin');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
         <Header />
         <main className="flex-1 container py-8 md:py-12">
          <Skeleton className="h-8 w-1/4 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
          </div>
         </main>
      </div>
    )
  }
  
  if (!currentUser || !['Admin', 'Organizer', 'Staff'].includes(currentUser.role)) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8 md:py-12">{children}</main>
    </div>
  );
}
