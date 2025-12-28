"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

export async function getTasks(userUuid: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, completed")
      .eq("uuid", userUuid)
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        uuid: userUuid,
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
