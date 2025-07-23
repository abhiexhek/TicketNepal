import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Users } from "lucide-react";
import Link from "next/link";

export function AdminSuperDashboard() {
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    fetch(`${API_URL}/api/events`)
      .then(res => res.ok ? res.json() : [])
      .then(events => setEventCount(Array.isArray(events) ? events.length : 0))
      .catch(() => setEventCount(0));

    fetch(`${API_URL}/api/users`)
      .then(res => res.ok ? res.json() : [])
      .then(users => setUserCount(Array.isArray(users) ? users.length : 0))
      .catch(() => setUserCount(0));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <p className="text-muted-foreground">Super user view</p>
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-2 sm:px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventCount === null ? "..." : eventCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userCount === null ? "..." : userCount}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Management</h2>
        <div className="p-8 text-center bg-muted/50 rounded-lg">
          <p>Super admin management panel coming soon.</p>
        </div>
      </div>
    </div>
  );
}
