"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Tag, Clock, CheckCircle, Ban, Users, Star, AlertCircle, ArrowLeft } from "lucide-react";
import { UserContext } from "@/context/UserContext";
import { toSafeDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ticketsSold, setTicketsSold] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const { currentUser } = useContext(UserContext);
  const { toast } = useToast();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<null | 'PENDING' | 'APPROVED' | 'REJECTED'>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (res.ok) {
          const eventData = await res.json();
          setEvent(eventData);
          
          // Check if event is expired
          const now = new Date();
          const eventEnd = eventData.eventEnd ? new Date(eventData.eventEnd) : null;
          const isExpiredEvent = eventEnd ? now > eventEnd : false;
          setIsExpired(isExpiredEvent);
          
          // Fetch ticket sales
          try {
            const ticketsResponse = await fetch(`${API_URL}/api/tickets/reserved?eventId=${id}`);
            if (ticketsResponse.ok) {
              const ticketsData = await ticketsResponse.json();
              setTicketsSold(ticketsData.reservedSeats?.length || 0);
            }
          } catch (error) {
            console.error('Failed to fetch ticket sales:', error);
          }
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

  // Check staff application status for this event
  useEffect(() => {
    const checkStatus = async () => {
      if (!id || !currentUser || currentUser.role !== "Staff") return;
      setCheckingStatus(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/events/staff/${currentUser.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const apps = await res.json();
          const app = apps.find((a: any) => a.id === id);
          setApplicationStatus(app ? app.status : null);
        } else {
          setApplicationStatus(null);
        }
      } catch {
        setApplicationStatus(null);
      }
      setCheckingStatus(false);
    };
    checkStatus();
  }, [id, currentUser]);

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

  const getEventStatus = () => {
    if (isExpired) return { status: 'expired', color: 'bg-red-100 text-red-700', text: 'Event Ended' };
    
    const now = new Date();
    const eventStart = event.eventStart ? new Date(event.eventStart) : null;
    const eventEnd = event.eventEnd ? new Date(event.eventEnd) : null;
    
    if (eventStart && now < eventStart) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-700', text: 'Upcoming' };
    } else if (eventEnd && now > eventEnd) {
      return { status: 'expired', color: 'bg-red-100 text-red-700', text: 'Event Ended' };
    } else {
      return { status: 'ongoing', color: 'bg-green-100 text-green-700', text: 'Live Now' };
    }
  };

  const eventStatus = getEventStatus();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button asChild variant="ghost" className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </div>

          <Card className="overflow-hidden shadow-xl border-0">
            {/* Event Image */}
            <div className="relative h-80 md:h-96">
              <img
                src={event.imageUrl?.startsWith("http") ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${event.imageUrl}`}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Status Badge */}
              <div className="absolute top-6 left-6">
                <Badge className={`${eventStatus.color} font-semibold`}>
                  {eventStatus.text}
                </Badge>
              </div>
              
              {/* Price Badge */}
              <div className="absolute top-6 right-6">
                <Badge className="bg-white/90 text-black font-bold text-lg px-4 py-2">
                  ₨{event.price?.toFixed(0) || '0'}
                </Badge>
              </div>
              
              {/* Event Title Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.name}</h1>
                <div className="flex items-center gap-4 text-white/90">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {event.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {ticketsSold} sold
                  </span>
                </div>
              </div>
            </div>

            <CardContent className="p-8">
              {/* Event Details Grid */}
              <div className="grid gap-8 md:grid-cols-3 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">Event Date</div>
                      <div className="text-sm text-muted-foreground">
                        {event.eventStart ? (() => { 
                          const d = toSafeDate(event.eventStart); 
                          return d ? d.toLocaleString("en-US", { 
                            weekday: "long",
                            year: "numeric", 
                            month: "long", 
                            day: "numeric", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          }) : 'TBD' 
                        })() : 'TBD'}
                      </div>
                    </div>
                  </div>
                  
                  {event.eventEnd && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">Ends</div>
                        <div className="text-sm text-muted-foreground">
                          {(() => { 
                            const d = toSafeDate(event.eventEnd); 
                            return d ? d.toLocaleString("en-US", { 
                              year: "numeric", 
                              month: "long", 
                              day: "numeric", 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            }) : '' 
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">Location</div>
                      <div className="text-sm text-muted-foreground">{event.location}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">Tickets Sold</div>
                      <div className="text-sm text-muted-foreground">
                        {ticketsSold} / {event.seats?.length || 0} seats
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">Organizer</div>
                      <div className="text-sm text-muted-foreground">
                        {typeof event.organizer === 'string' ? event.organizer : event.organizer.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">Category</div>
                      <div className="text-sm text-muted-foreground">{event.category}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">About This Event</h3>
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                {isExpired ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">This event has ended</span>
                  </div>
                ) : (!currentUser || currentUser.role === "Customer") ? (
                  <Button asChild size="lg" className="px-8">
                    <Link href={`/events/${event.id}/book`}>
                      Book Ticket
                    </Link>
                  </Button>
                ) : currentUser && currentUser.role === "Staff" ? (
                  <>
                    {checkingStatus ? (
                      <Button disabled>Checking status...</Button>
                    ) : applicationStatus === null ? (
                      <Button
                        onClick={async () => {
                          setApplying(true);
                          try {
                            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                            const token = localStorage.getItem('authToken');
                            const response = await fetch(`${API_URL}/api/events/${event.id}/apply-staff`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                              body: JSON.stringify({ staffId: currentUser.id }),
                            });
                            if (response.ok) {
                              toast({ title: 'Applied as Staff', description: 'Your application has been sent to the organizer.' });
                              setApplicationStatus('PENDING');
                            } else {
                              const err = await response.json();
                              toast({ title: 'Error', description: err.error || err.message || 'Failed to apply as staff.', variant: 'destructive' });
                            }
                          } catch (error) {
                            toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
                          }
                          setApplying(false);
                        }}
                        disabled={applying}
                        size="lg"
                      >
                        {applying ? 'Applying...' : 'Apply as Staff'}
                      </Button>
                    ) : applicationStatus === 'PENDING' ? (
                      <Button disabled variant="outline" size="lg">
                        <Clock className="w-4 h-4 mr-2 text-yellow-500" /> 
                        Pending Approval
                      </Button>
                    ) : applicationStatus === 'APPROVED' ? (
                      <Button disabled variant="outline" size="lg">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> 
                        Approved
                      </Button>
                    ) : applicationStatus === 'REJECTED' ? (
                      <Button disabled variant="destructive" size="lg">
                        <Ban className="w-4 h-4 mr-2 text-red-500" /> 
                        Rejected
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
