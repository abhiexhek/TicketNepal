'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { Event } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EventContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  refreshEvents: () => Promise<void>;
}

export const EventContext = createContext<EventContextType>({
  events: [],
  setEvents: () => {},
  refreshEvents: async () => {},
});

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const { toast } = useToast();

  // Fetch events from backend API
  const refreshEvents = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        setEvents([]);
        toast({
          title: "Error",
          description: "Failed to load events.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setEvents([]);
      toast({
        title: "Network Error",
        description: "Could not connect to backend.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const value = { events, setEvents, refreshEvents };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
