
'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, TicketCheck, Calendar as CalendarIcon, Ban, Clock, CheckCircle, Scan, Users, Activity, AlertCircle, CheckSquare, XCircle } from "lucide-react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/UserContext";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  name: string;
  category: string;
  status: string;
  imageUrl?: string;
  eventStart: string;
  eventEnd: string;
  ticketsSold: number;
  organizer: {
    name: string;
  };
}

export function StaffDashboard() {
    const { currentUser } = useContext(UserContext);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEvents: 0,
        approvedEvents: 0,
        pendingEvents: 0,
        rejectedEvents: 0,
        ticketsScanned: 0,
        ticketsValidated: 0
    });
    const { toast } = useToast();

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const token = localStorage.getItem('authToken');
                if (!currentUser?.id) return;
                
                const response = await fetch(`${API_URL}/api/events/staff/${currentUser.id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                
                if (response.ok) {
                    const eventsData = await response.json();
                    setEvents(eventsData);
                    
                    // Calculate stats
                    const approved = eventsData.filter((e: Event) => e.status === "APPROVED").length;
                    const pending = eventsData.filter((e: Event) => e.status === "PENDING").length;
                    const rejected = eventsData.filter((e: Event) => e.status === "REJECTED").length;
                    
                    setStats({
                        totalEvents: eventsData.length,
                        approvedEvents: approved,
                        pendingEvents: pending,
                        rejectedEvents: rejected,
                        ticketsScanned: Math.floor(Math.random() * 150) + 50, // Mock data
                        ticketsValidated: Math.floor(Math.random() * 120) + 30 // Mock data
                    });
                } else {
                    setEvents([]);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
                setEvents([]);
                toast({
                    title: "Error",
                    description: "Failed to load events. Please try again.",
                    variant: "destructive",
                });
            }
            setLoading(false);
        };
        fetchEvents();
    }, [currentUser, toast]);

    // Group events by status
    const approvedEvents = events.filter(event => event.status === "APPROVED");
    const pendingEvents = events.filter(event => event.status === "PENDING");
    const rejectedEvents = events.filter(event => event.status === "REJECTED");

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
            case 'PENDING': return <Clock className="h-4 w-4" />;
            case 'REJECTED': return <Ban className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Skeleton className="h-10 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="card-elevated">
                            <CardHeader>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Staff Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Ticket validation and event management
                    </p>
                </div>
                <Button asChild className="shadow-sm">
                    <Link href="/admin/scan">
                        <Scan className="mr-2 h-5 w-5" />
                        Launch Scanner
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <TicketCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEvents}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Assigned to you
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Events</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.approvedEvents}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ready for validation
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Scanned</CardTitle>
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ticketsScanned}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Today's activity
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Validated</CardTitle>
                        <CheckSquare className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.ticketsValidated}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Successfully validated
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="card-elevated">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                    <CardDescription>
                        Common tasks and shortcuts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Button asChild className="h-auto p-6 flex flex-col items-center gap-3">
                            <Link href="/admin/scan">
                                <QrCode className="h-8 w-8" />
                                <div className="text-center">
                                    <div className="font-semibold">Scan Tickets</div>
                                    <div className="text-xs text-muted-foreground">Validate event tickets</div>
                                </div>
                            </Link>
                        </Button>
                        
                        <Button asChild variant="outline" className="h-auto p-6 flex flex-col items-center gap-3">
                            <Link href="/admin/scan?mode=manual">
                                <TicketCheck className="h-8 w-8" />
                                <div className="text-center">
                                    <div className="font-semibold">Manual Entry</div>
                                    <div className="text-xs text-muted-foreground">Enter ticket codes manually</div>
                                </div>
                            </Link>
                        </Button>
                        
                        <Button asChild variant="outline" className="h-auto p-6 flex flex-col items-center gap-3">
                            <Link href="/admin/scan?mode=report">
                                <Users className="h-8 w-8" />
                                <div className="text-center">
                                    <div className="font-semibold">Attendance Report</div>
                                    <div className="text-xs text-muted-foreground">View validation reports</div>
                                </div>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Events Management */}
            <Tabs defaultValue="approved" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="approved" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approved ({approvedEvents.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending ({pendingEvents.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Rejected ({rejectedEvents.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="approved" className="space-y-6">
                    {approvedEvents.length === 0 ? (
                        <Card className="card-elevated">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No approved events</h3>
                                <p className="text-muted-foreground text-center">
                                    You don't have any approved events to validate tickets for.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {approvedEvents.map(event => (
                                <Card key={event.id} className="card-interactive group">
                                    <CardHeader className="p-0">
                                        {event.imageUrl && (
                                            <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                                                <Image
                                                    src={event.imageUrl.startsWith('http') ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${event.imageUrl}`}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    unoptimized
                                                />
                                                <div className="absolute top-3 right-3">
                                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Approved
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mb-3">
                                                <CalendarIcon className="h-4 w-4" />
                                                {event.eventStart ? new Date(event.eventStart).toLocaleDateString() : 'No date set'}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Category</span>
                                                <span className="text-sm font-medium">{event.category}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Organizer</span>
                                                <span className="text-sm font-medium">{event.organizer?.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Tickets Sold</span>
                                                <span className="text-sm font-medium">{event.ticketsSold || 0}</span>
                                            </div>
                                        </div>
                                        <Button asChild className="w-full">
                                            <Link href={`/admin/scan?eventId=${event.id}`}>
                                                <QrCode className="mr-2 h-4 w-4" />
                                                Start Validation
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-6">
                    {pendingEvents.length === 0 ? (
                        <Card className="card-elevated">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No pending events</h3>
                                <p className="text-muted-foreground text-center">
                                    All your events have been processed.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {pendingEvents.map(event => (
                                <Card key={event.id} className="card-elevated opacity-75">
                                    <CardHeader className="p-0">
                                        {event.imageUrl && (
                                            <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                                                <Image
                                                    src={event.imageUrl.startsWith('http') ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${event.imageUrl}`}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                <div className="absolute top-3 right-3">
                                                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        Pending
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mb-3">
                                                <CalendarIcon className="h-4 w-4" />
                                                {event.eventStart ? new Date(event.eventStart).toLocaleDateString() : 'No date set'}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Category</span>
                                                <span className="text-sm font-medium">{event.category}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Organizer</span>
                                                <span className="text-sm font-medium">{event.organizer?.name}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                                Waiting for admin approval
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-6">
                    {rejectedEvents.length === 0 ? (
                        <Card className="card-elevated">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No rejected events</h3>
                                <p className="text-muted-foreground text-center">
                                    All your events have been approved.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {rejectedEvents.map(event => (
                                <Card key={event.id} className="card-elevated opacity-50">
                                    <CardHeader className="p-0">
                                        {event.imageUrl && (
                                            <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                                                <Image
                                                    src={event.imageUrl.startsWith('http') ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${event.imageUrl}`}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                <div className="absolute top-3 right-3">
                                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                                        <Ban className="mr-1 h-3 w-3" />
                                                        Rejected
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mb-3">
                                                <CalendarIcon className="h-4 w-4" />
                                                {event.eventStart ? new Date(event.eventStart).toLocaleDateString() : 'No date set'}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Category</span>
                                                <span className="text-sm font-medium">{event.category}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Organizer</span>
                                                <span className="text-sm font-medium">{event.organizer?.name}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <p className="text-sm text-red-700 dark:text-red-400">
                                                Event was not approved
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
