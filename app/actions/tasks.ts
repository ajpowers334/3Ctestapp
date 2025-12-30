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

export async function getTasks(userUuid: string) {
  try {
    const supabase = await createAuthenticatedClient()

    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, completed")
      .eq("user_id", userUuid)
      .order("created_at", { ascending: false })
    
    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      }
    }
    
    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      data: [],
    }
  }
}

export async function createTask(userUuid: string, title: string) {
  try {
    const supabase = await createAuthenticatedClient()

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userUuid,
        title: title,
        completed: false,
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

export async function updateTaskCompletion(taskId: string, completed: boolean) {
  try {
    const supabase = await createAuthenticatedClient()

    const { data, error } = await supabase
      .from("tasks")
      .update({ completed: completed })
      .eq("id", taskId)
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

export async function deleteTask(taskId: string) {
  try {
    const supabase = await createAuthenticatedClient()

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
