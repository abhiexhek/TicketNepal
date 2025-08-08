"use client";

import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ETicket } from "@/components/e-ticket";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import Link from "next/link";
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Add helper to fix event image URLs
const getEventImageUrl = (imageUrl: string) => {
  if (!imageUrl) return "";
  return imageUrl.startsWith("http")
    ? imageUrl
    : `${API_URL}${imageUrl}`;
};

export default function MyTicketsPage() {
  const { currentUser, isLoading } = useContext(UserContext);
  const [tickets, setTickets] = useState<any[]>([]);
  const [events, setEvents] = useState<{ [eventId: string]: any }>({});
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && currentUser) {
      fetch(`${API_URL}/api/tickets/user/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTickets(data);
            (data || []).forEach((ticket: any) => {
              if (!events[ticket.eventId]) {
                fetch(`${API_URL}/api/events/${ticket.eventId}`)
                  .then(res => res.json())
                  .then(eventData => setEvents(prev => ({ ...prev, [ticket.eventId]: eventData })));
              }
            });
            setError(null);
          } else {
            setTickets([]);
            setError('Failed to fetch tickets.');
          }
        })
        .catch(() => {
          setTickets([]);
          setError('Failed to fetch tickets.');
        });
    }
  }, [currentUser, isLoading]);

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-10">
        <Card>
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="h-40 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/5" />
                  <div className="h-4 bg-muted rounded w-2/5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
  if (!currentUser) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-10">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-muted-foreground">Please log in to view your tickets.</div>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/auth/login?redirect=/my-tickets">Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
  if (currentUser && (currentUser.role === "Organizer" || currentUser.role === "Staff")) {
    const isOrganizer = currentUser.role === "Organizer";
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-10">
          <Card className="max-w-xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">{isOrganizer ? "Organizer Account" : "Staff Account"}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-muted-foreground">
                {isOrganizer
                  ? "You are an organizer, you do not need tickets to access events."
                  : "You are staff, you do not need tickets to access events."}
              </div>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/admin">Open Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  if (error) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-10">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">My Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-destructive">{error}</CardContent>
        </Card>
      </main>
    </div>
  );
  if (!tickets.length) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-10">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">My Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-muted-foreground">You have not purchased any tickets yet.</div>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/profile">Go to Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // Sort tickets by newest first (ObjectId timestamp fallback)
  const sortedTickets = [...tickets].sort((a, b) => {
    const aTime = parseInt(a.id?.toString().substring(0, 8), 16) * 1000;
    const bTime = parseInt(b.id?.toString().substring(0, 8), 16) * 1000;
    return bTime - aTime;
  });

  // Group tickets by transactionId
  const transactions: { [transactionId: string]: any[] } = {};
  for (const ticket of sortedTickets) {
    if (!ticket.transactionId) continue;
    if (!transactions[ticket.transactionId]) transactions[ticket.transactionId] = [];
    transactions[ticket.transactionId].push(ticket);
  }
  const transactionList = Object.values(transactions);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-6 sm:py-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Tickets</h1>
          <div className="text-sm text-muted-foreground">Total purchases: {transactionList.length}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {transactionList.map((ticketsInTransaction) => {
            const ticket = ticketsInTransaction[0];
            const event = events[ticket.eventId] || { name: 'Event unavailable', imageUrl: '', category: '', eventStart: '', location: '' };
            const qrCodeUrl = `${API_URL}/api/tickets/qr/transaction/${ticket.transactionId}`;
            const eventDateStr = event.eventStart ? new Date(event.eventStart).toLocaleString() : '';
            return (
              <Card key={ticket.transactionId} className="overflow-hidden">
                <CardHeader className="p-0">
                  <div className="relative w-full h-40">
                    {getEventImageUrl(event.imageUrl)
                      ? <img src={getEventImageUrl(event.imageUrl)} alt={event.name} className="w-full h-40 object-cover" />
                      : <div className="w-full h-40 flex items-center justify-center bg-muted text-muted-foreground">No image</div>
                    }
                  </div>
                  <div className="p-4">
                    <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">{event.category}{event.location ? ` • ${event.location}` : ''}</div>
                    {eventDateStr && (
                      <div className="text-xs text-muted-foreground mt-1">{eventDateStr}</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col items-center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-32 h-32 rounded-lg border cursor-pointer"
                      onClick={() => setQrOpen(ticket.transactionId)}
                    />
                    <Button variant="outline" size="sm" className="mt-2" onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const response = await fetch(qrCodeUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `tickets-qr-${ticket.transactionId}.png`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (e) {
                        alert('Failed to download QR code.');
                      }
                    }}>
                      <Download className="w-4 h-4 mr-2" /> Download QR Code
                    </Button>
                  </div>
                  <Dialog open={qrOpen === ticket.transactionId} onOpenChange={(open) => setQrOpen(open ? ticket.transactionId : null)}>
                    <DialogContent className="flex flex-col items-center justify-center">
                      <DialogTitle>Group QR Code</DialogTitle>
                      <img src={qrCodeUrl} alt="QR Code Fullscreen" className="object-contain rounded-lg w-80 h-80" />
                      <div className="mt-2 text-center text-muted-foreground text-xs">Click outside or press ESC to close</div>
                    </DialogContent>
                  </Dialog>
                  <div className="mt-4">
                    <div className="font-semibold">Seats</div>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {ticketsInTransaction.map((t) => (
                        <li key={t.id} className="text-xs px-2 py-1 bg-muted rounded flex items-center gap-2">
                          <span>Seat <b>{t.seat}</b></span>
                          <span className="text-[10px] text-muted-foreground">{t.checkedIn ? 'Checked in' : 'Not checked in'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">Transaction ID: {ticket.transactionId}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
