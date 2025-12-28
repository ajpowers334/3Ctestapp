"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Pencil } from "lucide-react"
import { 
  getGoals, 
  createGoal, 
  updateGoalCompletion, 
  updateGoalText, 
  updateGoalSkip 
} from "@/app/actions/goals"

interface DailyGoal {
  id: string
  type: "personal" | "habit" | "financial"
  label: string
  text: string
  completed: boolean
  skipped: boolean
  skipReason: string
}

interface DailyGoalsProps {
  userId: string
}

const defaultGoals = [
  {
    type: "personal" as const,
    label: "Personal Goal",
    text: "Read for 30 minutes",
  },
  {
    type: "habit" as const,
    label: "Habit",
    text: "Morning workout routine",
  },
  {
    type: "financial" as const,
    label: "Financial Action",
    text: "Review budget and track expenses",
  },
]

export function DailyGoals({ userId }: DailyGoalsProps) {
  const [goals, setGoals] = useState<DailyGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showCelebration, setShowCelebration] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [skippingGoalId, setSkippingGoalId] = useState<string | null>(null)
  const [skipReasonInput, setSkipReasonInput] = useState("")
  const [showReasonForId, setShowReasonForId] = useState<string | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  useEffect(() => {
    const today = new Date()
    setCurrentDay(today.getDate())
  }, [])

  // Fetch goals on mount
  useEffect(() => {
    const fetchGoals = async () => {
      const result = await getGoals(userId)
      if (result.success && result.data) {
        if (result.data.length === 0) {
          // Create default goals if user has none
          const createdGoals = []
          for (const defaultGoal of defaultGoals) {
            const createResult = await createGoal(
              userId,
              defaultGoal.text,
              defaultGoal.type,
              defaultGoal.label
            )
            if (createResult.success && createResult.data) {
              createdGoals.push({
                id: createResult.data.id,
                type: createResult.data.type,
                label: createResult.data.label,
                text: createResult.data.title,
                completed: createResult.data.completed,
                skipped: createResult.data.skipped,
                skipReason: createResult.data.skip_reason || "",
              })
            }
          }
          setGoals(createdGoals)
        } else {
          // Map database goals to component format
          setGoals(
            result.data.map((goal: any) => ({
              id: goal.id,
              type: goal.type,
              label: goal.label,
              text: goal.title,
              completed: goal.completed,
              skipped: goal.skipped,
              skipReason: goal.skip_reason || "",
            }))
          )
        }
      }
      setIsLoading(false)
    }
    fetchGoals()
  }, [userId])

  const toggleGoal = async (id: string) => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return

    const newCompleted = !goal.completed

    // Optimistically update UI
    const updatedGoals = goals.map((g) =>
      g.id === id ? { ...g, completed: newCompleted, skipped: false, skipReason: "" } : g,
    )
    setGoals(updatedGoals)

    // Update database
    const result = await updateGoalCompletion(id, newCompleted)
    
    if (!result.success) {
      // Revert on error
      setGoals(goals)
      alert("Error updating goal. Please try again.")
      return
    }

    const allCompleted = updatedGoals.every((g) => g.completed || g.skipped)
    const anyCompleted = updatedGoals.some((g) => g.completed)
    if (allCompleted && anyCompleted) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const handleSkipClick = (id: string) => {
    setSkippingGoalId(id)
    setSkipReasonInput("")
  }

  const handleSkipSubmit = async (id: string) => {
    if (skipReasonInput.trim()) {
      const reason = skipReasonInput.trim()
      
      // Optimistically update UI
      const updatedGoals = goals.map((goal) =>
        goal.id === id ? { ...goal, skipped: true, skipReason: reason, completed: false } : goal,
      )
      setGoals(updatedGoals)
      setSkippingGoalId(null)
      setSkipReasonInput("")

      // Update database
      const result = await updateGoalSkip(id, true, reason)
      
      if (!result.success) {
        // Revert on error
        setGoals(goals)
        setSkippingGoalId(id)
        setSkipReasonInput(reason)
        alert("Error skipping goal. Please try again.")
        return
      }

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

  const handleEditClick = (id: string, currentText: string) => {
    setEditingGoalId(id)
    setEditText(currentText)
  }

  const handleSaveEdit = async (id: string) => {
    if (editText.trim()) {
      const newText = editText.trim()
      
      // Optimistically update UI
      const updatedGoals = goals.map((goal) => (goal.id === id ? { ...goal, text: newText } : goal))
      setGoals(updatedGoals)
      setEditingGoalId(null)
      setEditText("")

      // Update database
      const result = await updateGoalText(id, newText)
      
      if (!result.success) {
        // Revert on error
        setGoals(goals)
        setEditingGoalId(id)
        setEditText(newText)
        alert("Error updating goal. Please try again.")
      }
    } else {
      setEditingGoalId(null)
      setEditText("")
    }
  }

  const handleCancelEdit = () => {
    setEditingGoalId(null)
    setEditText("")
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

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="mb-2 text-4xl">⏳</div>
          <p className="text-sm">Loading goals...</p>
        </div>
      ) : (
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
              <div className="goal-checkbox mt-1 cursor-pointer" onClick={() => toggleGoal(goal.id)}>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    goal.completed
                      ? "border-[#185859] bg-[#185859]"
                      : goal.skipped
                        ? "border-gray-400 bg-gray-400 hover:border-[#185859]"
                        : "border-gray-300 hover:border-[#185859]"
                  }`}
                >
                  {goal.completed && <Check className="w-4 h-4 text-white check-icon" />}
                  {goal.skipped && !goal.completed && <X className="w-4 h-4 text-white" />}
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
                {editingGoalId === goal.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(goal.id)
                        if (e.key === "Escape") handleCancelEdit()
                      }}
                      className="w-full px-3 py-2 border-2 border-[#185859] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#185859]/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveEdit(goal.id)}
                        size="sm"
                        className="bg-[#185859] hover:bg-[#185859]/90 text-white h-8"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-100 h-8 bg-transparent"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-gray-800 transition-all duration-300 flex-1 ${
                        goal.completed || goal.skipped ? "line-through opacity-60" : ""
                      }`}
                    >
                      {goal.text}
                    </p>
                    {!goal.completed && !goal.skipped && skippingGoalId !== goal.id && (
                      <Button
                        onClick={() => handleEditClick(goal.id, goal.text)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-[#185859] hover:bg-[#185859]/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}

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

                {!goal.completed && !goal.skipped && skippingGoalId !== goal.id && editingGoalId !== goal.id && (
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
      )}

      {showCelebration && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#185859] to-[#A04F36] text-white rounded-lg text-center celebration-banner">
          <p className="text-lg font-bold">Amazing work!</p>
          <p className="text-sm">You completed all your daily goals!</p>
        </div>
      )}
    </Card>
  )
}
