
'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, TicketCheck, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/UserContext";
import Image from "next/image";

export function StaffDashboard() {
    const { currentUser } = useContext(UserContext);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const token = localStorage.getItem('authToken');
                // Fetch all events for now; you can filter by staff assignment if backend supports
                const response = await fetch(`${API_URL}/api/events`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (response.ok) {
                    setEvents(await response.json());
                } else {
                    setEvents([]);
                }
            } catch {
                setEvents([]);
            }
            setLoading(false);
        };
        fetchEvents();
    }, [currentUser]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Staff Dashboard</h1>
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-2 sm:px-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Ready to Scan
                        </CardTitle>
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Ticket Validation</div>
                        <p className="text-xs text-muted-foreground">
                        Click below to start scanning tickets.
                        </p>
                         <Button asChild className="mt-4 w-full">
                            <Link href="/admin/scan">
                                <QrCode className="mr-2 h-5 w-5" />
                                Launch Scanner
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Events to Validate
                        </CardTitle>
                        <TicketCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div>Loading events...</div>
                        ) : events.length === 0 ? (
                            <div>No events available.</div>
                        ) : (
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto px-2 sm:px-4">
                                {events.map(event => {
                                    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                                    const imageUrl = event.imageUrl?.startsWith("http")
                                        ? event.imageUrl
                                        : `${API_BASE}${event.imageUrl || ""}`;
                                    return (
                                        <Link
                                            key={event.id}
                                            href={`/admin/scan?eventId=${event.id}`}
                                            className="block group rounded-xl border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden p-0"
                                        >
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 sm:gap-6">
                                                {event.imageUrl && (
                                                    <div className="relative w-full sm:w-40 h-40 sm:h-40 flex-shrink-0 bg-gray-100 border-b sm:border-b-0 sm:border-r border-gray-200">
                                                        <Image
                                                            src={imageUrl}
                                                            alt={event.name}
                                                            fill
                                                            className="object-cover rounded-t-xl sm:rounded-t-none sm:rounded-l-xl"
                                                            unoptimized
                                                        />
                                                        <div className="absolute bottom-0 left-0 w-full bg-black/70 px-2 py-2 flex items-center justify-center">
                                                            <span className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-sm text-center w-full truncate">{event.name}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex-1 flex flex-col justify-center p-5">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{event.category}</span>
                                                        <span className="block text-xs text-muted-foreground mt-1">
                                                            {event.eventStart ? `Start: ${new Date(event.eventStart).toLocaleString()}` : ''}
                                                            {event.eventEnd ? ` | End: ${new Date(event.eventEnd).toLocaleString()}` : ''}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="inline-block px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition">Validate Tickets</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
