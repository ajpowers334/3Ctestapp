"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Pencil, Flame } from "lucide-react"
import { 
  getGoals, 
  createGoal, 
  updateGoalCompletion,
  updateGoalText, 
  updateGoalSkip 
} from "@/app/actions/goals"
import { addCredits } from "@/app/actions/credits"
import { getStreak, updateStreak, awardStreakBonus } from "@/app/actions/streak"

interface DailyGoal {
  id: string
  type: "personal" | "habit" | "financial"
  label: string
  text: string
  completed: boolean
  skipped: boolean
  skipReason: string
  completionReflection: string
  completedDate?: string | null
}

interface DailyGoalsProps {
  userId: string
  onCreditsUpdate?: (credits: number) => void
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

export function DailyGoals({ userId, onCreditsUpdate }: DailyGoalsProps) {
  const [goals, setGoals] = useState<DailyGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [streak, setStreak] = useState<number>(0)

  const [showCelebration, setShowCelebration] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [skippingGoalId, setSkippingGoalId] = useState<string | null>(null)
  const [skipReasonInput, setSkipReasonInput] = useState("")
  const [showReasonForId, setShowReasonForId] = useState<string | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null)
  const [completionReflectionInput, setCompletionReflectionInput] = useState("")
  const [showReflectionForId, setShowReflectionForId] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date()
    setCurrentDay(today.getDate())
  }, [])

  // Fetch goals and streak on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch streak
      const streakResult = await getStreak(userId)
      if (streakResult.success) {
        setStreak(streakResult.streak)
      }

      // Fetch goals
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
                completionReflection: createResult.data.completion_reflection || "",
                completedDate: createResult.data.completed_date || null,
              })
            }
          }
          setGoals(createdGoals)
        } else {
          // Map database goals to component format
          const mappedGoals = result.data.map((goal: any) => ({
            id: goal.id,
            type: goal.type,
            label: goal.label,
            text: goal.title,
            completed: goal.completed,
            skipped: goal.skipped,
            skipReason: goal.skip_reason || "",
            completionReflection: goal.completion_reflection || "",
            completedDate: goal.completed_date || null,
          }))
          setGoals(mappedGoals)
          
          // Check if all goals are completed and update streak
          const allCompleted = mappedGoals.every((g: DailyGoal) => g.completed && !g.skipped)
          if (mappedGoals.length > 0) {
            const streakUpdateResult = await updateStreak(userId, allCompleted)
            if (streakUpdateResult.success) {
              setStreak(streakUpdateResult.streak)
            }
          }
        }
      }
      setIsLoading(false)
    }
    fetchData()
  }, [userId])

  const toggleGoal = async (id: string) => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return

    // If goal is not completed, trigger the completion flow with reflection input
    if (!goal.completed) {
      handleCompleteClick(id)
      return
    }

    // If goal is already completed, allow uncompleting it
    const newCompleted = false

    // Get today's date string (midnight reset)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayDateString = `${year}-${month}-${day}`

    // Optimistically update UI
    const updatedGoals = goals.map((g) =>
      g.id === id 
        ? { 
            ...g, 
            completed: newCompleted, 
            skipped: false, 
            skipReason: "",
            completionReflection: "",
            completedDate: g.completedDate === todayDateString ? todayDateString : null,
          } 
        : g,
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

    // Check if all goals are completed (not skipped) and update streak
    const allCompleted = updatedGoals.every((g) => g.completed && !g.skipped)
    
    if (!allCompleted && updatedGoals.length > 0) {
      // Not all goals completed - reset streak to 0
      const streakResult = await updateStreak(userId, false)
      if (streakResult.success) {
        setStreak(streakResult.streak)
      }
    }
  }

  const handleCompleteClick = (id: string) => {
    setCompletingGoalId(id)
    setCompletionReflectionInput("")
  }

  const handleCompleteSubmit = async (id: string) => {
    if (completionReflectionInput.trim()) {
      const reflection = completionReflectionInput.trim()

      // Get today's date string (midnight reset)
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const todayDateString = `${year}-${month}-${day}`
      
      // Optimistically update UI
      const updatedGoals = goals.map((goal) =>
        goal.id === id 
          ? { 
              ...goal, 
              completed: true, 
              completionReflection: reflection, 
              skipped: false, 
              skipReason: "",
              completedDate: todayDateString,
            } 
          : goal,
      )
      setGoals(updatedGoals)
      setCompletingGoalId(null)
      setCompletionReflectionInput("")

      // Update database
      const result = await updateGoalCompletion(id, true, reflection)
      
      if (!result.success) {
        // Revert on error
        setGoals(goals)
        setCompletingGoalId(id)
        setCompletionReflectionInput(reflection)
        alert("Error completing goal. Please try again.")
        return
      }

      // Add credits when a goal is completed
      // Only add credits if the goal wasn't already completed today (prevents double credits on recomplete)
      const creditsAlreadyAwarded = result.wasCompletedToday || false
      if (!creditsAlreadyAwarded) {
        const creditsResult = await addCredits(userId, 3)
        if (creditsResult.success && onCreditsUpdate) {
          onCreditsUpdate(creditsResult.credits)
        }
      }

      // Check if all goals are completed (not skipped) and update streak
      const allCompleted = updatedGoals.every((g) => g.completed && !g.skipped)
      
      if (allCompleted && updatedGoals.length > 0) {
        // All goals completed - update streak
        const streakResult = await updateStreak(userId, true)
        if (streakResult.success) {
          setStreak(streakResult.streak)
          
          // Award streak bonus credit if user is on a streak
          if (streakResult.streak > 0) {
            const bonusResult = await awardStreakBonus(userId)
            if (bonusResult.success && bonusResult.credits !== null && onCreditsUpdate) {
              // Bonus was awarded, update credits display
              onCreditsUpdate(bonusResult.credits)
            }
          }
        }
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      } else if (!allCompleted && updatedGoals.length > 0) {
        // Not all goals completed - reset streak to 0
        const streakResult = await updateStreak(userId, false)
        if (streakResult.success) {
          setStreak(streakResult.streak)
        }
      }
    }
  }

  const handleCancelComplete = () => {
    setCompletingGoalId(null)
    setCompletionReflectionInput("")
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

      // Check if all goals are completed (not skipped) and update streak
      const allCompleted = updatedGoals.every((goal) => goal.completed && !goal.skipped)
      const anyCompleted = updatedGoals.some((goal) => goal.completed)
      
      if (allCompleted && updatedGoals.length > 0) {
        // All goals completed - update streak
        const streakResult = await updateStreak(userId, true)
        if (streakResult.success) {
          setStreak(streakResult.streak)
          
          // Award streak bonus credit if user is on a streak
          if (streakResult.streak > 0) {
            const bonusResult = await awardStreakBonus(userId)
            if (bonusResult.success && bonusResult.credits !== null && onCreditsUpdate) {
              // Bonus was awarded, update credits display
              onCreditsUpdate(bonusResult.credits)
            }
          }
        }
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      } else if (!allCompleted && updatedGoals.length > 0) {
        // Not all goals completed - reset streak to 0
        const streakResult = await updateStreak(userId, false)
        if (streakResult.success) {
          setStreak(streakResult.streak)
        }
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
          <div className="flex items-center gap-3">
            {/* Streak Display */}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-md">
                <Flame className="w-5 h-5 text-white" fill="white" />
                <span className="text-white font-bold text-lg">{streak}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Day</span>
              <div className="w-10 h-10 rounded-full bg-[#185859] flex items-center justify-center">
                <span className="text-white font-bold">{currentDay}</span>
              </div>
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

                {completingGoalId === goal.id && (
                  <div className="mt-3 space-y-2 completion-reflection-input">
                    <input
                      type="text"
                      value={completionReflectionInput}
                      onChange={(e) => setCompletionReflectionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && completionReflectionInput.trim()) handleCompleteSubmit(goal.id)
                        if (e.key === "Escape") handleCancelComplete()
                      }}
                      placeholder="Write a short reflection on how you completed this goal..."
                      className="w-full px-3 py-2 border-2 border-[#185859] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#185859]/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCompleteSubmit(goal.id)}
                        disabled={!completionReflectionInput.trim()}
                        className="bg-[#185859] hover:bg-[#185859]/90 text-white"
                      >
                        Submit
                      </Button>
                      <Button
                        onClick={handleCancelComplete}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-100 bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {skippingGoalId === goal.id && (
                  <div className="mt-3 space-y-2 skip-reason-input">
                    <input
                      type="text"
                      value={skipReasonInput}
                      onChange={(e) => setSkipReasonInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skipReasonInput.trim()) handleSkipSubmit(goal.id)
                        if (e.key === "Escape") handleCancelSkip()
                      }}
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

                {goal.completed && showReflectionForId === goal.id && goal.completionReflection && (
                  <div className="mt-3 p-3 bg-[#185859]/10 rounded-lg completion-reflection-display">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Reflection: </span>
                      {goal.completionReflection}
                    </p>
                  </div>
                )}

                {!goal.completed && !goal.skipped && skippingGoalId !== goal.id && completingGoalId !== goal.id && editingGoalId !== goal.id && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => handleCompleteClick(goal.id)}
                      size="sm"
                      className="bg-[#185859] hover:bg-[#185859]/90 text-white"
                    >
                      Complete
                    </Button>
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

                {goal.completed && goal.completionReflection && (
                  <div className="mt-3">
                    <Button
                      onClick={() => setShowReflectionForId(showReflectionForId === goal.id ? null : goal.id)}
                      variant="outline"
                      size="sm"
                      className="text-[#185859] border-[#185859] hover:bg-[#185859]/10"
                    >
                      {showReflectionForId === goal.id ? "Hide Reflection" : "Show Reflection"}
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
