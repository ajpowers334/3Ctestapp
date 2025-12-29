"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

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

export async function updateUserType(userId: string, type: string) {
  try {
    // Create a Supabase client for server-side operations
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Update the type column for the specific user
    const { data, error } = await supabase
      .from("profiles")
      .update({ type: type })
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
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function getUserType(userId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", userId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        type: null,
      }
    }
    
    return {
      success: true,
      type: data?.type || null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      type: null,
    }
  }
}
