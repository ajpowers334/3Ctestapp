import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home } from "lucide-react"
import { ensureProfileExists } from "@/app/actions/profile"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient() /*needs async and await since next.js 15 or else getUser wont work*/
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

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Button */}
      <div className="container mx-auto px-4 py-4">
        <Button
          asChild
          variant="outline"
          className="flex items-center gap-2"
        >
          <Link href="/">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>

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

