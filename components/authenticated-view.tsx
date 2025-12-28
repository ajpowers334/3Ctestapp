"use client"

import { useState, useEffect } from "react"
import { TodoList } from "@/components/todo-list"
import { DailyGoals } from "@/components/daily-goals"
import { IntroScreen } from "@/components/intro-screen"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { updateUserType, getUserType } from "@/app/actions/profile"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface AuthenticatedViewProps {
  hasType: boolean
  userId: string
}

export function AuthenticatedView({ hasType, userId }: AuthenticatedViewProps) {
  const router = useRouter()
  const [showIntro, setShowIntro] = useState(!hasType)
  const [userType, setUserType] = useState<string | null>(null)

  // Fetch user type on mount
  useEffect(() => {
    const fetchUserType = async () => {
      const result = await getUserType(userId)
      if (result.success && result.type) {
        setUserType(result.type)
      }
    }
    if (hasType) {
      fetchUserType()
    }
  }, [userId, hasType])

  const handleIntroComplete = async (selectedValue: string) => {
    // Update the user's type in the database
    const result = await updateUserType(userId, selectedValue)
    
    if (result.success) {
      setShowIntro(false)
      // Update the user type in state
      setUserType(selectedValue)
      // Refresh the page to update the server-side state
      router.refresh()
    } else {
      console.error("Error updating user type:", result.error)
      alert("Error saving your selection. Please try again.")
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error)
      alert("Error signing out. Please try again.")
    } else {
      router.refresh()
    }
  }

  return (
    <>
      {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
      <main className="min-h-screen bg-background">
      {/* Sign Out Button */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* User Type Display */}
          {userType && (
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-2xl md:text-3xl font-semibold text-[#185859]">
                I am <span className="capitalize">{userType.replace(/-/g, " ")}</span>
              </p>
            </div>
          )}
          
          {/* Daily Goals Section */}
          <div>
            <DailyGoals userId={userId} />
          </div>

          {/* Todo List Section */}
          <div>
            <TodoList userId={userId} />
          </div>
        </div>
      </div>
    </main>
    </>
  )
}
