"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Tag, Clock, CheckCircle, Ban } from "lucide-react";
import { UserContext } from "@/context/UserContext";
import { toSafeDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (res.ok) {
          setEvent(await res.json());
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
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{event.name}</CardTitle>
              <div className="flex gap-4 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1"><Tag className="w-4 h-4" />{event.category}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{event.eventStart ? (() => { const d = toSafeDate(event.eventStart); return d ? d.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : '' })() : ''}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <img
                  src={event.imageUrl?.startsWith("http") ? event.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${event.imageUrl}`}
                  alt={event.name}
                  className="w-full max-h-80 object-cover rounded-lg border"
                />
              </div>
              <div className="mb-4 text-lg">{event.description}</div>
              {event.eventEnd && (
                <div className="mb-2 text-sm text-muted-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Ends: {(() => { const d = toSafeDate(event.eventEnd); return d ? d.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : '' })()}</span>
                </div>
              )}
              <div className="mb-2 text-sm text-muted-foreground">Price: <b>Rs. {event.price}</b></div>
              <div className="mb-2 text-sm text-muted-foreground">Total Seats: <b>{event.seats?.length || 0}</b></div>
              <div className="mb-2 text-sm text-muted-foreground">Organizer: <b>{event.organizer}</b></div>
            </CardContent>
            <div className="flex justify-end p-6 pt-0 gap-2">
              {(!currentUser || currentUser.role === "Customer") && (
                <Button asChild>
                  <Link href={`/events/${event.id}/book`}>
                    Book Ticket
                  </Link>
                </Button>
              )}
              {currentUser && currentUser.role === "Staff" && (
                <>
                  {checkingStatus ? (
                    <Button disabled>Checking status...</Button>
                  ) : applicationStatus === null ? (
                    <Button
                      onClick={async () => {
                        setApplying(true);
                        try {
                          const API_URL = process.env.NEXT_PUBLIC_API_URL;
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
                    >
                      {applying ? 'Applying...' : 'Apply as Staff'}
                    </Button>
                  ) : applicationStatus === 'PENDING' ? (
                    <Button disabled variant="outline"><Clock className="w-4 h-4 mr-2 text-yellow-500" /> Pending Approval</Button>
                  ) : applicationStatus === 'APPROVED' ? (
                    <Button disabled variant="outline"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Approved</Button>
                  ) : applicationStatus === 'REJECTED' ? (
                    <Button disabled variant="destructive"><Ban className="w-4 h-4 mr-2 text-red-500" /> Rejected</Button>
                  ) : null}
                </>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
