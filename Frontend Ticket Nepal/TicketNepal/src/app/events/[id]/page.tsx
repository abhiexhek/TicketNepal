"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Tag } from "lucide-react";
import { UserContext } from "@/context/UserContext";
import { toSafeDate } from "@/lib/utils";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(UserContext);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (res.ok) {
          setEvent(await res.json());
        } else {
          setEvent(null);
        }
      } catch {
        setEvent(null);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 md:py-12">
          <div className="text-center py-20">Loading event...</div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 md:py-12">
          <div className="text-center py-20 text-red-500">Event not found.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{event.name}</CardTitle>
              <div className="flex gap-4 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1"><Tag className="w-4 h-4" />{event.category}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{event.eventStart ? (() => { const d = toSafeDate(event.eventStart); return d ? d.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : '' })() : ''}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <img
                  src={event.imageUrl?.startsWith("http") ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${event.imageUrl}`}
                  alt={event.name}
                  className="w-full max-h-80 object-cover rounded-lg border"
                />
              </div>
              <div className="mb-4 text-lg">{event.description}</div>
              {event.eventEnd && (
                <div className="mb-2 text-sm text-muted-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Ends: {(() => { const d = toSafeDate(event.eventEnd); return d ? d.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : '' })()}</span>
                </div>
              )}
              <div className="mb-2 text-sm text-muted-foreground">Price: <b>Rs. {event.price}</b></div>
              <div className="mb-2 text-sm text-muted-foreground">Total Seats: <b>{event.seats?.length || 0}</b></div>
              <div className="mb-2 text-sm text-muted-foreground">Organizer: <b>{event.organizer}</b></div>
            </CardContent>
            <div className="flex justify-end p-6 pt-0">
              {(!currentUser || currentUser.role === "Customer") && (
                <Button asChild>
                  <Link href={`/events/${event.id}/book`}>
                    Book Ticket
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
