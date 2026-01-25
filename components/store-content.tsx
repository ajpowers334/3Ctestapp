"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Candy, Gift, CreditCard, Coins, Home, CheckCircle2, Package, type LucideIcon } from "lucide-react"
import { getCredits } from "@/app/actions/credits"
import { createCheckoutSession, expireCheckoutSession, getCheckoutSessionStatus, type StoreItem } from "@/app/actions/store"
import { QRCodeSVG } from "qrcode.react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

// Icon mapping - maps item names to Lucide icons
// Add more mappings here as you add new items to the store
const iconMap: Record<string, LucideIcon> = {
  "Candy": Candy,
  "Toy": Gift,
  "Gift Card": CreditCard,
}

// Color mapping - maps item names to Tailwind gradient classes
// Add more mappings here as you add new items to the store
const colorMap: Record<string, string> = {
  "Candy": "from-pink-500 to-rose-500",
  "Toy": "from-blue-500 to-cyan-500",
  "Gift Card": "from-purple-500 to-indigo-500",
}

// Default values for items not in the mappings
const defaultIcon = Package
const defaultColor = "from-gray-500 to-gray-600"

interface StoreContentProps {
  userId: string
  initialCredits: number
  initialItems: StoreItem[]
}

interface CheckoutData {
  checkoutUrl: string
  sessionId: string
  itemName: string
  cost: number
}

export function StoreContent({ userId, initialCredits, initialItems }: StoreContentProps) {
  const [credits, setCredits] = useState(initialCredits)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [sessionStatus, setSessionStatus] = useState<"pending" | "completed" | "expired">("pending")
  const channelRef = useRef<any>(null)

  useEffect(() => {
    // Refresh credits on mount
    const refreshCredits = async () => {
      const result = await getCredits(userId)
      if (result.success) {
        setCredits(result.credits)
      }
    }
    refreshCredits()
  }, [userId])

  // Set up real-time subscription to listen for checkout session status changes
  useEffect(() => {
    if (!checkoutData?.sessionId || !showQRCode) {
      return
    }

    // Check initial status when dialog opens (using server action)
    const checkInitialStatus = async () => {
      const result = await getCheckoutSessionStatus(checkoutData.sessionId)
      
      if (result.success && result.status) {
        setSessionStatus(result.status)
        if (result.status === "completed") {
          // Refresh credits if already completed
          const creditsResult = await getCredits(userId)
          if (creditsResult.success) {
            setCredits(creditsResult.credits)
          }
        }
      } else {
        // Default to pending if we can't fetch status
        setSessionStatus("pending")
      }
    }

    checkInitialStatus()

    // Subscribe to changes for this specific checkout session
    const channel = supabase
      .channel(`checkout-session-${checkoutData.sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "checkout_sessions",
          filter: `id=eq.${checkoutData.sessionId}`,
        },
        (payload) => {
          console.log("Checkout session updated:", payload)
          const newStatus = payload.new.status as "pending" | "completed" | "expired"
          setSessionStatus(newStatus)

          // If completed, refresh credits and show success
          if (newStatus === "completed") {
            // Refresh credits to show updated balance
            getCredits(userId).then((result) => {
              if (result.success) {
                setCredits(result.credits)
              }
            })
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup subscription when component unmounts or dialog closes
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [checkoutData?.sessionId, showQRCode, userId])

  const handlePurchase = async (itemName: string, cost: number) => {
    if (isProcessing) return

    if (credits < cost) {
      alert(`Not enough credits! You need ${cost - credits} more credits.`)
      return
    }

    setIsProcessing(true)

    try {
      // Create checkout session (this will also check credits and create the session)
      const checkoutResult = await createCheckoutSession(itemName, cost)

      if (checkoutResult.success && checkoutResult.data) {
        // Credits will be deducted when admin confirms the transaction
        // Store checkout data and show QR code
        setCheckoutData({
          checkoutUrl: checkoutResult.data.checkoutUrl,
          sessionId: checkoutResult.data.sessionId,
          itemName: checkoutResult.data.itemName,
          cost: checkoutResult.data.cost,
        })
        setShowQRCode(true)
      } else {
        alert(checkoutResult.error || "Failed to create checkout session. Please try again.")
        // Refresh credits to get the latest balance
        const refreshResult = await getCredits(userId)
        if (refreshResult.success) {
          setCredits(refreshResult.credits)
        }
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
      const refreshResult = await getCredits(userId)
      if (refreshResult.success) {
        setCredits(refreshResult.credits)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Navigation Button */}
        <div className="mb-4">
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

        {/* Store Status Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 px-6 py-3 rounded-full mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-2xl font-bold text-green-600">OPEN</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">3C's Credit Store</h1>
          <p className="text-muted-foreground">Use your earned credits to purchase rewards</p>
        </div>

        {/* Credits Balance */}
        <Card className="max-w-md mx-auto p-6 mb-12 bg-gradient-to-br from-[#185859] to-[#A04F36] shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Coins className="w-6 h-6 text-[#E2A966]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/80 font-medium">Your Balance</p>
              <p className="text-3xl font-bold text-white">{credits} Credits</p>
            </div>
          </div>
        </Card>

        {/* Store Items Grid */}
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {initialItems.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items available in the store right now.</p>
            </div>
          ) : (
            initialItems.map((item) => {
              const Icon = iconMap[item.name] || defaultIcon
              const color = colorMap[item.name] || defaultColor
              const canAfford = credits >= item.value

              return (
                <Card
                  key={item.id}
                  className="p-6 flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-shadow"
                >
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.stock} in stock</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#185859]">
                    <Coins className="w-5 h-5" />
                    <span className="text-2xl font-bold">{item.value}</span>
                  </div>
                  <Button
                    onClick={() => handlePurchase(item.name, item.value)}
                    disabled={!canAfford || isProcessing}
                    className={`w-full ${
                      canAfford && !isProcessing
                        ? "bg-[#185859] hover:bg-[#185859]/90 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isProcessing
                      ? "Processing..."
                      : canAfford
                        ? "Purchase"
                        : "Not Enough Credits"}
                  </Button>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog 
        open={showQRCode} 
        onOpenChange={async (open: boolean) => {
          if (!open && checkoutData) {
            // Clean up real-time subscription
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current)
              channelRef.current = null
            }

            // Only expire if still pending (not completed)
            if (sessionStatus === "pending") {
              console.log("Closing QR dialog, expiring session:", checkoutData.sessionId)
              const result = await expireCheckoutSession(checkoutData.sessionId)
              if (!result.success) {
                console.error("Failed to expire checkout session:", result.error)
              } else {
                console.log("Session expired successfully:", result.data)
              }
            }
            
            // Reset state
            setCheckoutData(null)
            setSessionStatus("pending")
          }
          setShowQRCode(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {sessionStatus === "completed" ? "Transaction Completed!" : "Checkout QR Code"}
            </DialogTitle>
            <DialogDescription>
              {sessionStatus === "completed" 
                ? `Your purchase of ${checkoutData?.itemName} has been confirmed!`
                : `Show this QR code to complete your purchase of ${checkoutData?.itemName}`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {checkoutData && (
              <>
                {sessionStatus === "completed" ? (
                  // Show green checkmark when completed
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-20 h-20 text-green-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-semibold text-green-600">Purchase Confirmed!</p>
                      <p className="text-sm font-medium text-muted-foreground">Item: {checkoutData.itemName}</p>
                      <p className="text-sm font-medium text-muted-foreground">Cost: {checkoutData.cost} Credits</p>
                      <p className="text-xs text-muted-foreground mt-4">
                        Your credits have been deducted. Thank you for your purchase!
                      </p>
                    </div>
                  </div>
                ) : (
                  // Show QR code when pending
                  <>
                    <div className="bg-white p-4 rounded-lg">
                      <QRCodeSVG
                        value={checkoutData.checkoutUrl}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Item: {checkoutData.itemName}</p>
                      <p className="text-sm font-medium text-muted-foreground">Cost: {checkoutData.cost} Credits</p>
                      <p className="text-xs text-muted-foreground mt-4">
                        Keep this QR code visible until your purchase is confirmed
                      </p>
                      <p className="text-xs text-red-500 mt-2">
                        Closing this dialog will expire the checkout session
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
