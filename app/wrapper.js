'use client'

import { useUser } from '@/context/UserContext'
import { useRouter, usePathname } from 'next/navigation'
import React, { useEffect } from 'react'

export default function Wrapper({ children }) {
          const { userData, loading } = useUser() // Maan lete hain context me loading state hai
          const router = useRouter()
          const pathname = usePathname()

          useEffect(() => {
                    // Agar loading khatam ho gayi hai aur user banned ya suspended hai
                    if ((userData?.isBan || userData?.isSuspend)) {

                              // Infinite loop se bachne ke liye check: agar user pehle se /ban par hai toh wapas redirect mat karo
                              if (pathname !== '/suspended') {
                                        router.push('/suspended')
                              }
                    }
          }, [])

          // Jab tak data load ho raha ho ya user banned hai (aur redirect ho raha hai), 
          // tab tak kuch show mat karo (taaki content flash na ho)
          // if (loading) return null

          if ((userData?.isBan || userData?.isSuspend) && pathname !== '/suspended') {
                    return null
          }

          return (
                    <>
                              {children}
                    </>
          )
}