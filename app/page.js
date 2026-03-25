'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export default function Page() {
  const router = useRouter()

  const checkIsLoggedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push('/home')
    }
  }


  const signupWithGoogle = async () => {
    const {data, error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `http://localhost:3000/auth/callback/`
      }
    })
  }


  useEffect(() => {
    checkIsLoggedIn()
  }, [])

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 flex flex-col font-sans">
      {/* --- Navbar --- */}
      <div className="sticky top-0 z-50 bg-white md:bg-slate-50">
        <nav className="flex items-center justify-between py-4 px-6 md:px-8 border-b border-gray-200">
          <h1 className="text-black font-semibold text-xl md:text-2xl tracking-tight">(kokoro.ai)</h1>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 md:px-6 text-sm font-bold bg-[#18181b] text-white rounded-full hover:bg-black transition-all"
            >
              Sign Up to Chat
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 md:px-6 text-sm font-bold bg-white text-black rounded-full border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Login
            </button>
          </div>
        </nav>
      </div>

      {/* --- Hero Section --- */}
      <main className="flex-1 flex md:items-center md:justify-center md:p-6 lg:p-12">
        <div className="relative w-full h-full md:h-[600px] max-w-7xl flex items-center">

          {/* 1. The Video Card (Hidden on Mobile, Shows on Desktop) */}
          <div className="hidden md:block absolute right-0 w-[80%] h-full rounded-[2.5rem] overflow-hidden shadow-xl bg-gray-900">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-90"
            >
              <source src="/wizard.mp4" type="video/mp4" />
            </video>
            {/* Soft overlay to blend text/image if needed */}
            <div className="absolute inset-0 bg-black/5"></div>
          </div>

          {/* 2. The Login Card (Full screen on mobile, Floating on Desktop) */}
          <div className="relative z-10 flex flex-col justify-center w-full h-full md:h-auto bg-white px-8 py-12 md:p-10 md:max-w-[400px] lg:max-w-[440px] md:ml-12 md:rounded-[2rem] md:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-0 md:border md:border-gray-100">

            <h2 className="text-[2rem] md:text-4xl font-extrabold text-gray-900 text-center leading-[1.15] tracking-tight">
              Get access to <br /> 10M+ Characters
            </h2>
            <p className="text-gray-600 text-center mt-3 mb-8 text-[15px]">
              Sign up in just ten seconds
            </p>

            <div className="flex flex-col gap-3">
              {/* Google Button */}
              <button className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#18181b] text-white rounded-[1rem] font-semibold hover:bg-black transition-colors"
              onClick={signupWithGoogle}
              >
                {/* Note: Removed the invert class to keep the Google G colored like the original image */}
                <FcGoogle size={24} />
                Continue with Google
              </button>


              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-white px-3 text-gray-400">OR</span>
                </div>
              </div>

              {/* Email Button */}
              <button className="flex items-center justify-center gap-3 w-full py-3.5 bg-white text-black border border-gray-300 rounded-[1rem] font-semibold hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Continue with email
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-8 leading-[1.6]">
              By continuing, you agree with the <br />
              <span className="text-gray-500 font-medium hover:underline cursor-pointer">Terms and Privacy Policy</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}