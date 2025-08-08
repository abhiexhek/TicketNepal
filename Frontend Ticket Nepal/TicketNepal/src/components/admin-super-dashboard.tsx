import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket, Users, Shield, TrendingUp, Activity, Settings, UserPlus, Calendar, DollarSign, Eye, MoreVertical, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Event {
  id: string;
  name: string;
  organizer: string;
  ticketsSold: number;
  income: number;
  eventStart: string;
  status: string;
}

export function AdminSuperDashboard() {
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
              const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem('authToken');

      try {
        // Fetch events
        const eventsResponse = await fetch(`${API_URL}/api/events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const events = eventsResponse.ok ? await eventsResponse.json() : [];
        setEventCount(Array.isArray(events) ? events.length : 0);
        
        // Calculate total revenue
        const revenue = events.reduce((acc: number, event: any) => 
          acc + (event.income || 0), 0
        );
        setTotalRevenue(revenue);

        // Get recent events
        const recentEventsData = events
          .sort((a: any, b: any) => new Date(b.createdAt || b.eventStart).getTime() - new Date(a.createdAt || a.eventStart).getTime())
          .slice(0, 5)
          .map((event: any) => ({
            id: event.id,
            name: event.name,
            organizer: event.organizer?.name || 'Unknown',
            ticketsSold: event.ticketsSold || 0,
            income: event.income || 0,
            eventStart: event.eventStart,
            status: getEventStatus(event)
          }));
        setRecentEvents(recentEventsData);

        // Fetch users
        const usersResponse = await fetch(`${API_URL}/api/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const users = usersResponse.ok ? await usersResponse.json() : [];
        setUserCount(Array.isArray(users) ? users.length : 0);

        // Get recent users
        const recentUsersData = users
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt
          }));
        setRecentUsers(recentUsersData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const getEventStatus = (event: any) => {
    const now = new Date();
    const eventStart = new Date(event.eventStart);
    const eventEnd = new Date(event.eventEnd);
    
    if (!event.eventStart) return 'draft';
    if (eventStart > now) return 'upcoming';
    if (eventEnd < now) return 'past';
    return 'ongoing';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'Organizer': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Staff': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'Customer': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'upcoming': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'past': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
      case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
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
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System overview and management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventCount?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all organizers
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₨{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform earnings
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Uptime this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Recent Users */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>
                  Latest registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Recent Events
                </CardTitle>
                <CardDescription>
                  Latest created events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          by {event.organizer}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₨{event.income.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{event.ticketsSold} tickets</p>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage all registered users
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Users className="mr-2 h-4 w-4" />
                          Suspend User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Management</CardTitle>
                  <CardDescription>
                    Monitor all platform events
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        by {event.organizer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.eventStart ? new Date(event.eventStart).toLocaleDateString() : 'No date set'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">₨{event.income.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{event.ticketsSold} tickets</p>
                    </div>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Ticket className="mr-2 h-4 w-4" />
                          View Tickets
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Shield className="mr-2 h-4 w-4" />
                          Suspend Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
