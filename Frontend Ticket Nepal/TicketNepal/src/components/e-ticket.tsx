
import Image from "next/image"
import type { Ticket } from "@/lib/types"
import { Button } from "./ui/button"
import { Download } from "lucide-react"
import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ETicketProps {
  ticket: Ticket;
}

export function ETicket({ ticket }: ETicketProps) {
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const [qrOpen, setQrOpen] = useState(false);
  if (!ticket.event) return null;

  // Fix event image URL
  let eventImageUrl = ticket.event.imageUrl;
  if (eventImageUrl) {
    eventImageUrl = eventImageUrl.startsWith("http")
      ? eventImageUrl
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${eventImageUrl}`;
  } else {
    eventImageUrl = "";
  }

  // Fix QR code image URL
  let qrCodeUrl = ticket.qrCodeUrl;
  if (qrCodeUrl) {
    qrCodeUrl = qrCodeUrl.startsWith("http")
      ? qrCodeUrl
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${qrCodeUrl}`;
  } else {
    qrCodeUrl = "";
  }

  // Download QR code handler
  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-qr-${ticket.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download QR code.');
    }
  };

  return (
    <div className="bg-card shadow-lg rounded-xl flex flex-col overflow-hidden border transition-all hover:shadow-xl w-full max-w-md mx-auto my-2 md:my-4" style={{minWidth:0}}>
      <div className="relative w-full h-48 min-h-[120px]">
        {eventImageUrl ? (
          <Image 
            src={eventImageUrl}
            alt={ticket.event.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="text-red-500 text-xs flex items-center justify-center h-full">Event image unavailable</div>
        )}
      </div>
      <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-xs sm:text-sm text-primary font-medium mb-1">{ticket.event.category.toUpperCase()}</p>
          <h3 className="font-headline text-lg sm:text-2xl font-bold mb-1">{ticket.event.name}</h3>
          <p className="text-muted-foreground text-xs sm:text-base mb-2">
            {ticket.event.eventStart
              ? new Date(ticket.event.eventStart).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : ''}
          </p>
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className="inline-block px-2 py-1 text-xs bg-muted rounded font-mono text-muted-foreground">Seat: <b>{ticket.seat}</b></span>
            <span className="inline-block px-2 py-1 text-xs bg-muted rounded font-mono text-muted-foreground">Attendee: <b>{ticket.userName}</b></span>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ticket ID:</span>
            <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary font-mono rounded break-all max-w-[160px] md:max-w-[200px] truncate">{ticket.id}</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 mt-4">
          {qrCodeUrl ? (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden ring-4 ring-background cursor-pointer" onClick={() => setQrOpen(true)}>
              <Image 
                src={qrCodeUrl}
                alt="QR Code"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="text-red-500 text-xs">QR code unavailable</div>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={!qrCodeUrl}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </div>
        {/* QR Code Fullscreen Dialog */}
        <Dialog open={qrOpen} onOpenChange={setQrOpen}>
          <DialogContent className="flex flex-col items-center justify-center">
            <DialogTitle>
              <VisuallyHidden>Ticket Details</VisuallyHidden>
            </DialogTitle>
            {qrCodeUrl ? (
              <Image
                src={qrCodeUrl}
                alt="QR Code Fullscreen"
                width={400}
                height={400}
                className="object-contain rounded-lg"
                unoptimized
              />
            ) : (
              <div className="text-red-500 text-xs">QR code unavailable</div>
            )}
            <div className="mt-2 text-center text-muted-foreground text-xs">Click outside or press ESC to close</div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
