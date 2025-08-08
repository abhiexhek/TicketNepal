'use client'

import { useContext, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, Trash2, Pencil, TrendingUp, Calendar, MapPin, DollarSign, Eye, MoreVertical, Filter, Search, Activity, BarChart3, TrendingDown, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { UserContext } from '@/context/UserContext';
import { EventCard } from './event-card';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  organizer: {
    name: string;
    email: string;
    role: string;
  };
  events: Array<{
    id: string;
    name: string;
    category: string;
    location: string;
    imageUrl?: string;
    price: number;
    income: number;
    ticketsSold: number;
    eventStart: string;
    eventEnd: string;
    status: string;
    seats: string[];
  }>;
  statistics: {
    totalRevenue: number;
    totalTicketsSold: number;
    upcomingEvents: number;
    pastEvents: number;
    ongoingEvents: number;
    draftEvents: number;
    totalEvents: number;
    revenueGrowth: number;
    ticketGrowth: number;
  };
  recentActivity: Array<{
    type: string;
    eventName: string;
    date: string;
    ticketsSold: number;
  }>;
}

export function OrganizerDashboard() {
    const { currentUser } = useContext(UserContext);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past' | 'draft' | 'ongoing'>('all');
    const { toast } = useToast();

    useEffect(() => {
        if (!currentUser?.id) return;
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const token = localStorage.getItem('authToken');
        
        fetch(`${API_URL}/api/events/organizer/${currentUser.id}/dashboard`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(res => res.json())
            .then(data => setDashboardData(data))
            .catch((error) => {
                console.error('Error fetching dashboard data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load dashboard data. Please try again.",
                    variant: "destructive",
                });
            })
            .finally(() => setLoading(false));
    }, [currentUser?.id, toast]);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading organizer data...</p>
                </div>
            </div>
        );
    }

    // Filter events based on search and status
    const filteredEvents = dashboardData?.events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = true;
        switch (filterStatus) {
            case 'upcoming':
                matchesStatus = event.status === 'upcoming';
                break;
            case 'past':
                matchesStatus = event.status === 'past';
                break;
            case 'draft':
                matchesStatus = event.status === 'draft';
                break;
            case 'ongoing':
                matchesStatus = event.status === 'ongoing';
                break;
            default:
                matchesStatus = true;
        }
        
        return matchesSearch && matchesStatus;
    }) || [];

    const handleDeleteEvent = (eventId: string) => {
        if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const token = localStorage.getItem('authToken');
            fetch(`${API_URL}/api/events/${eventId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            .then(res => {
                if (res.ok) {
                    toast({
                        title: "Event deleted",
                        description: "The event has been successfully deleted.",
                    });
                    window.location.reload();
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to delete event. Please try again.",
                        variant: "destructive",
                    });
                }
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            case 'ongoing': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'past': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
            case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'upcoming': return <Clock className="h-4 w-4" />;
            case 'ongoing': return <Activity className="h-4 w-4" />;
            case 'past': return <CheckCircle className="h-4 w-4" />;
            case 'draft': return <AlertCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    // Prepare chart data
    const revenueData = dashboardData?.events.slice(0, 7).map(event => ({
        name: event.name.substring(0, 10) + '...',
        revenue: event.income,
        tickets: event.ticketsSold
    })) || [];

    const categoryData = dashboardData?.events.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    const pieChartData = Object.entries(categoryData).map(([name, value]) => ({
        name,
        value
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Organizer Dashboard</h1>
                        <p className="text-muted-foreground mt-2">
                            Welcome back, {dashboardData?.organizer.name || currentUser.name}
                        </p>
                    </div>
                    <Button asChild className="shadow-sm">
                        <Link href="/admin/create-event">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create New Event
                        </Link>
                    </Button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filterStatus === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('upcoming')}
                        >
                            Upcoming
                        </Button>
                        <Button
                            variant={filterStatus === 'ongoing' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('ongoing')}
                        >
                            Ongoing
                        </Button>
                        <Button
                            variant={filterStatus === 'past' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('past')}
                        >
                            Past
                        </Button>
                    </div>
                </div>
            </div>

            {/* Analytics Cards */}
            {dashboardData && (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="card-elevated">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₨{dashboardData.statistics.totalRevenue.toLocaleString()}</div>
                            <div className="flex items-center gap-2 mt-1">
                                {dashboardData.statistics.revenueGrowth > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {dashboardData.statistics.revenueGrowth > 0 ? '+' : ''}{dashboardData.statistics.revenueGrowth.toFixed(1)}% from last month
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-elevated">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.statistics.totalTicketsSold.toLocaleString()}</div>
                            <div className="flex items-center gap-2 mt-1">
                                {dashboardData.statistics.ticketGrowth > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {dashboardData.statistics.ticketGrowth > 0 ? '+' : ''}{dashboardData.statistics.ticketGrowth.toFixed(1)}% from last month
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-elevated">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.statistics.upcomingEvents}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Events in the pipeline
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="card-elevated">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.statistics.totalEvents}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across all categories
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts Section */}
            {dashboardData && (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    <Card className="card-elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Revenue Overview
                            </CardTitle>
                            <CardDescription>
                                Revenue and ticket sales for recent events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                                        <Line type="monotone" dataKey="tickets" stroke="#82ca9d" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Event Categories
                            </CardTitle>
                            <CardDescription>
                                Distribution of events by category
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Events Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Your Events</h2>
                    <Badge variant="secondary" className="text-sm">
                        {filteredEvents.length} events
                    </Badge>
                </div>

                {filteredEvents.length === 0 ? (
                    <Card className="card-elevated">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No events found</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {searchTerm || filterStatus !== 'all' 
                                    ? "No events match your current filters."
                                    : "You haven't created any events yet."
                                }
                            </p>
                            <Button asChild>
                                <Link href="/admin/create-event">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Create Your First Event
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filteredEvents.map(event => (
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
                                                <Badge className={getStatusColor(event.status)}>
                                                    {getStatusIcon(event.status)}
                                                    <span className="ml-1">{event.status}</span>
                                                </Badge>
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background/80 hover:bg-background">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/update-event/${event.id}`}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit Event
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/events/${event.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Event
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {(event.ticketsSold === 0 || event.status === 'past') && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDeleteEvent(event.id)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Event
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <CardTitle className="text-lg mb-2 line-clamp-2">{event.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mb-3">
                                            <MapPin className="h-4 w-4" />
                                            {event.location}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Tickets Sold</span>
                                            <span className="font-semibold">{event.ticketsSold}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Revenue</span>
                                            <span className="font-semibold text-green-600">
                                                ₨{event.income?.toFixed(2) ?? '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Price</span>
                                            <span className="font-semibold">₨{event.price?.toFixed(2) ?? '0.00'}</span>
                                        </div>
                                        {event.eventStart && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Date</span>
                                                <span className="text-sm">
                                                    {new Date(event.eventStart).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-2 mt-4">
                                        <Button asChild size="sm" variant="outline" className="flex-1">
                                            <Link href={`/admin/update-event/${event.id}`}>
                                                <Pencil className="w-4 h-4 mr-1" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button asChild size="sm" variant="outline" className="flex-1">
                                            <Link href={`/events/${event.id}`}>
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
