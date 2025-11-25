import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://substack.lol'),
  title: "substack.lol - better previews for X",
  description: "wrap your substack links for better opengraph previews on X/Twitter",
  openGraph: {
    title: "substack.lol - better previews for X",
    description: "Wrap your Substack links for better OpenGraph previews on X/Twitter. Free tool with proper metadata extraction and instant redirects.",
    url: 'https://substack.lol',
    siteName: 'substack.lol',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'substack.lol - better previews for X',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "substack.lol - better previews for X",
    description: "Wrap your Substack links for better OpenGraph previews on X/Twitter",
    creator: '@itsnishu',
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
