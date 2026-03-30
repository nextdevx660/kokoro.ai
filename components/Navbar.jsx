'use client'

import React from 'react'
import { SidebarTrigger } from './ui/sidebar'
import { useAuth } from '@/context/AuthProvider'
import { BsAndroid2, BsSearch } from "react-icons/bs" // Added BsSearch
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { Coins } from 'lucide-react'
import axios from 'axios'
import { getFirebaseAccessToken } from '@/lib/auth-client'
import { FREE_DAILY_TOKENS } from '@/lib/token-system'
import Image from 'next/image'

export default function Navbar() {
  // const { user } = useUser()
  const { userData, setUserData, user } = useUser()
  const avatarUrl = userData?.avatar_url || "";

  // Fallbacks for display if user data is still loading
  const userName = userData?.name || 'user'
  const router = useRouter()
  const isPremiumUser = userData?.plan === "pro" || userData?.plan === "premium"
  const tokenLabel = isPremiumUser
    ? "Unlimited"
    : `${typeof userData?.daily_tokens_remaining === "number"
      ? userData.daily_tokens_remaining
      : FREE_DAILY_TOKENS}`

  React.useEffect(() => {
    let active = true

    async function loadTokenStatus() {
      if (!user) {
        return
      }

      try {
        const accessToken = await getFirebaseAccessToken()

        if (!accessToken) {
          return
        }

        const response = await axios.get('/api/chat', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!active) {
          return
        }

        setUserData((current) =>
          current
            ? {
              ...current,
              plan: response.data.plan,
              daily_tokens_remaining: response.data.remainingTokens,
            }
            : current
        )
      } catch (error) {
        console.error("Failed to load navbar token status:", error)
      }
    }

    loadTokenStatus()

    return () => {
      active = false
    }
  }, [setUserData, user])

  return (
    <div className='sticky top-0 z-50 w-full'>
      <div className='flex items-center justify-between py-3 px-1 md:px-6 w-full bg-[#f8f9fa]'>

        {/* Left Side: Sidebar Trigger + Welcome Text */}
        <div className='flex items-center gap-4'>
          <SidebarTrigger />

          <div className='flex flex-col'>
            <span className='text-[13px] text-slate-500 font-medium'>
              Welcome back,
            </span>
            <div className='flex items-center gap-2 mt-0.5'>
              <Avatar key={avatarUrl}>
                <AvatarImage
                  // Check for avatar_url first, then picture
                  src={avatarUrl}
                  className=""
                  alt="User Avatar"
                  // This is crucial for Google OAuth images
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback>
                  {userData?.user_metadata?.full_name?.[0] || userData?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {/* Username */}
              <h4 className='text-[17px] font-medium text-slate-800 tracking-tight'>
                {userName}
              </h4>
            </div>
          </div>
        </div>

        {/* Right Side: Search & Icon Button */}
        <div className='flex items-center gap-4'>
          <button
            type="button"
            onClick={() => router.push('/premium')}
            className="group flex items-center gap-2 rounded-full transition-all duration-300 hover:border-black active:scale-95"
          >
            {/* Token Icon Container */}
            <div className="flex items-center justify-center rounded-full ">
              <Image
                src={'/t.png'}
                alt="token"
                width={200}
                height={200}
                className="w-5 h-5 object-contain transition-all"
              />
            </div>

            {/* Label */}
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 group-hover:text-black">
              {tokenLabel}
            </span>
          </button>
          {/* Search Input */}
          {/* <div className='hidden md:block'>
            <div className='relative flex items-center'>
              <BsSearch className='absolute left-4 text-slate-400 w-4 h-4' />
              <input
                type="text"
                placeholder="Search"
                className='pl-10 pr-4 py-2 w-[350px] bg-slate-100 hover:bg-slate-200/50 focus:bg-slate-200/70 focus:ring-2 focus:ring-slate-200 transition-all rounded-full text-sm outline-none placeholder:text-slate-400 text-slate-700'
              />
            </div>
          </div> */}

          {/* Right Icon Button */}
          <button className='w-10 h-10 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-slate-700 flex items-center justify-center'
            onClick={() => {
              router.push('/android')
            }}
          >
            <BsAndroid2 className='w-[18px] h-[18px]' />
          </button>
        </div>

      </div>
    </div>
  )
}
