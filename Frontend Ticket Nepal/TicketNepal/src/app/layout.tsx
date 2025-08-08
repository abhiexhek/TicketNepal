import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'TicketNepal - Professional Event Management',
  description: 'Discover and book events seamlessly with our professional event management platform',
  keywords: 'events, tickets, booking, nepal, professional',
  authors: [{ name: 'TicketNepal Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
