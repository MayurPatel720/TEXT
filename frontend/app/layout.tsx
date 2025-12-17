import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Textile AI - Generate Stunning Fabric Designs with AI",
  description: "Transform reference images into professional, print-ready textile designs in seconds. AI-powered pattern generation for manufacturers and designers.",
  keywords: [
    "textile design AI",
    "fabric pattern generator",
    "AI textile design",
    "print-ready patterns",
    "style transfer textile",
    "pattern generation AI",
    "fabric design tool",
    "textile manufacturing",
    "seamless pattern maker",
    "professional textile design"
  ],
  authors: [{ name: "Textile AI" }],
  creator: "Textile AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Textile AI",
    title: "Textile AI - AI-Powered Fabric Design Generator",
    description: "Generate stunning textile designs from reference images. Professional quality, print-ready patterns in seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Textile AI - AI-Powered Fabric Design Generator",
    description: "Generate stunning textile designs from reference images. Professional quality, print-ready patterns in seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#0A0A0A" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
