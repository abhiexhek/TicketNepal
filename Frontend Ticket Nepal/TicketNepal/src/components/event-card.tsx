import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Tag, ArrowRight, Clock, Users, Star } from "lucide-react";

import type { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { toSafeDate } from "@/lib/utils";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  // Get backend API base URL from env, fallback to localhost for dev
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Compute full image URL
  const imageUrl = event.imageUrl?.startsWith("http")
    ? event.imageUrl
    : `${API_BASE}${event.imageUrl || ""}`;

  // Status logic
  let status = null;
  let statusColor = '';
  let statusText = '';
  
  if (event.eventEnd) {
    const now = new Date();
    const eventEnd = new Date(event.eventEnd);
    const eventStart = new Date(event.eventStart);
    
    if (now > eventEnd) {
      status = 'expired';
      statusColor = 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      statusText = 'Expired';
    } else if (now >= eventStart && now <= eventEnd) {
      status = 'ongoing';
      statusColor = 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      statusText = 'Live Now';
    } else if (now < eventStart) {
      status = 'upcoming';
      statusColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      statusText = 'Upcoming';
    }
  }

  // Calculate time until event
  const getTimeUntilEvent = () => {
    if (!event.eventStart) return null;
    const now = new Date();
    const eventStart = new Date(event.eventStart);
    const diffTime = eventStart.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  };

  const timeUntilEvent = getTimeUntilEvent();

  return (
    <Card className="card-interactive group h-full flex flex-col overflow-hidden">
      {/* Image Section */}
      <div className="relative overflow-hidden">
        <div className="aspect-video relative bg-muted">
          <Image
            src={imageUrl}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
            priority
          />
          {/* Overlay for expired events */}
          {status === 'expired' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <Clock className="h-8 w-8 text-white mx-auto mb-2" />
                <span className="text-white font-semibold">Event Expired</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        {status && (
          <div className="absolute top-3 left-3">
            <Badge className={statusColor}>
              {statusText}
            </Badge>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-background/90 text-foreground font-semibold">
            ₨{event.price?.toFixed(2) || '0.00'}
          </Badge>
        </div>
        
        {/* Time until event */}
        {timeUntilEvent && status === 'upcoming' && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {timeUntilEvent}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              <Link href={`/events/${event.id}`} className="hover:underline">
                {event.name}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" />
              <span className="truncate">{event.category}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 flex-1">
        <div className="space-y-3">
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              {event.eventStart ? (
                <div>
                  <div className="font-medium">
                    {toSafeDate(event.eventStart)?.toLocaleDateString("en-US", { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {toSafeDate(event.eventStart)?.toLocaleTimeString("en-US", { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">Date TBD</span>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-muted-foreground">
              {event.location}{event.city ? `, ${event.city}` : ""}
            </span>
          </div>

          {/* Event Details */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{event.ticketsSold || 0} tickets sold</span>
            </div>
            {event.organizer && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span className="truncate max-w-20">{typeof event.organizer === 'string' ? event.organizer : event.organizer.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-2">
        <Button 
          asChild 
          className="w-full group-hover:bg-primary/90 transition-colors"
          disabled={status === 'expired'}
        >
          <Link href={`/events/${event.id}`}>
            {status === 'expired' ? 'Event Ended' : 'View Details'}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
