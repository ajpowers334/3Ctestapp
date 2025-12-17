"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

export async function createProfile(userId: string, email: string) {
  try {
    // Create a Supabase client for server-side operations
    // No session dependency - we're using the provided userId and email directly
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Insert a row into the profiles table
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      // If the profile already exists, that's okay (idempotent)
      if (error.code === "23505") {
        // Unique constraint violation - profile already exists
        return {
          success: true,
          message: "Profile already exists",
        }
      }
      
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
