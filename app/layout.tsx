import type React from "react"
import type { Metadata } from "next"
import { DynamicFonts } from "@/components/dynamic-fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "Carolina Canyon Corporation - Building Tomorrow Together",
  description: "Join Carolina Canyon Corporation and discover innovative solutions for your business needs.",
  // </CHANGE>
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <DynamicFonts />
        {children}
        {/* <Analytics /> this is commented out to avoid build error*/}
      </body>
    </html>
  )
}
