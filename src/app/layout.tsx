
"use client";

import { Gamja_Flower } from 'next/font/google';
import { APIProvider } from '@vis.gl/react-google-maps';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

const gamjaFlower = Gamja_Flower({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gamja-flower',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    console.warn("Google Maps API Key is not set. Maps functionality will be limited.");
  }
  
  return (
    <html lang="en" className={`${gamjaFlower.variable}`}>
      <head>
        <title>mastitravels</title>
        <meta name="description" content="Made with ❤ for mi amor." />
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <APIProvider apiKey={googleMapsApiKey || ""}>
            {children}
            <Toaster />
          </APIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
