import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Tag, ArrowRight } from "lucide-react";

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
    process.env.NEXT_PUBLIC_API__URL || "http://localhost:8080";

  // Compute full image URL
  const imageUrl = event.imageUrl?.startsWith("http")
    ? event.imageUrl
    : `${API_BASE}${event.imageUrl || ""}`;

  // Status logic
  let status = null;
  let statusColor = '';
  if (event.eventEnd) {
    const now = new Date();
    if (now <= new Date(event.eventEnd)) {
      status = 'Active';
      statusColor = 'bg-green-500';
    } else {
      status = 'Expired';
      statusColor = 'bg-red-500';
    }
  }

  return (
    <Card className={`flex flex-col overflow-hidden h-full max-w-sm w-full mx-auto transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative ${status === 'Expired' ? 'pointer-events-none opacity-70' : ''}`}>
      {status && (
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`}></span>
          <span className={`text-xs font-semibold ${status === 'Active' ? 'text-green-700' : 'text-red-700'}`}>{status}</span>
        </div>
      )}
      <div className="block overflow-hidden relative">
        <div className="relative w-full h-48 bg-gray-100">
          <Image
            src={imageUrl}
            alt={event.name}
            fill
            className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
            unoptimized
            priority
          />
          <Badge variant="secondary" className="absolute top-2 right-2 text-base">{`₨${event.price}`}</Badge>
        </div>
        {status === 'Expired' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <span className="text-lg font-bold text-white">Event Expired</span>
          </div>
        )}
      </div>
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="font-headline text-lg sm:text-xl md:text-2xl h-12 sm:h-14 line-clamp-2">
          <Link href={`/events/${event.id}`} className="hover:text-primary transition-colors">{event.name}</Link>
        </CardTitle>
        <CardDescription className="flex items-center pt-1 sm:pt-2 text-xs sm:text-sm">
          <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
          {event.category}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-2">
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              {event.eventStart ? toSafeDate(event.eventStart).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ''}
            </span>
          </div>
          {event.eventEnd && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Ends: {toSafeDate(event.eventEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">
              {event.location}{event.city ? `, ${event.city}` : ""}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-3 sm:px-4 pb-3 sm:pb-4 mt-auto">
        <Button asChild className="w-full text-xs sm:text-sm md:text-base">
          <Link href={`/events/${event.id}`}>
            View Event <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
