"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function EventsBrowsePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${API_URL}/api/events`);
        if (res.ok) {
          setEvents(await res.json());
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen py-8 container mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Browse Events</h1>
      {loading ? (
        <div className="text-center py-20">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No events found.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {events.map(event => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                {event.imageUrl && (
                  <div className="relative w-full h-40 mb-2 rounded overflow-hidden">
                    <Image
                      src={event.imageUrl.startsWith('http') ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${event.imageUrl}`}
                      alt={event.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>{event.category} | {event.eventStart ? new Date(event.eventStart).toLocaleString() : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-sm text-muted-foreground">Location: <b>{event.location}</b></div>
                <div className="mb-2 text-sm text-muted-foreground">Price: <b>Rs. {event.price}</b></div>
                <Button asChild className="w-full mt-2">
                  <Link href={`/events/${event.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 