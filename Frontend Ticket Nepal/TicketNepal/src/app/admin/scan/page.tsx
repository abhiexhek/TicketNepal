'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, XCircle, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import type { Ticket as TicketType } from '@/lib/types';
import { BrowserQRCodeReader } from '@zxing/browser';

interface VerifiedTicket extends TicketType {
  checkedIn?: boolean;
  qrCodeHint?: string;
}

interface GroupValidationResult {
  event: any;
  tickets: Array<{ ticketId: string; seat: string; checkedIn: boolean }>;
  transactionId: string;
}

export default function ScanTicketPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningError, setScanningError] = useState<string | null>(null);
  const qrReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const [scannedTicket, setScannedTicket] = useState<VerifiedTicket | null>(null);
  const [isValidTicket, setIsValidTicket] = useState<boolean | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [groupResult, setGroupResult] = useState<GroupValidationResult | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkedInTickets, setCheckedInTickets] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const verifyTicket = useCallback(async (qrHint: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem('authToken');
      // Clean the scanned value
      const cleanHint = qrHint.trim();
      
      // Use the new unified endpoint
      const response = await fetch(`${API_URL}/api/tickets/validate/scan?code=${encodeURIComponent(cleanHint)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.type === 'multiple') {
          setGroupResult(data);
          setScannedTicket(null);
          setIsValidTicket(true);
          toast({
            title: "Group Ticket Verified!",
            description: `Transaction contains ${data.tickets.length} seats.`,
            variant: "default"
          });
        } else if (data.type === 'single') {
          setScannedTicket(data.ticket);
          setGroupResult(null);
          setIsValidTicket(true);
          toast({
            title: "Ticket Verified!",
            description: `Ticket ID: ${data.ticket.id}`,
            variant: "default"
          });
        } else {
          setGroupResult(null);
          setScannedTicket(null);
          setIsValidTicket(false);
          toast({ title: "Invalid QR Code", description: "This QR code is not valid for ticket validation.", variant: "destructive" });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        setGroupResult(null);
        setScannedTicket(null);
        setIsValidTicket(false);
        
        let errorMessage = "This QR code is not valid for ticket validation.";
        if (response.status === 403) {
          errorMessage = "You are not authorized to validate tickets for this event. Please ensure you have been approved as staff for this specific event by the event organizer.";
        } else if (response.status === 404) {
          errorMessage = "Ticket not found. Please check the QR code.";
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        toast({ 
          title: "Validation Failed", 
          description: errorMessage, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      setGroupResult(null);
      setIsValidTicket(false);
      setScannedTicket(null);
      toast({ 
        title: "Error", 
        description: "Could not verify ticket. Please check your connection.", 
        variant: "destructive" 
      });
    }
  }, [toast]);

  const checkInTicket = async (ticketId: string, qrCodeHint?: string) => {
    setIsCheckingIn(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/tickets/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ticketId: ticketId,
          ...(qrCodeHint && { qrCodeHint: qrCodeHint })
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setCheckedInTickets(prev => new Set(prev).add(ticketId));
        toast({
          title: "Ticket Checked In!",
          description: data.message || "Ticket has been successfully checked in.",
          variant: "default"
        });
        
        // Refresh the verification data to show updated checked-in status
        if (qrCodeHint) {
          verifyTicket(qrCodeHint);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        let errorMessage = "Could not check in ticket.";
        if (response.status === 403) {
          errorMessage = "You are not authorized to check in tickets for this event. Please ensure you have been approved as staff for this specific event by the event organizer.";
        } else if (response.status === 404) {
          errorMessage = "Ticket not found.";
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        toast({
          title: "Check-in Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server.",
        variant: "destructive"
      });
    }
    setIsCheckingIn(false);
  };

  const checkInGroupTickets = async () => {
    if (!groupResult) return;
    
    setIsCheckingIn(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem('authToken');
      
      // Check in all tickets in the group
      const checkInPromises = groupResult.tickets
        .filter(ticket => !ticket.checkedIn)
        .map(ticket => 
          fetch(`${API_URL}/api/tickets/checkin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              ticketId: ticket.ticketId,
              qrCodeHint: groupResult.transactionId
            }),
          })
        );

      const responses = await Promise.all(checkInPromises);
      const allSuccessful = responses.every(response => response.ok);
      
      if (allSuccessful) {
        // Mark all tickets as checked in
        const ticketIds = groupResult.tickets.map(t => t.ticketId);
        setCheckedInTickets(prev => new Set([...prev, ...ticketIds]));
        
        toast({
          title: "Group Checked In!",
          description: `All ${groupResult.tickets.length} tickets have been checked in.`,
          variant: "default"
        });
        
        // Refresh the verification data
        verifyTicket(groupResult.transactionId);
      } else {
        toast({
          title: "Check-in Failed",
          description: "Some tickets could not be checked in.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server.",
        variant: "destructive"
      });
    }
    setIsCheckingIn(false);
  };

  useEffect(() => {
    if (!isScanning) return;
    let active = true;
    setScanningError(null);
    const getCameraAndScan = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        const qrReader = new BrowserQRCodeReader();
        qrReaderRef.current = qrReader;
        const videoElem = videoRef.current;
        if (!videoElem) return;
        // Start decoding from video
        qrReader.decodeFromVideoDevice(
          undefined,
          videoElem,
          (result: any, err: any, controls: any) => {
            if (!active) return;
            if (result) {
              setScanResult(result.getText());
              verifyTicket(result.getText());
              setIsScanning(false);
              controls.stop();
            }
            if (err && err.name !== 'NotFoundException') {
              setScanningError('QR scan error: ' + err.message);
            }
          }
        );
        setHasCameraPermission(true);
      } catch (error: any) {
        setHasCameraPermission(false);
        setScanningError(error?.message || 'Camera error');
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use the scanner.',
        });
      }
    };
    getCameraAndScan();
    return () => {
      active = false;
    };
  }, [isScanning, verifyTicket, toast]);

  const handleManualScan = () => {
    const manualCode = prompt("Enter QR code manually:");
    if (manualCode) {
      verifyTicket(manualCode);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setIsValidTicket(null);
    setScannedTicket(null);
    setGroupResult(null);
    setCheckedInTickets(new Set());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold">QR Code Scanner</h1>

      {/* Scanner controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-2 w-full">
        {!isScanning ? (
          <Button onClick={() => setIsScanning(true)} className="w-full sm:w-auto">
            Open Scanner
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => {
            setIsScanning(false);
            if (qrReaderRef.current) {
              if (typeof (qrReaderRef.current as any).reset === 'function') {
                (qrReaderRef.current as any).reset();
              } else if (typeof (qrReaderRef.current as any).stopContinuousDecode === 'function') {
                (qrReaderRef.current as any).stopContinuousDecode();
              }
              qrReaderRef.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
              (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
              videoRef.current.srcObject = null;
            }
          }} className="w-full sm:w-auto">
            Close Scanner
          </Button>
        )}
        <Button onClick={handleManualScan} variant="outline" className="w-full sm:w-auto">
          Manual Entry
        </Button>
        {(isValidTicket !== null) && (
          <Button onClick={resetScan} variant="outline" className="w-full sm:w-auto">
            Scan New Ticket
          </Button>
        )}
      </div>
      {scanningError && <div className="text-red-500 text-center mb-4">{scanningError}</div>}

      {/* Video preview */}
      {isScanning && (
        <video ref={videoRef} className="w-full mb-6 rounded" autoPlay muted playsInline />
      )}

      {/* Ticket validation results */}
      {isValidTicket !== null && (
        <Alert variant={isValidTicket ? "default" : "destructive"} className="mb-6">
          {isValidTicket ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <AlertTitle>Ticket Verified</AlertTitle>
              <AlertDescription>
                {groupResult && (
                  <div>
                    <div className="font-semibold mb-2">Event: {groupResult.event?.name}</div>
                    <div className="mb-2">Transaction ID: {groupResult.transactionId}</div>
                    <div className="font-semibold mb-1">Seats:</div>
                    <ul className="text-sm mb-4">
                      {groupResult.tickets.map((t) => (
                        <li key={t.ticketId} className="flex justify-between items-center py-1">
                          <span>Seat: <b>{t.seat}</b></span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            t.checkedIn || checkedInTickets.has(t.ticketId) 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {t.checkedIn || checkedInTickets.has(t.ticketId) ? '✓ Checked In' : 'Pending Check-in'}
                          </span>
                          <span className="text-xs text-muted-foreground">ID: {t.ticketId}</span>
                        </li>
                      ))}
                    </ul>
                    {groupResult.tickets.some(t => !t.checkedIn && !checkedInTickets.has(t.ticketId)) && (
                      <Button 
                        onClick={checkInGroupTickets} 
                        disabled={isCheckingIn}
                        className="w-full"
                      >
                        {isCheckingIn ? (
                          <>Checking In...</>
                        ) : (
                          <>
                            <Users className="mr-2 h-4 w-4" />
                            Check In All Tickets
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
                {scannedTicket && (
                  <div>
                    <div className="font-semibold mb-2">Ticket ID: {scannedTicket.id}</div>
                    <div><strong>User Name:</strong> {scannedTicket.userName}</div>
                    <div><strong>Seat:</strong> {scannedTicket.seat}</div>
                    <div><strong>Event ID:</strong> {String(scannedTicket.eventId)}</div>
                    <div className="mt-2">
                      <strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        scannedTicket.checkedIn || checkedInTickets.has(scannedTicket.id)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {scannedTicket.checkedIn || checkedInTickets.has(scannedTicket.id) 
                          ? '✓ Checked In' 
                          : 'Pending Check-in'
                        }
                      </span>
                    </div>
                    {!scannedTicket.checkedIn && !checkedInTickets.has(scannedTicket.id) && (
                      <Button 
                        onClick={() => checkInTicket(scannedTicket.id, scannedTicket.qrCodeHint)}
                        disabled={isCheckingIn}
                        className="w-full mt-3"
                      >
                        {isCheckingIn ? (
                          <>Checking In...</>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Check In Ticket
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </AlertDescription>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <AlertTitle>Invalid or Legacy QR Code</AlertTitle>
              <AlertDescription>
                This QR code is not valid for ticket validation. Please use a new QR code.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Show ticket info if valid */}
      {isValidTicket && scannedTicket && (
        <Card>
          <CardContent className="p-4">
            <div>
              <div><strong>Ticket ID:</strong> {scannedTicket.id}</div>
              <div><strong>User Name:</strong> {scannedTicket.userName}</div>
              <div><strong>Seat:</strong> {scannedTicket.seat}</div>
              <div><strong>Event ID:</strong> {String(scannedTicket.eventId)}</div>
              {/* Always use String(id) when passing IDs */}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
