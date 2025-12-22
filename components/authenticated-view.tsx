"use client"

import { TodoList } from "@/components/todo-list"
import { DailyGoals } from "@/components/daily-goals"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function AuthenticatedView() {
  const router = useRouter()

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
          {/* Daily Goals Section */}
          <div>
            <DailyGoals />
          </div>

          {/* Todo List Section */}
          <div>
            <TodoList />
          </div>
        </div>
      </div>
    </main>
  )
}
