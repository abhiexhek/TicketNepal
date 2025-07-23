'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PartyPopper } from 'lucide-react';

import { Header } from '@/components/header';
import { ETicket } from '@/components/e-ticket';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { TransactionBookingConfirmation } from '@/lib/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Download } from 'lucide-react';

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  // Get transactionId from search params
  const transactionId = searchParams.get('transactionId');

  const [confirmation, setConfirmation] = useState<TransactionBookingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      toast({
        title: 'Booking not found',
        description: 'Missing or invalid booking information.',
        variant: 'destructive',
      });
      router.replace('/my-tickets');
      return;
    }

    const fetchConfirmation = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/tickets/validate/transaction?transactionId=${transactionId}`);
        if (response.ok) {
          const data = await response.json();
          setConfirmation(data);
        } else {
          toast({
            title: 'Booking not found',
            description: 'Could not fetch booking details.',
            variant: 'destructive',
          });
          setConfirmation(null);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Could not fetch booking details.',
          variant: 'destructive',
        });
        setConfirmation(null);
      }
      setLoading(false);
    };

    fetchConfirmation();
  }, [transactionId, toast, router]);

  // Redirect if confirmation is not found
  useEffect(() => {
    if (!loading && !confirmation) {
      router.replace('/my-tickets');
    }
  }, [loading, confirmation, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 md:py-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="max-w-4xl mx-auto text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto mt-2 mb-8" />
          </div>
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!confirmation) {
    return null;
  }

  const { event, tickets } = confirmation;
  const qrCodeUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/tickets/qr/transaction/${transactionId}`;

  // Download QR code handler
  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-qr-${transactionId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download QR code.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-4 sm:py-8 md:py-12">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/my-tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Tickets
          </Link>
        </Button>
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 text-center">
          <PartyPopper className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Booking Confirmed!</h1>
          <p className="text-muted-foreground mt-2 mb-8">
            Thank you for your purchase. Your e-ticket is ready below.
          </p>
        </div>
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 flex flex-col items-center">
          <div className="mb-6 flex flex-col items-center">
            <div className="relative w-40 h-40 mx-auto rounded-lg border overflow-hidden cursor-pointer ring-4 ring-background" onClick={() => setQrOpen(true)}>
              <img src={qrCodeUrl} alt="QR Code" className="object-cover w-full h-full" />
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download QR Code
            </Button>
            <div className="text-xs text-muted-foreground mt-2">Click the QR code to view fullscreen. Scan at the event entrance. It contains all your tickets for this purchase.</div>
          </div>
          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogContent className="flex flex-col items-center justify-center">
              <DialogTitle>Group QR Code</DialogTitle>
              <img src={qrCodeUrl} alt="QR Code Fullscreen" className="object-contain rounded-lg w-80 h-80" />
              <div className="mt-2 text-center text-muted-foreground text-xs">Click outside or press ESC to close</div>
            </DialogContent>
          </Dialog>
          <div className="mb-6 w-full">
            <h2 className="text-lg font-bold mb-2">Your Tickets</h2>
            <ul className="grid gap-2">
              {tickets.map((t) => (
                <li key={t.ticketId} className="border rounded p-2 flex flex-col sm:flex-row sm:items-center justify-between bg-muted/50">
                  <span>Seat: <b>{t.seat}</b></span>
                  <span className="text-xs text-muted-foreground">Checked in: {t.checkedIn ? 'Yes' : 'No'}</span>
                  <span className="text-xs text-muted-foreground">Ticket ID: {t.ticketId}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-6 w-full">
            <h2 className="text-lg font-bold mb-2">Event Details</h2>
            <div className="text-left bg-muted/30 rounded p-3">
              <div><b>{event.name}</b></div>
              <div>{event.category}</div>
              <div>{event.location}</div>
              <div>{event.eventStart ? new Date(event.eventStart).toLocaleString() : ''}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}