import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); /*needs async and await since next.js 15*/

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This is fine, because we're not attempting to set cookies in a
          // Server Component.
          // You would only need this if using the client in a Server Action
          // or Route Handler where response headers can be set.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          // Same catch logic as the set method
        }
      },
    },
  }
);
}