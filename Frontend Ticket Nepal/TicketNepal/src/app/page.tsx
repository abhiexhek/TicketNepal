'use client';

import { useEffect, useState } from "react";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { Header } from "@/components/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all events on initial load
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
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
      } catch {
        setEvents([]);
        toast({
          title: "Network Error",
          description: "Could not connect to backend.",
          variant: "destructive",
        });
      }
      setLoading(false);
    };
    fetchEvents();
  }, [toast]);

  // Handle filter changes from EventFilters component
  const handleFilterChange = async (filters: { category?: string; eventStart?: string; location?: string; search?: string }) => {
    setLoading(true);
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/events?`;
    if (filters.category) url += `category=${filters.category}&`;
    if (filters.eventStart) url += `eventStart=${filters.eventStart}&`;
    if (filters.location) url += `location=${filters.location}&`;
    if (filters.search) {
      // Only send 'name' param for event name search
      url += `name=${filters.search}&`;
    }

    try {
      const res = await fetch(url);
      if (res.ok) setEvents(await res.json());
      else setEvents([]);
    } catch {
      setEvents([]);
      toast({
        title: "Network Error",
        description: "Could not connect to backend.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="container py-8 md:py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">Discover Your Next Experience</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse, book, and enjoy events. All in one place.
            </p>
          </div>
          {/* Pass handler here! */}
          <EventFilters onFilterChange={handleFilterChange} />
          {loading ? (
            <div className="text-center py-20">
              <p>Loading events...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4">
              {events.map((event: any) => (
                <div key={event.id} className="flex">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-lg border border-dashed">
              <h2 className="text-xl font-medium">No events available yet.</h2>
              <p className="text-muted-foreground mt-2">
                Check back later, or if you're an organizer, create a new event!
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/create-event">Create an Event</Link>
              </Button>
            </div>
          )}
        </section>
      </main>
      <footer className="bg-card border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TicketNepal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
