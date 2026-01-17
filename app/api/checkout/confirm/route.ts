import { NextRequest, NextResponse } from "next/server"
import { completeCheckoutSession } from "@/app/actions/store"

export async function POST(request: NextRequest) {
  try {
    // Get token from request body
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      )
    }

    // Call the server action to complete the checkout session
    const result = await completeCheckoutSession(token)

    if (!result.success) {
      // Map server action errors to appropriate HTTP status codes
      let status = 500
      if (result.error === "Authentication required") {
        status = 401
      } else if (result.error === "Admin access required") {
        status = 403
      } else if (result.error === "Invalid or expired token" || result.error?.includes("not found")) {
        status = 404
      } else if (result.error === "Token is required" || result.error === "User has insufficient credits" || result.error === "Session is not pending") {
        status = 400
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    )
  }
}
