import { ThemeProvider } from "@teispace/next-themes";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/cn";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn(geistSans.variable, geistMono.variable)}
      lang="en"
      suppressHydrationWarning={true}
    >
      <body>
        <ThemeProvider attribute="class" disableTransitionOnChange={true}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
