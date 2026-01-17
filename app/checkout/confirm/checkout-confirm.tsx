"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function CheckoutConfirm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "checking">("checking")
  const [message, setMessage] = useState("")
  const token = searchParams.get("token")

  useEffect(() => {
    const confirmCheckout = async () => {
      if (!token) {
        setStatus("error")
        setMessage("No token provided")
        return
      }

      try {
        // Call the API endpoint to confirm the checkout
        const response = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.success) {
          setStatus("success")
          setMessage(`Transaction confirmed! Item: ${data.data.item}`)
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to confirm transaction")
        }
      } catch (error) {
        setStatus("error")
        setMessage("An error occurred while confirming the transaction")
        console.error("Checkout confirmation error:", error)
      }
    }

    // Check authentication first
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          // Not authenticated, redirect to home (login page)
          router.push("/")
          return
        }

        // User is authenticated, proceed with confirmation
        setStatus("loading")
        await confirmCheckout()
      } catch (error) {
        setStatus("error")
        setMessage("Failed to verify authentication")
        console.error("Auth check error:", error)
      }
    }

    checkAuth()
  }, [token, router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Checkout Confirmation</CardTitle>
          <CardDescription className="text-center">
            Processing your transaction...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "checking" || status === "loading" ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-[#185859]" />
              <p className="text-center text-muted-foreground">
                {status === "checking" ? "Verifying authentication..." : "Confirming transaction..."}
              </p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center font-medium text-green-600">{message}</p>
              <Button asChild className="mt-4">
                <Link href="/">Return to Home</Link>
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center font-medium text-red-600">{message}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/">Return to Home</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
