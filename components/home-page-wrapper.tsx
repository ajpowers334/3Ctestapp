"use client"

import { HomePageContent } from "@/components/home-page-content"
import { AuthenticatedView } from "@/components/authenticated-view"
import type { User } from "@supabase/supabase-js"

interface HomePageWrapperProps {
  user: User | null
}

export function HomePageWrapper({ user }: HomePageWrapperProps) {
  if (user) {
    return <AuthenticatedView />
  }

  return <HomePageContent />
}
