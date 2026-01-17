"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// Helper function to create an authenticated Supabase client for server actions
// This reads cookies so RLS policies can access auth.uid()
async function createAuthenticatedClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored in server actions where cookies can be set.
        }
      },
    },
  })
}

// Helper function to get today's date string (YYYY-MM-DD)
// Uses midnight (12am) as the reset time
function getTodayDateString(): string {
  const today = new Date()
  // Get local date string (YYYY-MM-DD) - resets at midnight
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getGoals(userUuid: string) {
  try {
    const supabase = await createAuthenticatedClient()
    const today = getTodayDateString()

    const { data, error } = await supabase
      .from("goals")
      .select("id, title, completed, skipped, skip_reason, type, label, completed_date")
      .eq("uuid", userUuid)
      .order("created_at", { ascending: true })
    
    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      }
    }

    // Reset goals that were completed or skipped on a different day (midnight reset logic)
    const goalsToReset: string[] = []
    const updatedGoals = (data || []).map((goal: any) => {
      // If goal was completed or skipped but not today, reset it
      if ((goal.completed || goal.skipped) && goal.completed_date !== today) {
        goalsToReset.push(goal.id)
        return {
          ...goal,
          completed: false,
          skipped: false,
          skip_reason: "",
          completed_date: null,
        }
      }
      return goal
    })

    // Batch update goals that need resetting
    if (goalsToReset.length > 0) {
      await supabase
        .from("goals")
        .update({ 
          completed: false, 
          skipped: false, 
          skip_reason: "",
          completed_date: null 
        })
        .in("id", goalsToReset)
    }
    
    return {
      success: true,
      data: updatedGoals || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      data: [],
    }
  }
}

export async function createGoal(
  userUuid: string, 
  title: string, 
  type: "personal" | "habit" | "financial",
  label: string
) {
  try {
    const supabase = await createAuthenticatedClient()

    const { data, error } = await supabase
      .from("goals")
      .insert({
        uuid: userUuid,
        title: title,
        type: type,
        label: label,
        completed: false,
        skipped: false,
        skip_reason: "",
        completed_date: null,
      })
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function getGoalById(goalId: string) {
  try {
    const supabase = await createAuthenticatedClient()

    const { data, error } = await supabase
      .from("goals")
      .select("id, completed, completed_date")
      .eq("id", goalId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }
    
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      data: null,
    }
  }
}

export async function updateGoalCompletion(goalId: string, completed: boolean) {
  try {
    const supabase = await createAuthenticatedClient()
    const today = getTodayDateString()

    // First, get the current goal state to check if it was completed today
    const { data: currentGoal } = await supabase
      .from("goals")
      .select("completed_date")
      .eq("id", goalId)
      .single()

    // If uncompleting a goal that was completed today, keep completed_date as today
    // This prevents awarding credits again if user recompletes the goal
    const wasCompletedToday = currentGoal?.completed_date === today
    const newCompletedDate = completed 
      ? today 
      : (wasCompletedToday ? today : null) // Keep today's date if it was completed today

    const { data, error } = await supabase
      .from("goals")
      .update({ 
        completed: completed,
        completed_date: newCompletedDate,
        skipped: false,
        skip_reason: "",
      })
      .eq("id", goalId)
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: true,
      data,
      wasCompletedToday, // Return this so we know if credits were already awarded
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function updateGoalText(goalId: string, title: string) {
  try {
    const supabase = await createAuthenticatedClient()

    const { data, error } = await supabase
      .from("goals")
      .update({ title: title })
      .eq("id", goalId)
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function updateGoalSkip(goalId: string, skipped: boolean, skipReason: string) {
  try {
    const supabase = await createAuthenticatedClient()
    const today = getTodayDateString()

    const { data, error } = await supabase
      .from("goals")
      .update({ 
        skipped: skipped,
        skip_reason: skipReason,
        completed: false,
        completed_date: skipped ? today : null,
      })
      .eq("id", goalId)
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
