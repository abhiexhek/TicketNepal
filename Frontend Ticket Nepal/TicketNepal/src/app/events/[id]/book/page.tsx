'use client';

import { notFound, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Header } from "@/components/header";
import { SeatMap } from "@/components/seat-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { EventContext } from "@/context/EventContext";
import { UserContext } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface Event {
  id: string;
  name: string;
  category: string;
  eventStart: string;
  eventEnd: string;
  location: string;
  city: string;
  description: string;
  organizer: string;
  imageUrl: string;
  price: number;
  seats?: string[];
}

const paymentFormSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "Must be 16 digits"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/YY format"),
  cvc: z.string().regex(/^\d{3,4}$/, "Must be 3 or 4 digits"),
  nameOnCard: z.string().min(2, "Name is required"),
});

export default function BookTicketPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { events } = useContext(EventContext);
  const { currentUser, isLoading } = useContext(UserContext);
  const event = events.find((e) => e.id === params.id);

  // Show loading state while events are being fetched
  if (!event && events.length === 0) {
    return <div className="py-8 text-center">Loading event...</div>;
  }

  // Show not found if events are loaded but event is missing
  if (events.length > 0 && !event) {
    return <div className="py-8 text-center text-red-500">Event not found.</div>;
  }

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch reserved seats for the event
  const fetchReservedSeats = async () => {
    if (!event) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/reserved?eventId=${event.id}`);
      const data = await res.json();
      setReservedSeats(data.reservedSeats || []);
    } catch (e) {
      setReservedSeats([]); // fallback
    }
  };

  useEffect(() => {
    if (!isLoading && !currentUser) {
      toast({
        title: "Please log in",
        description: "You need to log in or create an account to book tickets.",
        variant: "destructive"
      });
      router.push(`/auth/login?redirect=/events/${params.id}/book`);
    }
    // Prevent staff/organizer from booking
    if (!isLoading && currentUser && currentUser.role !== "Customer") {
      toast({
        title: "Not allowed",
        description: "Only customers can purchase tickets.",
        variant: "destructive"
      });
      router.replace(`/events/${params.id}`);
    }
  }, [currentUser, isLoading, router, params.id, toast]);

  // Initial and periodic fetch of reserved seats
  useEffect(() => {
    fetchReservedSeats();
    const interval = setInterval(fetchReservedSeats, 5000);
    return () => clearInterval(interval);
  }, [event]);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: "",
      expiryDate: "",
      cvc: "",
      nameOnCard: "",
    },
  });

  if (!event) {
    notFound();
  }
  // Prevent staff/organizer from seeing booking UI
  if (currentUser && currentUser.role !== "Customer") {
    return null;
  }

  const handleToggleSeat = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "No seats selected",
        description: "Please select one or more seats to proceed.",
        variant: "destructive"
      });
      return;
    }
    setShowPayment(true);
  };

  // Handle payment submission
  async function onPaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    setLoading(true);
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: String(currentUser.id),
          eventId: String(event?.id),
          seats: selectedSeats,
        }),
      });

      if (response.ok) {
        const { tickets, transactionId } = await response.json();
        toast({ title: "Booking Successful!", description: `Your ${selectedSeats.length > 1 ? 'tickets have' : 'ticket has'} been booked.` });
        setReservedSeats((prev) => [...prev, ...selectedSeats]);
        setTimeout(async () => {
          await fetchReservedSeats();
          setSelectedSeats([]);
          router.push(`/events/${event?.id}/book/confirmation?transactionId=${transactionId}`);
        }, 350);
      } else {
        const err = await response.json();
        if (response.status === 409) {
          toast({
            title: "Seat already reserved!",
            description: err.error || `Seat ${err.seat || ''} was just reserved. Please choose another.`,
            variant: "destructive",
          });
          await fetchReservedSeats();
        } else {
          toast({
            title: "Booking Failed",
            description: err.error || err.message || "Could not book ticket.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to backend.",
        variant: "destructive"
      });
    }
    setLoading(false);
  }

  // Only render booking UI if event is defined
  if (!event) return null;

  console.log('Event seats:', event?.seats ?? []);
  console.log('Reserved seats:', reservedSeats);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-4 sm:py-8 md:py-12">
        <Button asChild variant="ghost" className="mb-4 w-full sm:w-auto">
          <Link href={`/events/${event?.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to event
          </Link>
        </Button>
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
          <Card>
            <CardHeader>
              <CardTitle>Book Your Ticket</CardTitle>
              <CardDescription>
                Select your seats and proceed to payment to confirm your booking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <SeatMap
                  seats={event && event.seats ? event.seats : []}
                  selectedSeats={selectedSeats}
                  reservedSeats={reservedSeats}
                  onToggleSeat={handleToggleSeat}
                />
              </div>
              {!showPayment && (
                <Button
                  className="w-full text-base sm:text-lg"
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0}
                >
                  Proceed to Payment
                </Button>
              )}
              {showPayment && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onPaymentSubmit)} className="space-y-4 sm:space-y-6">
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012 3456" {...field} maxLength={16} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Expiry Date (MM/YY)</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} maxLength={5} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input placeholder="CVC" {...field} maxLength={4} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="nameOnCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name on Card</FormLabel>
                          <FormControl>
                            <Input placeholder="Full Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Processing..." : "Pay & Book Ticket"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <div className="flex items-center text-muted-foreground mt-4">
                <CreditCard className="w-5 h-5 mr-2" />
                Secure payment via our trusted provider.
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
