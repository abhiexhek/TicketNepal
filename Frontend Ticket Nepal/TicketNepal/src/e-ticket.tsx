import Image from "next/image";
import type { Ticket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";

interface ETicketProps {
  ticket: Ticket;
}

export function ETicket({ ticket }: ETicketProps) {
  if (!ticket?.event) return null;

  return (
    <div className="bg-card shadow-lg rounded-lg flex flex-col md:flex-row overflow-hidden border transition-all hover:shadow-xl">
      <div className="md:w-1/3 relative min-h-[150px] md:min-h-0">
        <Image
          src={ticket.event.imageUrl || "/fallback-event.png"}
          alt={ticket.event.name || "Event Image"}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <p className="text-sm text-primary font-medium mb-1">
            {ticket.event.category?.toUpperCase()}
          </p>
          <h3 className="font-headline text-2xl font-bold">
            {ticket.event.name}
          </h3>
          <p className="text-muted-foreground mt-1">
            {ticket.event.eventStart
              ? new Date(ticket.event.eventStart).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : ""}
          </p>
        </div>
        <div className="border-t border-dashed my-4"></div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Attendee</p>
            <p className="font-medium">{ticket.userName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Seat(s)</p>
            <p className="font-medium">{ticket.seat}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ticket ID</p>
            <p className="font-medium break-all">{ticket.id}</p>
          </div>
        </div>
      </div>
      <div className="bg-muted/50 p-6 flex flex-col items-center justify-center gap-4 border-l">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden ring-4 ring-background">
          <Image
            src={ticket.qrCodeUrl || "/fallback-qr.png"}
            alt="QR Code"
            width={150}
            height={150}
            className="object-cover"
            priority
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => alert('Share feature coming soon!')}>
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => alert('Download feature coming soon!')}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
}
