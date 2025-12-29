"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// Helper function to check if we're past 3am today
function isPastResetTime(): boolean {
  const now = new Date()
  const resetTime = new Date()
  resetTime.setHours(3, 0, 0, 0)
  return now >= resetTime
}

// Helper function to get today's date string (YYYY-MM-DD)
function getTodayDateString(): string {
  const today = new Date()
  // If it's before 3am, use yesterday's date
  if (!isPastResetTime()) {
    today.setDate(today.getDate() - 1)
  }
  return today.toISOString().split('T')[0]
}

export async function getGoals(userUuid: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
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

    // Reset goals that were completed or skipped on a different day (3am reset logic)
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export async function updateGoalCompletion(goalId: string, completed: boolean) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const today = getTodayDateString()

    const { data, error } = await supabase
      .from("goals")
      .update({ 
        completed: completed,
        completed_date: completed ? today : null,
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
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
