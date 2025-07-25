'use client'

import { useContext, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { UserContext } from '@/context/UserContext';
import { EventCard } from './event-card';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


export function OrganizerDashboard() {
    const { currentUser } = useContext(UserContext);

    const [organizerEvents, setOrganizerEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [staffForm, setStaffForm] = useState({ name: '', username: '', email: '', password: '' });
    const [staffLoading, setStaffLoading] = useState(false);

    const handleStaffInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStaffForm({ ...staffForm, [e.target.name]: e.target.value });
    };

    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStaffLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/api/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify(staffForm),
            });
            if (response.ok) {
                toast({ title: 'Staff Created', description: 'Staff user has been invited and must verify their email.' });
                setStaffForm({ name: '', username: '', email: '', password: '' });
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error || err.message || 'Failed to create staff.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
        }
        setStaffLoading(false);
    };

    useEffect(() => {
        if (!currentUser?.id) return;
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem('authToken');
        fetch(`${API_URL}/api/events/organizer/${currentUser.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(res => res.json())
            .then(data => setOrganizerEvents(data))
            .catch(() => setOrganizerEvents([]))
            .finally(() => setLoading(false));
    }, [currentUser?.id]);

    if (!currentUser) {
        return (
            <div className="text-center py-10">
                <p>Loading organizer data...</p>
            </div>
        );
    }

    // Tickets sold calculation: Use sum of ticketsSold field if available, else 0
    const totalTicketsSold = organizerEvents.reduce(
        (acc, event) => acc + (typeof event.ticketsSold === 'number' ? event.ticketsSold : 0),
        0
    );

    
    const totalSales = organizerEvents.reduce(
        (acc, event) => acc + (typeof event.income === 'number' ? event.income : 0),
        0
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Organizer Dashboard</h1>
                <Button asChild>
                    <Link href="/admin/create-event">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create New Event
                    </Link>
                </Button>
            </div>

            {/* Staff Creation Form - only for organizers */}
            {currentUser?.role === 'Organizer' && (
                <Card className="mb-8 max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle>Add Staff</CardTitle>
                        <CardDescription>Invite a staff member to your team. They will receive a verification email.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleStaffSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="staff-name">Name</Label>
                                <Input id="staff-name" name="name" value={staffForm.name} onChange={handleStaffInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="staff-username">Username</Label>
                                <Input id="staff-username" name="username" value={staffForm.username} onChange={handleStaffInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="staff-email">Email</Label>
                                <Input id="staff-email" name="email" type="email" value={staffForm.email} onChange={handleStaffInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="staff-password">Password</Label>
                                <Input id="staff-password" name="password" type="password" value={staffForm.password} onChange={handleStaffInputChange} required />
                            </div>
                            <Button type="submit" disabled={staffLoading}>{staffLoading ? 'Creating...' : 'Add Staff'}</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-2 sm:px-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <span className="h-4 w-4 text-muted-foreground text-lg font-bold">₨</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₨{totalSales.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">From all your events</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalTicketsSold}</div>
                        <p className="text-xs text-muted-foreground">Across all your events</p>
                    </CardContent>
                </Card>
            </div>

            {/* List of events with tickets sold */}
            <div className="mt-10">
                <h2 className="text-xl font-bold mb-4">Your Events</h2>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-2 sm:px-4">
                    {organizerEvents.map(event => (
                        <Card key={event.id}>
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
                                <div className="flex flex-col gap-2 mb-2">
                                    <span><b>Tickets Sold:</b> {event.ticketsSold ?? 0}</span>
                                    <span><b>Revenue:</b> ₨{event.income?.toFixed(2) ?? '0.00'}</span>
                                    <span><b>Location:</b> {event.location}</span>
                                    <span><b>Start:</b> {event.eventStart ? new Date(event.eventStart).toLocaleString() : ''}</span>
                                    {event.eventEnd && <span><b>End:</b> {new Date(event.eventEnd).toLocaleString()}</span>}
                                    <span><b>Price:</b> ₨{event.price?.toFixed(2) ?? '0.00'}</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button asChild size="sm" variant="outline">
                                        <a href={`/admin/update-event/${event.id}`}><Pencil className="w-4 h-4 mr-1" /> Update</a>
                                    </Button>
                                    {(event.ticketsSold === 0 || (event.eventEnd && new Date(event.eventEnd) < new Date())) && (
                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event.id)}>
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

function handleDeleteEvent(eventId: string) {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem('authToken');
        fetch(`${API_URL}/api/events/${eventId}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        .then(res => {
            if (res.ok) {
                window.location.reload();
            } else {
                alert('Failed to delete event.');
            }
        });
    }
}
