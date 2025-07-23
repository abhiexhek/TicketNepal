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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
          console.log('Fetched tickets:', data);
          if (Array.isArray(data)) {
            setTickets(data);
            // Fetch event details for each ticket (if needed)
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

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!currentUser) return <div className="p-8 text-center text-red-500">Please log in to view your tickets.</div>;
  if (currentUser && (currentUser.role === "Organizer" || currentUser.role === "Staff")) {
    const isOrganizer = currentUser.role === "Organizer";
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-auto mt-16 shadow-lg">
          <CardHeader className="flex flex-col items-center">
            <span className="h-12 w-12 text-primary mb-2 flex items-center justify-center">
              {/* Use an icon here if you want */}
              <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
            </span>
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
                  {/* Use an icon here if you want */}
                  Dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">
                  Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!tickets.length) return (
    <div className="p-8 text-center flex flex-col items-center gap-4">
      <div>You have no tickets yet.</div>
      <div className="flex gap-4 justify-center mt-4">
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/profile">Profile</Link>
        </Button>
      </div>
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
      <main className="flex-1 container py-4 sm:py-8 md:py-12">
        <Card>
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <h2 className="text-2xl font-bold">My Tickets</h2>
              {currentUser?.role === 'Organizer' && (
                <Button onClick={() => router.push('/my-tickets/create')}>
                  Create New Ticket
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-2 sm:px-4">
              {transactionList.map((ticketsInTransaction) => {
                const ticket = ticketsInTransaction[0];
                const event = events[ticket.eventId] || { name: 'Event unavailable', imageUrl: '', category: '', eventStart: '' };
                const qrCodeUrl = `${API_URL}/api/tickets/qr/transaction/${ticket.transactionId}`;
                return (
                  <div key={ticket.transactionId} className="min-w-0 min-h-0 flex flex-col items-stretch border rounded-lg p-4 bg-muted/50">
                    <div className="mb-2 font-bold text-lg">{event.name}</div>
                    <div className="mb-2">
                      {getEventImageUrl(event.imageUrl)
                        ? <img src={getEventImageUrl(event.imageUrl)} alt={event.name} className="w-full h-32 object-cover rounded" />
                        : <div className="w-full h-32 flex items-center justify-center bg-gray-200 text-gray-500 rounded">No image</div>
                      }
                    </div>
                    <div className="mb-2 flex flex-col items-center">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-32 h-32 mx-auto rounded-lg border cursor-pointer"
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
                    <div className="mb-2">
                      <div className="font-semibold">Seats:</div>
                      <ul className="text-sm">
                        {ticketsInTransaction.map((t) => (
                          <li key={t.id} className="flex justify-between">
                            <span>Seat: <b>{t.seat}</b></span>
                            <span className="text-xs text-muted-foreground">Checked in: {t.checkedIn ? 'Yes' : 'No'}</span>
                            <span className="text-xs text-muted-foreground">Ticket ID: {t.id}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-xs text-muted-foreground">Transaction ID: {ticket.transactionId}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
