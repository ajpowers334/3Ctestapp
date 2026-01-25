import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCredits } from "@/app/actions/credits"
import { getStoreItems } from "@/app/actions/store"
import { StoreContent } from "@/components/store-content"
import { ensureProfileExists } from "@/app/actions/profile"

export default async function StorePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/")
  }

  // Ensure profile exists for authenticated users
  const profileResult = await ensureProfileExists()
  if (!profileResult.success) {
    console.error("Failed to ensure profile exists:", profileResult.error)
  }

  // Fetch user's current credits
  const creditsResult = await getCredits(user.id)
  const initialCredits = creditsResult.success ? creditsResult.credits : 0

  // Fetch store items from database
  const itemsResult = await getStoreItems()
  const initialItems = itemsResult.success ? itemsResult.items : []

  return <StoreContent userId={user.id} initialCredits={initialCredits} initialItems={initialItems} />
}
