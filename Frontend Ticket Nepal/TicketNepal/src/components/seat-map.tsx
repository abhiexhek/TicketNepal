"use client";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface SeatMapProps {
  seats?: string[];
  selectedSeats?: string[];
  reservedSeats?: string[];
  onToggleSeat: (seatId: string) => void;
}

const SEAT_ROWS = 8;
const SEATS_PER_ROW = 12;

export function SeatMap({
  seats = [],
  selectedSeats = [],
  reservedSeats = [],
  onToggleSeat,
}: SeatMapProps) {
  const toggleSeat = (seatId: string) => {
    if (reservedSeats.includes(seatId)) {
      toast({
        title: "Seat Unavailable",
        description: "This seat has already been purchased.",
        variant: "destructive",
      });
      return;
    }
    onToggleSeat(seatId);
  };

  if (seats.length > 0) {
    // Render from provided seat IDs
    return (
      <div className="flex flex-wrap gap-2 justify-center p-2 sm:p-4 bg-muted/30 rounded-lg overflow-x-auto max-w-full">
        {seats.map((seatId) => {
          const isReserved = reservedSeats.includes(seatId);
          const isSelected = selectedSeats.includes(seatId);
          return (
            <Button
              key={seatId}
              variant="outline"
              size="icon"
              disabled={isReserved}
              className={cn(
                "transition-all duration-200 text-xs sm:text-sm h-8 w-10 sm:h-8 sm:w-12 md:h-10 md:w-16 lg:h-12 lg:w-20 border-2",
                isReserved && "bg-destructive/70 text-destructive-foreground cursor-not-allowed border-red-600 border-2",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                !isReserved && !isSelected && "hover:bg-primary/20"
              )}
              onClick={() => toggleSeat(seatId)}
              aria-label={`Seat ${seatId}`}
            >
              {seatId}
              {isReserved && <Lock className="inline-block w-3 h-3 ml-1 text-destructive-foreground align-middle" />}
            </Button>
          );
        })}
      </div>
    );
  }

  // Fallback: default grid
  return (
    <div className="flex flex-col items-center gap-4 p-2 sm:p-4 bg-muted/30 rounded-lg overflow-x-auto max-w-full">
      <div className="w-full max-w-md h-8 bg-foreground/80 rounded-t-full text-center text-background font-medium flex items-center justify-center">
        STAGE
      </div>
      <div className="flex flex-col gap-2 min-w-[340px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px]">
        {Array.from({ length: SEAT_ROWS }).map((_, rowIndex) => {
          const rowLabel = String.fromCharCode(65 + rowIndex);
          return (
            <div key={rowIndex} className="flex items-center gap-2">
              <span className="w-6 text-center font-medium text-muted-foreground">{rowLabel}</span>
              <div className="flex gap-2">
                {Array.from({ length: SEATS_PER_ROW }).map((_, seatIndex) => {
                  const seatId = `${rowLabel}${seatIndex + 1}`;
                  const isReserved = reservedSeats.includes(seatId);
                  const isSelected = selectedSeats.includes(seatId);
                  return (
                    <Button
                      key={seatId}
                      variant="outline"
                      size="icon"
                      disabled={isReserved}
                      className={cn(
                        "transition-all duration-200 text-xs sm:text-sm h-8 w-8 sm:h-8 sm:w-10 md:h-10 md:w-12 lg:h-12 lg:w-16 border-2",
                        isReserved && "bg-destructive/70 text-destructive-foreground cursor-not-allowed border-red-600 border-2",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                        !isReserved && !isSelected && "hover:bg-primary/20"
                      )}
                      onClick={() => toggleSeat(seatId)}
                      aria-label={`Seat ${seatId}`}
                    >
                      {seatIndex + 1}
                      {isReserved && <Lock className="inline-block w-3 h-3 ml-1 text-destructive-foreground align-middle" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}