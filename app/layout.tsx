import type { Metadata, Viewport } from "next";
import PrivacyGate from "@/components/privacy-gate";
import "./globals.css";
import "./money.css";
import "./privacy.css";
import "./module-launcher.css";

export const metadata: Metadata = {
  title: "Abrar OS",
  description: "Your private personal life operating system",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#101828",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PrivacyGate>{children}</PrivacyGate></body>
    </html>
  );
}
