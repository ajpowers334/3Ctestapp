"use client"

import { HomePageContent } from "@/components/home-page-content"
import { AuthenticatedView } from "@/components/authenticated-view"
import type { User } from "@supabase/supabase-js"

interface HomePageWrapperProps {
  user: User | null
  hasType: boolean
}

export function HomePageWrapper({ user, hasType }: HomePageWrapperProps) {
  if (user) {
    return <AuthenticatedView hasType={hasType} userId={user.id} />
  }

  return <HomePageContent />
}
