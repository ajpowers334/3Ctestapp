"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface IntroScreenProps {
  onComplete: () => void
}

const options = [
  { label: "Disciplined", value: "disciplined" },
  { label: "Confident", value: "confident" },
  { label: "Financially Stable", value: "financially-stable" },
  { label: "Leader", value: "leader" },
]

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleSelect = (value: string) => {
    setSelectedOption(value)
    // Wait for selection animation, then fade out
    setTimeout(() => {
      setIsVisible(false)
      // Wait for fade out animation to complete
      setTimeout(() => {
        onComplete()
      }, 500)
    }, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#185859] transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-balance">I want to be...</h1>
            <p className="text-lg md:text-xl text-white/80 text-pretty">Choose what defines your journey</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-dropdown">
            {options.map((option, index) => (
              <Button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                disabled={selectedOption !== null}
                className={`h-auto py-6 px-8 text-lg font-semibold bg-white text-[#185859] hover:bg-white/90 hover:scale-105 transition-all duration-200 shadow-lg ${
                  selectedOption === option.value ? "scale-105 ring-4 ring-white/50" : ""
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
