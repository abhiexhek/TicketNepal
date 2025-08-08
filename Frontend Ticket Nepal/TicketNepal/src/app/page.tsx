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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Calendar, MapPin, Users, ArrowRight, Play, TrendingUp, Search, Filter, Clock, Star, Zap } from "lucide-react";

interface Event {
  id: string;
  name: string;
  category: string;
  eventStart: string;
  eventEnd: string;
  location: string;
  city: string;
  description: string;
  organizer: string | { name: string };
  imageUrl: string;
  price: number;
  seats?: string[];
  ticketsSold?: number;
  income?: number;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
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
          
          // Filter out expired events and add ticket sales data
          const validEvents = await Promise.all(
            data.map(async (event: Event) => {
              // Check if event is expired
              const now = new Date();
              const eventEnd = event.eventEnd ? new Date(event.eventEnd) : null;
              const isExpired = eventEnd && now > eventEnd;
              
              if (isExpired) return null;
              
              // Fetch ticket sales for this event
              try {
                const ticketsResponse = await fetch(`${API_URL}/api/tickets/reserved?eventId=${event.id}`);
                if (ticketsResponse.ok) {
                  const ticketsData = await ticketsResponse.json();
                  event.ticketsSold = ticketsData.reservedSeats?.length || 0;
                }
              } catch (error) {
                event.ticketsSold = 0;
              }
              
              return event;
            })
          );
          
          const validEventsFiltered = validEvents.filter(Boolean);
          setEvents(validEventsFiltered);
          
          // Get featured events (newest 3 events)
          const sortedByDate = [...validEventsFiltered].sort((a, b) => 
            new Date(b.eventStart).getTime() - new Date(a.eventStart).getTime()
          );
          setFeaturedEvents(sortedByDate.slice(0, 3));
          setFilteredEvents(sortedByDate);
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

  // Filter and sort events
  useEffect(() => {
    let filtered = [...events];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.eventStart).getTime() - new Date(a.eventStart).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0));
        break;
    }
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, categoryFilter, sortBy]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(events.map(event => event.category)))];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          <div className="container relative py-20 md:py-32">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Zap className="mr-1 h-3 w-3" />
                    #1 Event Platform in Nepal
                  </Badge>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                  Discover
                  <span className="block text-yellow-300">Amazing Events</span>
                </h1>
                <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                  Experience the best events in Nepal. From concerts to workshops, 
                  find and book tickets for events that matter to you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="text-lg px-8 py-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    <Link href="#events">
                      <Calendar className="mr-2 h-5 w-5" />
                      Explore Events
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10">
                    <Link href="/auth/signup">
                      <Users className="mr-2 h-5 w-5" />
                      Join Now
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="relative z-10">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <div className="relative">
                          <Flame className="h-20 w-20 text-yellow-300 mx-auto" />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">HOT</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">Featured Events</h3>
                          <p className="text-blue-100">Discover what's happening</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-purple-400/30 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Events Section */}
        {featuredEvents.length > 0 && (
          <section className="container py-20">
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-4xl font-bold tracking-tight">Featured Events</h2>
                </div>
                <p className="text-xl text-muted-foreground">
                  Handpicked events you don't want to miss
                </p>
              </div>
              <Button asChild variant="outline" size="lg">
                <Link href="#events">
                  View All Events
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((event: Event) => (
                <Card key={event.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative overflow-hidden">
                    {event.imageUrl && (
                      <div className="aspect-video relative">
                        <img
                          src={event.imageUrl.startsWith('http') ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${event.imageUrl}`}
                          alt={event.name}
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge className="bg-yellow-500 text-black font-semibold">
                        <Star className="mr-1 h-3 w-3" />
                        Featured
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{event.name}</h3>
                      <div className="flex items-center gap-4 text-white/90 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.ticketsSold || 0} sold
                        </span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-muted-foreground">
                        {event.eventStart ? new Date(event.eventStart).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        }) : 'TBD'}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ₨{event.price?.toFixed(0) || '0'}
                      </div>
                    </div>
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/events/${event.id}`}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Events Section */}
        <section id="events" className="container py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-6">All Events</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Browse through our comprehensive collection of events. Use filters to find exactly what you're looking for.
            </p>
          </div>
          
          {/* Advanced Filters */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 mb-12">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>{filteredEvents.length} events found</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event: Event) => (
                <div key={event.id} className="flex">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Calendar className="h-20 w-20 text-muted-foreground mb-6" />
                <h3 className="text-2xl font-semibold mb-4">No events found</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
                  We couldn't find any events matching your criteria. 
                  Try adjusting your filters or check back later for new events.
                </p>
                <div className="flex gap-4">
                  <Button asChild size="lg">
                    <Link href="/admin/create-event">
                      <Flame className="mr-2 h-5 w-5" />
                      Create an Event
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
                    <Play className="mr-2 h-5 w-5" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container py-20">
            <div className="text-center space-y-8">
              <h2 className="text-4xl font-bold tracking-tight">
                Ready to Create Your Event?
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Join thousands of organizers who trust TicketNepal to manage their events. 
                Start creating unforgettable experiences today.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button asChild size="lg" className="text-lg px-10 py-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                  <Link href="/auth/signup">
                    <Users className="mr-2 h-6 w-6" />
                    Get Started
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-10 py-6 border-white/30 text-white hover:bg-white/10">
                  <Link href="/admin/create-event">
                    <Flame className="mr-2 h-6 w-6" />
                    Create Event
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="container py-16">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold">TicketNepal</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                The premier platform for event discovery and ticket booking in Nepal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Platform</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link href="/" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="/my-tickets" className="hover:text-white transition-colors">My Tickets</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Organizers</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link href="/admin/create-event" className="hover:text-white transition-colors">Create Event</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Become Organizer</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            &copy; {new Date().getFullYear()} TicketNepal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
