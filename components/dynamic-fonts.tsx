"use client"

import { Geist, Geist_Mono } from "next/font/google"
import { useEffect } from "react"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export function DynamicFonts() {
  useEffect(() => {
    // Apply font CSS variables to html element to avoid hydration mismatches
    // This runs only on the client after hydration
    const htmlElement = document.documentElement
    
    // Apply the font variable classes
    htmlElement.classList.add(geistSans.variable, geistMono.variable)
    
    // Also set CSS variables directly as fallback
    if (geistSans.style.fontFamily) {
      htmlElement.style.setProperty("--font-geist-sans", geistSans.style.fontFamily)
    }
    if (geistMono.style.fontFamily) {
      htmlElement.style.setProperty("--font-geist-mono", geistMono.style.fontFamily)
    }
    
    return () => {
      // Cleanup on unmount (though this shouldn't happen for root layout)
      htmlElement.classList.remove(geistSans.variable, geistMono.variable)
      htmlElement.style.removeProperty("--font-geist-sans")
      htmlElement.style.removeProperty("--font-geist-mono")
    }
  }, [])

  // Return null since we're applying styles via useEffect
  // The font styles from next/font/google are injected when the module loads
  return null
}

