'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import type { Ticket as TicketType } from '@/lib/types';
import { BrowserQRCodeReader } from '@zxing/browser';

interface VerifiedTicket extends TicketType {}

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
  const { toast } = useToast();

  const verifyTicket = useCallback(async (qrHint: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
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
        setGroupResult(null);
        setScannedTicket(null);
        setIsValidTicket(false);
        toast({ title: "Invalid or Legacy QR Code", description: "This QR code is not valid for ticket validation. Please use a new QR code.", variant: "destructive" });
      }
    } catch (error) {
      setGroupResult(null);
      setIsValidTicket(false);
      setScannedTicket(null);
      toast({ title: "Error", description: "Could not verify ticket.", variant: "destructive" });
    }
  }, [toast]);

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
    };
  }, [isScanning, toast, verifyTicket]);

  const handleManualScan = () => {
    if (scanResult) {
      verifyTicket(scanResult);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-2 sm:px-4">
      <Link href="/admin">
        <Button variant="ghost" className="mb-4 w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-6 text-center">Scan Ticket QR Code</h1>

      {/* Manual QR input (for testing without real scanner) */}
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-6 w-full">
        <input
          type="text"
          value={scanResult ?? ""}
          onChange={e => setScanResult(e.target.value)}
          placeholder="Paste QR code hint here or scan"
          className="p-2 border rounded w-full"
        />
        <Button onClick={handleManualScan} disabled={!scanResult} className="w-full sm:w-auto mt-2 sm:mt-0">
          Scan
        </Button>
      </div>

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
                    <ul className="text-sm">
                      {groupResult.tickets.map((t) => (
                        <li key={t.ticketId} className="flex justify-between">
                          <span>Seat: <b>{t.seat}</b></span>
                          <span className="text-xs text-muted-foreground">Checked in: {t.checkedIn ? 'Yes' : 'No'}</span>
                          <span className="text-xs text-muted-foreground">Ticket ID: {t.ticketId}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {scannedTicket && (
                  <div>
                    <div className="font-semibold mb-2">Ticket ID: {scannedTicket.id}</div>
                    <div><strong>User Name:</strong> {scannedTicket.userName}</div>
                    <div><strong>Seat:</strong> {scannedTicket.seat}</div>
                    <div><strong>Event ID:</strong> {String(scannedTicket.eventId)}</div>
                    {/* Always use String(id) when passing IDs */}
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
