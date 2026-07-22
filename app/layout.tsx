import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, SignInButton, UserButton } from '@clerk/nextjs'
import { ThemeProvider } from "@/components/providers/theme-provider"

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    > 
      <body className="h-screen overflow-hidden">
      <div className="flex h-full flex-col">
        
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Cohort-buddy</span>
            <div className="flex justify-end items-center gap-4">
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
