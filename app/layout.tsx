import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Outfit } from "next/font/google";
import { ClerkProvider, Show, SignInButton, UserButton } from '@clerk/nextjs'
import { ThemeProvider } from "@/components/providers/theme-provider"
import { BookOpen } from "lucide-react";

import "./globals.css";
import { ModeToggle } from "@/components/mode-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const outfit = Outfit({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Cohort-buddy",
  description: "Ask any cohort class related doubts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.className} h-full antialiased`}
    > 
      <body className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full flex-col">
        
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-400 shadow-sm shadow-primary/30">
              <BookOpen className="size-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Cohort<span className="text-primary">Buddy</span>
            </span>
          </div>
            <div className="flex justify-end items-center gap-3">
              <ModeToggle/>
            <Show when="signed-out">
              <SignInButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
            </div>
          </header>{children}
         </ThemeProvider>
        </ClerkProvider>
      </div>
      </body>
    </html>
  );
}