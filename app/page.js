'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { FcGoogle } from "react-icons/fc";
import { IoClose } from "react-icons/io5"; // Close icon ke liye

export default function Page() {
  const router = useRouter()

  // Modal aur Form States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const buildAvatarUrl = (displayName) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`

  const signupWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      },
    })

    if (error) {
      alert(error.message)
    }
  }


  useEffect(() => {
    const storeUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const displayName = user.user_metadata?.name || user.email || 'Unknown User'

      const { error } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: displayName,
        avatar_url: buildAvatarUrl(displayName),
        isBan: false,
        isSuspend: false,
        isVerified: true,
      })

      if (error) {
        console.error('Failed to store user data:', error)
      }
    }
    storeUserData()
    checkUserAndRedirect()
  }, [])

  // Email Signup Function
  const handleEmailSignup = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name }
      }
    })

    if (error) {
      alert(error.message)
    } else {
      // User table me entry (agar trigger nahi set kiya hai to)
      if (data.user) {
        const { error: profileError } = await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email,
          name: name,
          avatar_url: buildAvatarUrl(name),
          isBan: false,
          isSuspend: false,
          isVerified: false,
        })

        if (profileError) {
          alert(profileError.message)
          setLoading(false)
          return
        }
        router.push('/home')
        setIsModalOpen(false)
      }
    }
    setLoading(false)
  }

  const checkUserAndRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) router.push('/home')
  }

  useEffect(() => {
    checkUserAndRedirect()
  }, [])

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 flex flex-col font-sans relative">

      {/* --- Navbar --- */}
      <div className="sticky top-0 z-40 bg-white md:bg-slate-50">
        <nav className="flex items-center justify-between py-4 px-6 md:px-8 border-b border-gray-200">
          <h1 className="text-black font-semibold text-xl md:text-2xl tracking-tight">(kokoro.ai)</h1>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 md:px-6 text-sm font-bold bg-[#18181b] text-white rounded-full hover:bg-black transition-all">
              Sign Up
            </button>
          </div>
        </nav>
      </div>

      {/* --- Hero Section --- */}
      <main className="flex-1 flex md:items-center md:justify-center md:p-6 lg:p-12">
        <div className="relative w-full h-full md:h-[600px] max-w-7xl flex items-center">

          <div className="hidden md:block absolute right-0 w-[80%] h-full rounded-[2.5rem] overflow-hidden shadow-xl bg-gray-900">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90">
              <source src="/wizard.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="relative z-10 flex flex-col justify-center w-full h-full md:h-auto bg-white px-8 py-12 md:p-10 md:max-w-[400px] lg:max-w-[440px] md:ml-12 md:rounded-[2rem] md:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-0 md:border md:border-gray-100">
            <h2 className="text-[2rem] md:text-4xl font-extrabold text-gray-900 text-center leading-[1.15] tracking-tight">
              Get access to <br /> 10M+ Characters
            </h2>
            <p className="text-gray-600 text-center mt-3 mb-8 text-[15px]">Sign up in just ten seconds</p>

            <div className="flex flex-col gap-3">
              <button onClick={signupWithGoogle} className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#18181b] text-white rounded-[1rem] font-semibold hover:bg-black transition-colors">
                <FcGoogle size={24} /> Continue with Google
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-white px-3 text-gray-400">OR</span>
                </div>
              </div>

              {/* Continue with Email button opens modal */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-3 w-full py-3.5 bg-white text-black border border-gray-300 rounded-[1rem] font-semibold hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Continue with email
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- SIGNUP MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)} // Background click se close hoga
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <IoClose size={24} className="text-gray-500" />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Create Account</h3>
              <p className="text-gray-500 text-sm mt-1">Join the kokoro.ai community today.</p>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#18181b] text-white rounded-[1rem] font-bold mt-4 hover:bg-black transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-[11px] text-gray-400 text-center mt-6">
              By signing up, you agree to our <span className="underline cursor-pointer">Terms of Service</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
