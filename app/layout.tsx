import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HVAC Voice Trainer — NestZero",
  description: "Voice-based sales training simulator for NestZero field reps",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HVAC Trainer",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className="min-h-full bg-zinc-950 text-zinc-100 antialiased"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
