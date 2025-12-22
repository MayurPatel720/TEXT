import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { TransitionProvider } from "@/context/TransitionContext";
import PageTransition from "@/components/PageTransition";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabricdesigner.ai';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FabricDesigner.AI - AI-Powered Textile & Fabric Design Studio",
    template: "%s | FabricDesigner.AI"
  },
  description: "Transform reference images into professional, print-ready textile and fabric designs in seconds. AI-powered pattern generation for manufacturers, designers, and textile professionals.",
  keywords: [
    "fabric design AI",
    "textile design generator",
    "AI fabric pattern maker",
    "textile AI studio",
    "print-ready fabric designs",
    "fabric pattern generator",
    "textile design tool",
    "AI textile patterns",
    "fabric designer online",
    "textile manufacturing AI",
    "seamless pattern maker",
    "textile design software",
    "fabric design automation",
    "AI pattern generation",
    "professional textile design"
  ],
  authors: [{ name: "FabricDesigner.AI Team" }],
  creator: "FabricDesigner.AI",
  publisher: "FabricDesigner.AI",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "FabricDesigner.AI",
    title: "FabricDesigner.AI - AI-Powered Textile & Fabric Design Studio",
    description: "Transform reference images into professional, print-ready textile designs in seconds. AI-powered pattern generation for textile professionals.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "FabricDesigner.AI - AI Textile Design Platform",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "FabricDesigner.AI - AI-Powered Textile Design Studio",
    description: "Transform reference images into professional, print-ready textile designs with AI. Professional quality patterns in seconds.",
    images: [`${siteUrl}/twitter-image.png`],
    creator: "@fabricdesignerai",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add your verification codes when ready)
  verification: {
    // google: 'your-google-verification-code',
    // other: {
    //   'msvalidate.01': 'your-bing-verification-code',
    // },
  },

  // Other
  category: 'technology',
  applicationName: 'FabricDesigner.AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FabricDesigner.AI',
    applicationCategory: 'DesignApplication',
    description: 'AI-powered fabric and textile design generation platform',
    url: siteUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    operatingSystem: 'Any',
    creator: {
      '@type': 'Organization',
      name: 'FabricDesigner.AI',
      url: siteUrl,
    },
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FabricDesigner.AI" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={siteUrl} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <TransitionProvider>
          <AuthProvider>
            <PageTransition />
            {children}
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#0066FF',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </TransitionProvider>
      </body>
    </html>
  );
}
