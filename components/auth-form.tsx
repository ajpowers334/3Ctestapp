"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { createProfile } from "@/app/actions/profile"

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error fetching session:", error)
        return
      }
      console.log("Client session:", data.session)
    }

    fetchSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (isSignUp) {
      // Sign up validation
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!")
        setIsSubmitting(false)
        return
      }

      // Sign up with Supabase (client-side)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        console.error(error)
        alert(error.message)
        setIsSubmitting(false)
        return
      }

      if (data.user) {
        console.log("User signed up:", data.user)
        
        // Create profile after successful signup using the user ID and email from the response
        const result = await createProfile(data.user.id, formData.email)
        
        if (result.success) {
          alert("Check your email to confirm your account.")
        } else {
          // Don't show error if profile creation fails - user can still confirm email
          // Profile will be created when they sign in after confirmation
          console.log("Profile creation result:", result)
          alert("Check your email to confirm your account.")
        }
      }
    } else {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        console.error(error)
        alert(error.message)
      } else {
        console.log("User signed in:", data.session)
        alert("You are now signed in!")
      }
    }
    
    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    // Reset form when switching modes
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
        <CardDescription>
          {isSignUp ? "Create a new account to get started" : "Welcome back! Please sign in to continue"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <Button type="button" variant="link" onClick={toggleMode} className="ml-1 p-0">
              {isSignUp ? "Sign In" : "Sign Up"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
