import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AdminLayoutClient from './AdminLayoutClient';
import './globals.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel - ClientHunt",
  description: "ClientHunt Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Admin Root Layout
 * 
 * Wraps the admin panel with client-side layout component.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </body>
    </html>
  );
}
