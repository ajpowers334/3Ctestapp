"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface DailyGoal {
  id: string
  type: "personal" | "habit" | "financial"
  label: string
  text: string
  completed: boolean
  skipped: boolean
  skipReason: string
}

export function DailyGoals() {
  const [goals, setGoals] = useState<DailyGoal[]>([
    {
      id: "1",
      type: "personal",
      label: "Personal Goal",
      text: "Read for 30 minutes",
      completed: false,
      skipped: false,
      skipReason: "",
    },
    {
      id: "2",
      type: "habit",
      label: "Habit",
      text: "Morning workout routine",
      completed: false,
      skipped: false,
      skipReason: "",
    },
    {
      id: "3",
      type: "financial",
      label: "Financial Action",
      text: "Review budget and track expenses",
      completed: false,
      skipped: false,
      skipReason: "",
    },
  ])

  const [showCelebration, setShowCelebration] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [skippingGoalId, setSkippingGoalId] = useState<string | null>(null)
  const [skipReasonInput, setSkipReasonInput] = useState("")
  const [showReasonForId, setShowReasonForId] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date()
    setCurrentDay(today.getDate())
  }, [])

  const toggleGoal = (id: string) => {
    const updatedGoals = goals.map((goal) =>
      goal.id === id ? { ...goal, completed: !goal.completed, skipped: false, skipReason: "" } : goal,
    )
    setGoals(updatedGoals)

    const allCompleted = updatedGoals.every((goal) => goal.completed || goal.skipped)
    const anyCompleted = updatedGoals.some((goal) => goal.completed)
    if (allCompleted && anyCompleted) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const handleSkipClick = (id: string) => {
    setSkippingGoalId(id)
    setSkipReasonInput("")
  }

  const handleSkipSubmit = (id: string) => {
    if (skipReasonInput.trim()) {
      const updatedGoals = goals.map((goal) =>
        goal.id === id ? { ...goal, skipped: true, skipReason: skipReasonInput, completed: false } : goal,
      )
      setGoals(updatedGoals)
      setSkippingGoalId(null)
      setSkipReasonInput("")

      const allCompleted = updatedGoals.every((goal) => goal.completed || goal.skipped)
      const anyCompleted = updatedGoals.some((goal) => goal.completed)
      if (allCompleted && anyCompleted) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
    }
  }

  const handleCancelSkip = () => {
    setSkippingGoalId(null)
    setSkipReasonInput("")
  }

  const completedCount = goals.filter((g) => g.completed || g.skipped).length

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 bg-white shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-[#185859]">Daily Goals</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Day</span>
            <div className="w-10 h-10 rounded-full bg-[#185859] flex items-center justify-center">
              <span className="text-white font-bold">{currentDay}</span>
            </div>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#185859] transition-all duration-500"
            style={{ width: `${(completedCount / goals.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {completedCount} of {goals.length} completed
        </p>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={`goal-item p-4 rounded-lg border-2 transition-all duration-300 ${
              goal.completed
                ? "border-[#185859] bg-[#185859]/5"
                : goal.skipped
                  ? "border-gray-400 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-[#185859]/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="goal-checkbox mt-1 cursor-pointer" onClick={() => !goal.skipped && toggleGoal(goal.id)}>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    goal.completed
                      ? "border-[#185859] bg-[#185859]"
                      : goal.skipped
                        ? "border-gray-400 bg-gray-400"
                        : "border-gray-300 hover:border-[#185859]"
                  }`}
                >
                  {goal.completed && <Check className="w-4 h-4 text-white check-icon" />}
                  {goal.skipped && <X className="w-4 h-4 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      goal.type === "personal"
                        ? "bg-[#E2A966] text-white"
                        : goal.type === "habit"
                          ? "bg-[#A04F36] text-white"
                          : "bg-[#185859] text-white"
                    }`}
                  >
                    {goal.label}
                  </span>
                  {goal.skipped && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-400 text-white">Skipped</span>
                  )}
                </div>
                <p
                  className={`text-gray-800 transition-all duration-300 ${
                    goal.completed || goal.skipped ? "line-through opacity-60" : ""
                  }`}
                >
                  {goal.text}
                </p>

                {skippingGoalId === goal.id && (
                  <div className="mt-3 space-y-2 skip-reason-input">
                    <input
                      type="text"
                      value={skipReasonInput}
                      onChange={(e) => setSkipReasonInput(e.target.value)}
                      placeholder="Why are you skipping this goal?"
                      className="w-full px-3 py-2 border-2 border-[#185859] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#185859]/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSkipSubmit(goal.id)}
                        disabled={!skipReasonInput.trim()}
                        className="bg-[#185859] hover:bg-[#185859]/90 text-white"
                      >
                        Submit
                      </Button>
                      <Button
                        onClick={handleCancelSkip}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-100 bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {goal.skipped && showReasonForId === goal.id && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg skip-reason-display">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Reason: </span>
                      {goal.skipReason}
                    </p>
                  </div>
                )}

                {!goal.completed && !goal.skipped && skippingGoalId !== goal.id && (
                  <div className="mt-3">
                    <Button
                      onClick={() => handleSkipClick(goal.id)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                    >
                      Skip
                    </Button>
                  </div>
                )}

                {goal.skipped && (
                  <div className="mt-3">
                    <Button
                      onClick={() => setShowReasonForId(showReasonForId === goal.id ? null : goal.id)}
                      variant="outline"
                      size="sm"
                      className="text-[#185859] border-[#185859] hover:bg-[#185859]/10"
                    >
                      {showReasonForId === goal.id ? "Hide Reason" : "Show Reason"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCelebration && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#185859] to-[#A04F36] text-white rounded-lg text-center celebration-banner">
          <p className="text-lg font-bold">Amazing work!</p>
          <p className="text-sm">You completed all your daily goals!</p>
        </div>
      )}
    </Card>
  )
}
