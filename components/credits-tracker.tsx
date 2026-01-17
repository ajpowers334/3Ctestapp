"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Coins } from "lucide-react"

interface CreditsTrackerProps {
  credits: number
}

export function CreditsTracker({ credits }: CreditsTrackerProps) {
  const [prevCredits, setPrevCredits] = useState(credits)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (credits > prevCredits) {
      setShowAnimation(true)
      setTimeout(() => setShowAnimation(false), 600)
    }
    setPrevCredits(credits)
  }, [credits, prevCredits])

  return (
    <Card className="w-full max-w-sm mx-auto p-6 bg-gradient-to-br from-[#185859] to-[#A04F36] shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Coins className="w-6 h-6 text-[#E2A966]" />
          </div>
          <div>
            <p className="text-sm text-white/80 font-medium">Total Credits</p>
            <p className={`text-3xl font-bold text-white transition-all duration-300 ${showAnimation ? "scale-110" : ""}`}>
              {credits}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/70">Complete daily goals</p>
          <p className="text-sm text-[#E2A966] font-semibold">+3 credits each</p>
        </div>
      </div>

      {/* Credit animation pulse effect */}
      <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-[#E2A966] rounded-full animate-pulse" style={{ width: "100%" }} />
      </div>
    </Card>
  )
}
