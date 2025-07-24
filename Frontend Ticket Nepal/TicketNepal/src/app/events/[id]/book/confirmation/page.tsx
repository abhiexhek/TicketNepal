'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
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

function BookingConfirmationPageContent() {
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
      notFound();
      return;
    }
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/validate/transaction?transactionId=${transactionId}`)
      .then(res => res.json())
      .then(data => {
        setConfirmation(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast({ title: 'Error', description: 'Could not fetch booking confirmation.', variant: 'destructive' });
      });
  }, [transactionId, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 text-primary underline">
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Link>
          <div className="flex flex-col items-center gap-4">
            <PartyPopper className="h-12 w-12 text-green-500" />
            <h1 className="text-2xl font-bold">Booking Confirmation</h1>
            {loading ? (
              <Skeleton className="w-full h-32" />
            ) : confirmation ? (
              <>
                <div className="text-center">
                  <div className="mb-2">Your tickets have been booked!</div>
                  <div className="mb-2">Transaction ID: <b>{transactionId}</b></div>
                  <div className="mb-2">Event: <b>{confirmation.event?.name}</b></div>
                  <div className="mb-2">Seats: <b>{confirmation.tickets?.map(t => t.seat).join(', ')}</b></div>
                </div>
                <div className="w-full flex flex-col items-center gap-2">
                  <Button onClick={() => setQrOpen(transactionId || '')} className="w-full">Show QR Code</Button>
                  <Dialog open={!!qrOpen} onOpenChange={() => setQrOpen(false)}>
                    <DialogContent>
                      <DialogTitle>Group QR Code</DialogTitle>
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/qr/transaction/${transactionId}`}
                          alt="Group QR Code"
                          className="w-40 h-40 border rounded-lg"
                        />
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/qr/transaction/${transactionId}`);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `group-qr-${transactionId}.png`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" /> Download QR
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            ) : (
              <div className="text-red-500">Could not find booking confirmation.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingConfirmationPageContent />
    </Suspense>
  );
}