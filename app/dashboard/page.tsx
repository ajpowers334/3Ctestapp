import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient() /*needs async and await since next.js 15 or else getUser wont work*/
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>Your signed-in email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{user.email ?? "Unknown email"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

