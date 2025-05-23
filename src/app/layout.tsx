"use client";

import { Gamja_Flower } from 'next/font/google';
import { APIProvider } from '@vis.gl/react-google-maps';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const gamjaFlower = Gamja_Flower({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gamja-flower',
  display: 'swap',
});

// Metadata should be defined in Server Components or page.tsx files
// export const metadata: Metadata = {
//   title: 'Bangalore Buddy',
//   description: 'Find recommendations for your friend in Bangalore!',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    // This check is primarily for development; build might fail or app might misbehave without it.
    // In a real app, you might have a fallback or a more user-friendly message.
    console.warn("Google Maps API Key is not set. Maps functionality will be limited.");
  }
  
  return (
    <html lang="en" className={`${gamjaFlower.variable}`}>
      <head>
        {/* You can add static meta tags here if needed, or manage dynamically in page.tsx files */}
        <title>MastiTravels</title>
        <meta name="description" content="Plan your MastiTravels adventures!" />
      </head>
      <body className={`font-sans antialiased`}>
        <APIProvider apiKey={googleMapsApiKey || ""}>
          {children}
          <Toaster />
        </APIProvider>
      </body>
    </html>
  );
}
