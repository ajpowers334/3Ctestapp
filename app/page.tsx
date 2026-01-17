import { createSupabaseServerClient } from "@/lib/supabase/server"
import { HomePageWrapper } from "@/components/home-page-wrapper"
import { ensureProfileExists } from "@/app/actions/profile"

export default async function Home() {
  const supabase = await createSupabaseServerClient() /*needs async and await since next.js 15*/
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log("Server user:", user?.email)

  // Ensure profile exists for authenticated users
  if (user) {
    const profileResult = await ensureProfileExists()
    if (!profileResult.success) {
      console.error("Failed to ensure profile exists:", profileResult.error)
    }
  }

  // Check if user has a type in their profile
  let hasType = false
  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single()
    
    if (!error && profile && profile.type) {
      hasType = true
    }
  }

  return <HomePageWrapper user={user} hasType={hasType} />
}
