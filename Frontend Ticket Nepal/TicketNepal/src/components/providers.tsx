
'use client';

import { EventProvider } from '@/context/EventContext';
import { UserProvider } from '@/context/UserContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <EventProvider>{children}</EventProvider>
    </UserProvider>
  );
}
