
"use client";

import { Open_Sans } from 'next/font/google'; // Changed from Gamja_Flower
import { APIProvider } from '@vis.gl/react-google-maps';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

const openSans = Open_Sans({ // Changed from gamjaFlower
  weight: '400', // Default weight
  subsets: ['latin'],
  variable: '--font-open-sans', // Updated CSS variable name
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
    <html lang="en" className={`${openSans.variable}`}> {/* Used updated font variable */}
      <head>
        <title>mastitravels</title>
        <meta name="description" content="Made with ❤ for mi amor." />
      </head>
      <body className={`antialiased`}> {/* Removed font-sans here previously */}
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
