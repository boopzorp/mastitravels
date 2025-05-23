
"use client";

import { Open_Sans } from 'next/font/google';
import { APIProvider } from '@vis.gl/react-google-maps';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

const openSans = Open_Sans({
  weight: '400', // Default weight, Open Sans supports multiple
  subsets: ['latin'],
  variable: '--font-open-sans', // Corrected CSS variable name
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
    <html lang="en" className={`${openSans.variable}`}> {/* Used correct font variable */}
      <head>
        <title>mastitravels</title>
        <meta name="description" content="Made with ❤ for mi amor." />
      </head>
      <body className={`antialiased`}>
        <AuthProvider>
          <APIProvider apiKey={googleMapsApiKey || ""}>
            {children}
            <Toaster />
          </APIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
