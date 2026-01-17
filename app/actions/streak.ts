"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { addCredits } from "./credits"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// Helper function to create an authenticated Supabase client for server actions
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

// ============================================
// UTC Date Helpers
// ============================================

// Helper to get UTC date strings for today and yesterday
function getUTCDateStrings() {
  const today = new Date()
  const todayYear = today.getUTCFullYear()
  const todayMonth = String(today.getUTCMonth() + 1).padStart(2, '0')
  const todayDay = String(today.getUTCDate()).padStart(2, '0')
  const todayDateString = `${todayYear}-${todayMonth}-${todayDay}`

  const yesterday = new Date(todayDateString + 'T00:00:00Z')
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayYear = yesterday.getUTCFullYear()
  const yesterdayMonth = String(yesterday.getUTCMonth() + 1).padStart(2, '0')
  const yesterdayDay = String(yesterday.getUTCDate()).padStart(2, '0')
  const yesterdayDateString = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`

  return { todayDateString, yesterdayDateString }
}

// ============================================
// Streak Logic
// ============================================
// 
// Simple rules:
// 1. Each calendar day, if user completes all 3 goals, streak +1
// 2. If day ends and goals incomplete, streak resets to 0
// 3. Bonus credit awarded when streak increments
//
// Uses: profiles.streak, profiles.last_completed_date
// ============================================

export async function getStreak(userId: string) {
  try {
    const supabase = await createAuthenticatedClient()
    const { todayDateString, yesterdayDateString } = getUTCDateStrings()

    const { data, error } = await supabase
      .from("profiles")
      .select("streak, last_completed_date")
      .eq("id", userId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        streak: 0,
      }
    }

    const lastCompletedDate = data?.last_completed_date || null
    let currentStreak = data?.streak || 0

    // Check if streak should be reset
    // Streak is valid if last_completed_date is today or yesterday
    // If older than yesterday, streak resets to 0
    if (lastCompletedDate !== todayDateString && lastCompletedDate !== yesterdayDateString) {
      // Streak is broken - reset it
      if (currentStreak > 0) {
        await supabase
          .from("profiles")
          .update({ streak: 0, last_completed_date: null })
          .eq("id", userId)
        
        currentStreak = 0
      }
    }
    
    return {
      success: true,
      streak: currentStreak,
      lastCompletedDate,
      completedToday: lastCompletedDate === todayDateString,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      streak: 0,
    }
  }
}

export async function updateStreak(userId: string, allGoalsCompleted: boolean) {
  try {
    const supabase = await createAuthenticatedClient()
    const { todayDateString, yesterdayDateString } = getUTCDateStrings()

    // Get current streak data
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("streak, last_completed_date")
      .eq("id", userId)
      .single()
    
    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      }
    }

    let currentStreak = profile?.streak || 0
    const lastCompletedDate = profile?.last_completed_date

    // First, check if streak should be reset (day passed without completion)
    if (lastCompletedDate !== todayDateString && lastCompletedDate !== yesterdayDateString) {
      currentStreak = 0
    }

    let newStreak = currentStreak
    let newLastCompletedDate = lastCompletedDate
    let streakIncremented = false

    if (allGoalsCompleted) {
      // User completed all 3 goals
      if (lastCompletedDate !== todayDateString) {
        // Haven't completed today yet - increment streak
        newStreak = currentStreak + 1
        newLastCompletedDate = todayDateString
        streakIncremented = true
      }
      // If already completed today, do nothing (streak already counted)
    }
    // If not all goals completed, don't change anything
    // Streak only resets when a NEW day starts and yesterday wasn't completed

    // Update database
    const { error } = await supabase
      .from("profiles")
      .update({ 
        streak: newStreak,
        last_completed_date: newLastCompletedDate,
      })
      .eq("id", userId)
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: true,
      streak: newStreak,
      streakIncremented,
      completedToday: newLastCompletedDate === todayDateString,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function awardStreakBonus(userId: string) {
  try {
    const supabase = await createAuthenticatedClient()
    const { todayDateString } = getUTCDateStrings()

    // Get current profile data
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("streak, streak_bonus_awarded_date")
      .eq("id", userId)
      .single()
    
    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      }
    }

    const currentStreak = profile?.streak || 0
    const lastBonusDate = profile?.streak_bonus_awarded_date

    // Only award bonus if:
    // 1. User is on a streak (streak > 0)
    // 2. Bonus hasn't been awarded today
    if (currentStreak > 0 && lastBonusDate !== todayDateString) {
      // Add 1 bonus credit
      const creditsResult = await addCredits(userId, 1)
      if (!creditsResult.success) {
        return creditsResult
      }

      // Update streak_bonus_awarded_date
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ streak_bonus_awarded_date: todayDateString })
        .eq("id", userId)
      
      if (updateError) {
        return {
          success: false,
          error: updateError.message,
        }
      }

      return {
        success: true,
        credits: creditsResult.credits,
        bonusAwarded: true,
      }
    }

    // Bonus already awarded today or no streak
    return {
      success: true,
      credits: null,
      bonusAwarded: false,
      alreadyAwarded: lastBonusDate === todayDateString,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
