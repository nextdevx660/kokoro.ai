"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getBillingProfile } from "@/lib/billing-storage"
import { supabase } from "@/lib/supabase"

// Create Context
const UserContext = createContext()

// Provider Component
export const UserProvider = ({ children }) => {
          const [user, setUser] = useState(null)
          const [userData, setUserData] = useState(null)
          const [loading, setLoading] = useState(true)

          const syncSupabasePlan = async () => {
                    const { data: { session } } = await supabase.auth.getSession()

                    if (!session?.access_token) {
                              return null
                    }

                    const response = await fetch("/api/billing/sync-plan", {
                              method: "POST",
                              headers: {
                                        Authorization: `Bearer ${session.access_token}`,
                              },
                    })

                    const payload = await response.json().catch(() => null)

                    if (!response.ok) {
                              throw new Error(payload?.error || "Failed to sync billing plan.")
                    }

                    return payload?.profile || null
          }

          const mergeBillingPlan = async (profile) => {
                    if (!profile?.id) {
                              return profile
                    }

                    try {
                              const billingProfile = await getBillingProfile(profile.id)

                              if (billingProfile?.plan === "pro" || billingProfile?.plan === "premium") {
                                        if (profile.plan !== billingProfile.plan) {
                                                  try {
                                                            const syncedProfile = await syncSupabasePlan()

                                                            if (syncedProfile) {
                                                                      return syncedProfile
                                                            }
                                                  } catch (syncError) {
                                                            console.log("Billing sync error:", syncError)
                                                  }
                                        }

                                        return {
                                                  ...profile,
                                                  plan: billingProfile.plan,
                                        }
                              }
                    } catch (billingError) {
                              console.log("Billing profile read error:", billingError)
                    }

                    return profile
          }

          useEffect(() => {
                    const getUserAndData = async () => {
                              setLoading(true)

                              // 1. Get Auth User
                              const { data: { user }, error } = await supabase.auth.getUser()

                              if (error) {
                                        console.log("Auth Error:", error)
                                        setLoading(false)
                                        return
                              }

                              setUser(user)

                              if (!user) {
                                        setLoading(false)
                                        return
                              }

                              // 2. Get User Data from DB
                              const { data, error: dbError } = await supabase
                                        .from("users")
                                        .select("*")
                                        .eq("id", user.id)
                                        .single()

                              if (dbError) {
                                        console.log("DB Error:", dbError)
                              } else {
                                        const mergedProfile = await mergeBillingPlan(data)
                                        setUserData(mergedProfile)
                              }

                              setLoading(false)
                    }

                    getUserAndData()

                    // 🔥 Realtime Auth Listener
                    const { data: listener } = supabase.auth.onAuthStateChange(
                              async (event, session) => {
                                        const currentUser = session?.user || null
                                        setUser(currentUser)

                                        if (currentUser) {
                                                  const { data } = await supabase
                                                            .from("users")
                                                            .select("*")
                                                            .eq("id", currentUser.id)
                                                            .single()

                                                  const mergedProfile = await mergeBillingPlan(data)
                                                  setUserData(mergedProfile)
                                        } else {
                                                  setUserData(null)
                                        }
                              }
                    )

                    return () => {
                              listener.subscription.unsubscribe()
                    }
          }, [])

          return (
                    <UserContext.Provider value={{ user, userData, loading, setUserData }}>
                              {children}
                    </UserContext.Provider>
          )
}

// Custom Hook
export const useUser = () => {
          return useContext(UserContext)
}
