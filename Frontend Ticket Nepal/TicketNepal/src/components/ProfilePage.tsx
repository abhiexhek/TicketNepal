'use client';

import { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/context/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, User2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export default function ProfilePage() {
  const { currentUser, isLoading } = useContext(UserContext);
  const [tickets, setTickets] = useState<any[]>([]);
  const [events, setEvents] = useState<{ [eventId: string]: any }>({});
  const [qrOpen, setQrOpen] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/user/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
        .then(res => res.json())
        .then(data => {
          setTickets(data || []);
          (data || []).forEach((ticket: any) => {
            if (!events[ticket.eventId]) {
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${ticket.eventId}`)
                .then(res => res.json())
                .then(eventData => setEvents(prev => ({ ...prev, [ticket.eventId]: eventData })));
            }
          });
        });
    }
  }, [currentUser]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">You must be logged in to view your profile.</div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => router.push('/auth/login?redirect=/profile')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Group tickets by transactionId
  const transactions: { [transactionId: string]: any[] } = {};
  for (const ticket of tickets) {
    if (!ticket.transactionId) continue;
    if (!transactions[ticket.transactionId]) transactions[ticket.transactionId] = [];
    transactions[ticket.transactionId].push(ticket);
  }
  const transactionList = Object.values(transactions);

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-2 sm:px-4">
      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4 sm:mb-6 justify-center w-full">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/">Events</Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/my-tickets">My Tickets</Link>
        </Button>
        {currentUser && ["Admin", "Organizer", "Staff"].includes(currentUser.role) && (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin">Dashboard</Link>
          </Button>
        )}
      </div>
      <Card className="shadow-xl rounded-2xl border border-gray-200 w-full max-w-full overflow-x-auto">
        <CardHeader className="flex flex-col items-center space-y-3 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-t-2xl py-8">
          <div className="relative">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="User Avatar"
                className="w-28 h-28 rounded-full border-4 border-blue-400 shadow-lg object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-blue-100 border-4 border-blue-400 flex items-center justify-center">
                <User2 className="w-16 h-16 text-blue-400" />
              </div>
            )}
            {'verified' in currentUser && (currentUser as any).verified && (
              <span className="absolute bottom-2 right-2 bg-white rounded-full border border-green-400 p-1">
                <BadgeCheck className="text-green-500 w-6 h-6" />
              </span>
            )}
          </div>
          <CardTitle className="text-3xl font-bold text-blue-900">
            {currentUser.name || "No name"}
          </CardTitle>
          <div className="text-md text-muted-foreground font-semibold">
            @{currentUser.username || currentUser.email || "unknown"}
          </div>
          <div className="text-xs text-gray-600 mt-1">{currentUser.email}</div>
          <div className="mt-1">
            <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-lg">
              {currentUser.role || "User"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="grid gap-2">
            {/* Additional profile info can go here */}
            {currentUser.organizerName && (
              <div className="text-center text-blue-700 font-medium">
                Organizer: {currentUser.organizerName}
              </div>
            )}
          </div>
          {/* Purchased Tickets Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">My Tickets</h2>
            {transactionList.length === 0 ? (
              <div className="text-muted-foreground">No tickets purchased yet.</div>
            ) : (
              <div className="space-y-4">
                {transactionList.map((ticketsInTransaction) => {
                  const ticket = ticketsInTransaction[0];
                  const event = events[ticket.eventId] || { name: 'Event unavailable', imageUrl: '', category: '', eventStart: '' };
                  const qrCodeUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/tickets/qr/transaction/${ticket.transactionId}`;
                  const getEventImageUrl = (imageUrl: string) => {
                    if (!imageUrl) return "";
                    return imageUrl.startsWith("http")
                      ? imageUrl
                      : `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
                  };
                  return (
                    <div key={ticket.transactionId} className="border rounded-lg p-4 bg-muted/50 flex flex-col gap-2">
                      <div className="font-bold text-lg mb-1">{event.name}</div>
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
