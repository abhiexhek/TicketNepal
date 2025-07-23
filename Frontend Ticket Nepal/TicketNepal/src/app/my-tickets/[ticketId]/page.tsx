"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ETicket } from "@/components/e-ticket";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ticket && data.event) {
          setTicket({ ...data.ticket, event: data.event });
          setEvent(data.event);
        } else if (data.ticket) {
          setTicket(data.ticket);
        }
      });
  }, [ticketId]);

  useEffect(() => {
    if (ticket && !event && ticket.eventId) {
      fetch(`${API_URL}/api/events/${ticket.eventId}`)
        .then(res => res.json())
        .then(setEvent);
    }
  }, [ticket, event]);

  if (!ticket) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="w-full max-w-lg mx-auto py-6 px-2 sm:px-4">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket && event ? (
            <ETicket ticket={{ ...ticket, event }} />
          ) : (
            <>
              <div>
                <b>Event:</b> {event?.name || ticket.eventId}
              </div>
              <div>
                <b>Seat:</b> {ticket.seat}
              </div>
              <div>
                <b>Ticket ID:</b> {ticket.id}
              </div>
              <div className="flex justify-center py-4">
                <img
                  src={`${API_URL}/api/tickets/qr/${ticket.id}`}
                  alt="QR Code"
                  className="w-40 h-40 border rounded-lg"
                />
              </div>
            </>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href="/my-tickets">Back to My Tickets</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
