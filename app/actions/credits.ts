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

export async function getCredits(userId: string) {
  try {
    const supabase = await createAuthenticatedClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        credits: 0,
      }
    }
    
    return {
      success: true,
      credits: data?.credits || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      credits: 0,
    }
  }
}

export async function addCredits(userId: string, amount: number) {
  try {
    const supabase = await createAuthenticatedClient()

    // First get current credits
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single()
    
    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      }
    }

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + amount

    // Update credits
    const { data, error } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId)
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
      credits: newCredits,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function deductCredits(userId: string, amount: number) {
  try {
    const supabase = await createAuthenticatedClient()

    // First get current credits
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single()
    
    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      }
    }

    const currentCredits = profile?.credits || 0

    // Check if user has enough credits
    if (currentCredits < amount) {
      return {
        success: false,
        error: "Insufficient credits",
        credits: currentCredits,
      }
    }

    const newCredits = currentCredits - amount

    // Update credits
    const { data, error } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId)
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
      credits: newCredits,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
