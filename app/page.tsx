import { createSupabaseServerClient } from "@/lib/supabase/server"
import { HomePageWrapper } from "@/components/home-page-wrapper"

export default async function Home() {
  const supabase = await createSupabaseServerClient() /*needs async and await since next.js 15*/
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log("Server user:", user?.email)

  return <HomePageWrapper user={user} />
}
