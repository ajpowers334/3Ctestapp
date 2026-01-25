"use client"

import { useState, useEffect } from "react"
import { TodoList } from "@/components/todo-list"
import { DailyGoals } from "@/components/daily-goals"
import { CreditsTracker } from "@/components/credits-tracker"
import { IntroScreen } from "@/components/intro-screen"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { updateUserType, getUserType } from "@/app/actions/profile"
import { getCredits } from "@/app/actions/credits"
import { LogOut, LayoutDashboard, Store } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AuthenticatedViewProps {
  hasType: boolean
  userId: string
}

export function AuthenticatedView({ hasType, userId }: AuthenticatedViewProps) {
  const router = useRouter()
  const [showIntro, setShowIntro] = useState(!hasType)
  const [userType, setUserType] = useState<string | null>(null)
  const [credits, setCredits] = useState<number>(0)

  // Fetch user type and credits on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (hasType) {
        const typeResult = await getUserType(userId)
        if (typeResult.success && typeResult.type) {
          setUserType(typeResult.type)
        }
      }
      
      const creditsResult = await getCredits(userId)
      if (creditsResult.success) {
        setCredits(creditsResult.credits)
      }
    }
    fetchUserData()
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
      {/* Navigation Buttons */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href="/store">
                <Store className="h-4 w-4" />
                Store
              </Link>
            </Button>
          </div>
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
                I am {userType === "leader" ? "a " : ""}<span className="capitalize">{userType.replace(/-/g, " ")}</span>
              </p>
            </div>
          )}
          
          {/* Credits Tracker */}
          <div>
            <CreditsTracker credits={credits} />
          </div>
          
          {/* Daily Goals Section */}
          <div>
            <DailyGoals userId={userId} onCreditsUpdate={setCredits} />
          </div>

          {/* Todo List Section */}
          <div>
            <TodoList userId={userId} onCreditsUpdate={setCredits} />
          </div>
        </div>
      </div>
    </main>
    </>
  )
}
