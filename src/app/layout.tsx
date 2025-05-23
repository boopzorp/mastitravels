
"use client";

<<<<<<< HEAD
import { Jua } from 'next/font/google'; // Changed from Open_Sans
=======
import { Open_Sans } from 'next/font/google'; // Changed from Jua
>>>>>>> 5540cbf (Can you update it to Open Sans?)
import { APIProvider } from '@vis.gl/react-google-maps';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

<<<<<<< HEAD
const jua = Jua({ // Changed from openSans
  weight: '400', // Jua typically has a single '400' weight
=======
const openSans = Open_Sans({ // Changed from jua
  weight: '400', // Default weight, Open Sans supports multiple
>>>>>>> 5540cbf (Can you update it to Open Sans?)
  subsets: ['latin'],
  variable: '--font-jua', // Updated CSS variable name
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
    <html lang="en" className={`${jua.variable}`}> {/* Used updated font variable */}
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
