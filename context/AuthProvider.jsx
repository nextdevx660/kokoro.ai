"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
          const [user, setUser] = useState(null)
          const [loading, setLoading] = useState(true)

          useEffect(() => {
                    // 🔹 Get initial user
                    const getUser = async () => {
                              const { data } = await supabase.auth.getUser()
                              setUser(data.user)
                              setLoading(false)
                    }

                    getUser()

                    // 🔹 Listen for auth changes
                    const { data: listener } = supabase.auth.onAuthStateChange(
                              (event, session) => {
                                        setUser(session?.user ?? null)
                              }
                    )

                    // 🔹 Cleanup
                    return () => {
                              listener.subscription.unsubscribe()
                    }
          }, [])

          return (
                    <AuthContext.Provider value={{ user, loading, setUser }}>
                              {children}
                    </AuthContext.Provider>
          )
}

// 🔥 Custom Hook
export const useAuth = () => {
          return useContext(AuthContext)
}