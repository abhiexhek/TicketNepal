'use client';

import { useEffect, useState } from "react";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { Header } from "@/components/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Calendar, MapPin, Users, ArrowRight, Play, TrendingUp } from "lucide-react";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const { toast } = useToast();

  // Fetch all events on initial load
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(`${API_URL}/api/events`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
          
          // Get featured events (first 3 events for demo)
          setFeaturedEvents(data.slice(0, 3));
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
    let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/events?`;
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
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container py-16 md:py-24">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-sm">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Trending Platform
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Discover Amazing
                  <span className="text-primary block">Events</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Experience the best events in Nepal. From concerts to workshops, 
                  find and book tickets for events that matter to you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="text-lg px-8 py-6">
                    <Link href="#events">
                      <Calendar className="mr-2 h-5 w-5" />
                      Browse Events
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                    <Link href="/auth/signup">
                      <Users className="mr-2 h-5 w-5" />
                      Join Now
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="relative z-10">
                  <Card className="card-elevated overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Flame className="h-16 w-16 text-primary mx-auto" />
                        <h3 className="text-xl font-semibold">Featured Events</h3>
                        <p className="text-muted-foreground">Discover what's happening</p>
                      </div>
                    </div>
                  </Card>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Events Section */}
        {featuredEvents.length > 0 && (
          <section className="container py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Featured Events</h2>
                <p className="text-muted-foreground mt-2">
                  Handpicked events you don't want to miss
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="#events">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((event: any) => (
                <Card key={event.id} className="card-interactive group">
                  <div className="relative overflow-hidden rounded-t-lg">
                    {event.imageUrl && (
                      <div className="aspect-video relative">
                        <img
                          src={event.imageUrl.startsWith('http') ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${event.imageUrl}`}
                          alt={event.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        Featured
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{event.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {event.eventStart ? new Date(event.eventStart).toLocaleDateString() : 'TBD'}
                      </div>
                      <div className="text-lg font-semibold text-primary">
                        ₨{event.price?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Events Section */}
        <section id="events" className="container py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">All Events</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse through our comprehensive collection of events. Use filters to find exactly what you're looking for.
            </p>
          </div>
          
          <EventFilters onFilterChange={handleFilterChange} />
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="card-elevated">
                  <Skeleton className="aspect-video w-full rounded-t-lg" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {events.map((event: any) => (
                <div key={event.id} className="flex">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No events available</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  We couldn't find any events matching your criteria. 
                  Try adjusting your filters or check back later for new events.
                </p>
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/admin/create-event">
                      <Flame className="mr-2 h-4 w-4" />
                      Create an Event
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <Play className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary/10 to-accent/10 border-y">
          <div className="container py-16">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                Ready to Create Your Event?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of organizers who trust TicketNepal to manage their events. 
                Start creating unforgettable experiences today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/auth/signup">
                    <Users className="mr-2 h-5 w-5" />
                    Get Started
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/admin/create-event">
                    <Flame className="mr-2 h-5 w-5" />
                    Create Event
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">TicketNepal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The premier platform for event discovery and ticket booking in Nepal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-foreground transition-colors">Events</Link></li>
                <li><Link href="/my-tickets" className="hover:text-foreground transition-colors">My Tickets</Link></li>
                <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link></li>
                <li><Link href="/auth/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Organizers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/admin/create-event" className="hover:text-foreground transition-colors">Create Event</Link></li>
                <li><Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/auth/signup" className="hover:text-foreground transition-colors">Become Organizer</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TicketNepal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
