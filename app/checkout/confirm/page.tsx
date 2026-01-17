import { Suspense } from "react"
import CheckoutConfirm from "./checkout-confirm"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function LoadingFallback() {
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
          <Loader2 className="h-12 w-12 animate-spin text-[#185859]" />
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutConfirm />
    </Suspense>
  )
}
