import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./reset.css";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext'
import './prism-theme.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Snippit Repository',
  description: 'A repository for sharing code snippets',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">
            <AuthProvider>
              {children}
            </AuthProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
