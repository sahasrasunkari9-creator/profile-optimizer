import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Footer from "@/components/SiteFooter";
import NeonBackground from "@/components/CinematicBackdrop";
import Nav from "@/components/MainNav";
import { ToastProvider } from "@/components/ToastSystem";

export const metadata: Metadata = {
  title: "AI LinkedIn Profile Optimizer",
  description:
    "Transform your LinkedIn profile with AI. Generate headlines, summaries and optimized experience bullets, score your profile 0–100, and align it with target job descriptions.",
};

export const viewport: Viewport = {
  themeColor: "#04060f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("lo.theme")==="light"){document.documentElement.dataset.theme="light";}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans text-ink antialiased">
        <NeonBackground />
        <Nav />
        <ToastProvider>{children}</ToastProvider>
        <Footer />
      </body>
    </html>
  );
}
