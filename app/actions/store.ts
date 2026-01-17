"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createHash } from "crypto"
import { randomBytes } from "crypto"

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

// Generate a random token (32 bytes = 64 hex characters)
function generateToken(): string {
  return randomBytes(32).toString("hex")
}

// Hash the token using SHA-256
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

// Create a checkout session when user purchases an item
// Note: Credits are NOT deducted here - they are deducted when admin confirms the transaction
export async function createCheckoutSession(itemName: string, cost: number) {
  try {
    const supabase = await createAuthenticatedClient()
    
    // Get the authenticated user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || "No authenticated user found",
      }
    }

    // Check if user has enough credits (but don't deduct yet)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()
    
    if (profileError) {
      return {
        success: false,
        error: profileError.message,
      }
    }

    const currentCredits = profile?.credits || 0
    if (currentCredits < cost) {
      return {
        success: false,
        error: "Insufficient credits",
      }
    }

    // Generate token and hash
    const token = generateToken()
    const tokenHash = hashToken(token)

    // Create checkout session in database
    const { data, error } = await supabase
      .from("checkout_sessions")
      .insert({
        user_id: user.id,
        item: itemName,
        status: "pending",
        token_hash: tokenHash,
        cost: cost, // Store cost for credit deduction later
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    // Generate checkout URL with token
    // Use NEXT_PUBLIC_BASE_URL if set, otherwise use network IP for QR code scanning
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://172.20.10.2:3000"
    const checkoutUrl = `${baseUrl}/checkout/confirm?token=${token}`
    
    // Return the checkout URL for QR code and session info
    return {
      success: true,
      data: {
        sessionId: data.id,
        token: token, // Keep token for reference
        checkoutUrl: checkoutUrl, // URL for QR code
        itemName: itemName,
        cost: cost,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Mark a checkout session as expired (when QR dialog is closed)
export async function expireCheckoutSession(sessionId: string) {
  try {
    const supabase = await createAuthenticatedClient()
    
    // Get authenticated user to verify ownership
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // First, verify the session exists and belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("id, user_id, status")
      .eq("id", sessionId)
      .single()
    
    if (sessionError || !session) {
      return {
        success: false,
        error: "Session not found",
      }
    }

    // Verify the session belongs to the authenticated user
    if (session.user_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized: Session does not belong to you",
      }
    }

    // Only expire if still pending
    if (session.status !== "pending") {
      return {
        success: false,
        error: `Session is already ${session.status}, cannot expire`,
      }
    }

    // Update the session status to expired
    const { data: updatedSession, error: updateError } = await supabase
      .from("checkout_sessions")
      .update({ status: "expired" })
      .eq("id", sessionId)
      .eq("user_id", user.id) // Ensure we're updating the user's own session
      .eq("status", "pending") // Only expire if still pending
      .select()
      .single()
    
    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Check if update actually happened
    if (!updatedSession) {
      return {
        success: false,
        error: "Failed to expire session - no rows updated",
      }
    }
    
    return {
      success: true,
      data: {
        sessionId: updatedSession.id,
        status: updatedSession.status,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Complete a checkout session (admin confirms transaction)
// This handles: finding session by token, validating admin, updating status, creating transaction, deducting credits
export async function completeCheckoutSession(token: string) {
  try {
    const supabase = await createAuthenticatedClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Check if user is admin - ensure profile exists first
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single()
    
    // If profile doesn't exist, create it
    if (profileError || !profile) {
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          created_at: new Date().toISOString(),
        })
        .select("is_admin, email")
        .single()
      
      if (createError || !newProfile) {
        return {
          success: false,
          error: "Failed to create admin profile",
        }
      }
      
      profile = newProfile
    }

    if (!profile || profile.is_admin !== true) {
      return {
        success: false,
        error: "Admin access required",
      }
    }

    // Hash the token
    const tokenHash = hashToken(token)

    // Find matching checkout session with status='pending'
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("status", "pending")
      .single()
    
    if (sessionError || !session) {
      return {
        success: false,
        error: "Invalid or expired token",
      }
    }

    // Verify session is still pending (double-check)
    if (session.status !== "pending") {
      return {
        success: false,
        error: "Session is not pending",
      }
    }

    // Check if purchasing user has enough credits - ensure profile exists first
    let { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("credits, email")
      .eq("id", session.user_id)
      .single()
    
    // If purchasing user's profile doesn't exist, create it
    if (userProfileError || !userProfile) {
      const { data: newUserProfile, error: createUserProfileError } = await supabase
        .from("profiles")
        .insert({
          id: session.user_id,
          email: `user-${session.user_id.substring(0, 8)}@placeholder.com`,
          created_at: new Date().toISOString(),
        })
        .select("credits, email")
        .single()
      
      if (createUserProfileError) {
        if (createUserProfileError.code === "23505") {
          // Profile was created by another request, fetch it
          const { data: retryProfile, error: retryError } = await supabase
            .from("profiles")
            .select("credits, email")
            .eq("id", session.user_id)
            .single()
          
          if (retryError || !retryProfile) {
            return {
              success: false,
              error: "Purchasing user profile not found. Please ensure the user has completed their profile setup.",
            }
          }
          
          userProfile = retryProfile
        } else {
          return {
            success: false,
            error: `Purchasing user profile not found: ${createUserProfileError.message}`,
          }
        }
      } else if (newUserProfile) {
        userProfile = newUserProfile
      } else {
        return {
          success: false,
          error: "Purchasing user profile not found and could not be created.",
        }
      }
    }

    if (!userProfile) {
      return {
        success: false,
        error: "User profile not found",
      }
    }

    const currentCredits = userProfile.credits || 0
    const cost = session.cost || 0
    
    // Check if user has enough credits before completing
    if (currentCredits < cost) {
      return {
        success: false,
        error: "User has insufficient credits",
      }
    }

    // Update session status to 'completed'
    const { error: updateError } = await supabase
      .from("checkout_sessions")
      .update({ status: "completed" })
      .eq("id", session.id)
    
    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Insert transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        session_id: session.id,
        admin_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (transactionError) {
      // Rollback session status if transaction insert fails
      await supabase
        .from("checkout_sessions")
        .update({ status: "pending" })
        .eq("id", session.id)
      
      return {
        success: false,
        error: transactionError.message,
      }
    }

    // Deduct credits from the user who made the purchase
    const newCredits = currentCredits - cost
    const { error: creditError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", session.user_id)
    
    if (creditError) {
      // Rollback transaction and session if credit deduction fails
      await supabase
        .from("transactions")
        .delete()
        .eq("id", transaction.id)
      
      await supabase
        .from("checkout_sessions")
        .update({ status: "pending" })
        .eq("id", session.id)
      
      return {
        success: false,
        error: "Failed to deduct credits",
      }
    }
    
    return {
      success: true,
      data: {
        sessionId: session.id,
        transactionId: transaction.id,
        item: session.item,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Check if user is admin -- dont need this, double check to make sure
export async function isAdmin(userId: string) {
  try {
    const supabase = await createAuthenticatedClient()
    
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        isAdmin: false,
      }
    }
    
    return {
      success: true,
      isAdmin: data?.is_admin === true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      isAdmin: false,
    }
  }
}
