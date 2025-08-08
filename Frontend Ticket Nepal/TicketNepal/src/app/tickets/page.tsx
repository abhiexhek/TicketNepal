'use client';

import { useContext, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { ETicket } from "@/components/e-ticket";
import { Ticket } from "lucide-react";
import { UserContext } from "@/context/UserContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User2, Home, LayoutDashboard } from "lucide-react";

export default function MyTicketsPage() {
  const { currentUser, isLoading } = useContext(UserContext);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<{ [eventId: string]: any }>({});
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser) {
        setLoading(false);
        setUserTickets([]);
        setError(null);
        return;
      }
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/api/tickets/user/${String(currentUser.id)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const tickets = await response.json();
          if (Array.isArray(tickets)) {
            setUserTickets(tickets);
            setError(null);
            // Fetch event details for each ticket
            setEventsLoading(true);
            Promise.all(
              tickets.map((ticket: any) => {
                if (!ticket.eventId) return null;
                if (events[ticket.eventId]) return null;
                return fetch(`${API_URL}/api/events/${ticket.eventId}`)
                  .then(res => res.json())
                  .then(eventData => ({ eventId: ticket.eventId, event: eventData }));
              })
            ).then(results => {
              const eventMap: { [eventId: string]: any } = {};
              (results || []).forEach((result: any) => {
                if (result && result.eventId) {
                  eventMap[result.eventId] = result.event;
                }
              });
              setEvents(prev => ({ ...prev, ...eventMap }));
              setEventsLoading(false);
            });
          } else {
            setUserTickets([]);
            setError('Failed to fetch tickets.');
          }
        } else {
          setUserTickets([]);
          setError('Failed to fetch tickets.');
        }
      } catch {
        setUserTickets([]);
        setError('Failed to fetch tickets.');
      }
      setLoading(false);
    };

    fetchTickets();
    // eslint-disable-next-line
  }, [currentUser]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!currentUser) return <div className="p-8 text-center text-red-500">Please log in to view your tickets.</div>;
  if (currentUser.role === "Organizer" || currentUser.role === "Staff") {
    const isOrganizer = currentUser.role === "Organizer";
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-auto mt-16 shadow-lg">
          <CardHeader className="flex flex-col items-center">
            <User2 className="h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-xl font-bold">
              {isOrganizer ? "Organizer Account" : "Staff Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-blue-700 font-medium">
              {isOrganizer
                ? "You are an organizer, you do not need to get tickets."
                : "You are staff, you do not need to get tickets."}
            </div>
            <div className="flex gap-4 justify-center mt-4">
              <Button asChild variant="outline">
                <Link href={isOrganizer ? "/admin" : "/admin"}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 md:py-12">
          <div className="text-center py-20">
            <p>Loading tickets...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 md:py-12">
          <div className="text-center py-20 bg-card rounded-lg border border-dashed">
            <h2 className="text-xl font-medium">Please log in</h2>
            <p className="text-muted-foreground mt-2">You need to be logged in to view your tickets.</p>
            <Button asChild className="mt-4">
              <Link href="/auth/login?redirect=/tickets">Login</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 md:py-12">
          <div className="text-center py-20 text-red-500">{error}</div>
        </main>
      </div>
    );
  }

  if (eventsLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 md:py-12">
          <div className="text-center py-20">Loading event details...</div>
        </main>
      </div>
    );
  }

  // Group tickets by groupQrCodeHint
  const grouped = userTickets.reduce((acc: any, ticket: any) => {
    const key = ticket.groupQrCodeHint || ticket.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ticket);
    return acc;
  }, {});

  // Sort groups by newest ticket (by _id or eventStart if available)
  const sortedGroups = (Object.values(grouped) as any[][]).sort((a, b) => {
    // Use the ticket _id timestamp (MongoDB ObjectId) for sorting
    const getTime = (ticket: any) => {
      if (ticket.createdAt) return new Date(ticket.createdAt).getTime();
      if (ticket.eventStart) return new Date(ticket.eventStart).getTime();
      // Fallback: use ObjectId timestamp
      return parseInt(ticket._id?.toString().substring(0, 8), 16) * 1000;
    };
    const aTime = getTime(a[0]);
    const bTime = getTime(b[0]);
    return bTime - aTime;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container px-2 py-4 md:py-12">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
            <Ticket className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold font-headline">My E-Tickets</h1>
        </div>
        {sortedGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {(sortedGroups as any[][]).map((tickets, idx) => {
              const groupKey = tickets[0]?.groupQrCodeHint || tickets[0]?.id;
              return (
                <ETicket
                  key={groupKey}
                  ticket={{ ...tickets[0], event: events[groupKey] }}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-lg border border-dashed">
            <h2 className="text-xl font-medium">No tickets yet!</h2>
            <p className="text-muted-foreground mt-2">Book an event to see your tickets here.</p>
            <Button asChild className="mt-4">
              <Link href="/">Browse Events</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
