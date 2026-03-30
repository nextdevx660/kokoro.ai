'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Apple, Monitor, Sparkles, CheckCircle2, Lock, Gift } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export default function ComingSoonPage() {
          const [email, setEmail] = useState("")
          const [loading, setLoading] = useState(false)
          const [submitted, setSubmitted] = useState(false)
          const [errorMessage, setErrorMessage] = useState("")

          const handleSubmit = async (e) => {
                    e.preventDefault()
                    const normalizedEmail = email.trim()
                    if (!normalizedEmail) return

                    setLoading(true)
                    setErrorMessage("")
                    try {
                              await addDoc(collection(db, "waitlist"), {
                                        email: normalizedEmail,
                                        joinedAt: serverTimestamp(),
                                        source: 'mobile_launch_page',
                                        status: 'pending_pro_access'
                              })
                              setSubmitted(true)
                    } catch (error) {
                              console.error("Error adding document: ", error)
                              setErrorMessage("Email submit nahi ho paya. Thodi der baad phir try karo.")
                    } finally {
                              setLoading(false)
                    }
          }

          return (
                    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50">
                              {/* Premium Background Elements */}
                              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-[120px] -z-10 animate-pulse" />
                              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px] -z-10" />

                              <div className="max-w-3xl w-full px-6 text-center space-y-10 relative">

                                        {/* Scarcity Badge */}
                                        <div className="flex justify-center">
                                                  <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border-purple-100 text-purple-700 shadow-sm flex gap-2 items-center">
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span className="font-semibold">Founder&apos;s Access: 142/500 spots left</span>
                                                  </Badge>
                                        </div>

                                        {/* Hero Section */}
                                        <div className="space-y-6">
                                                  <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900">
                                                            kokoro <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500">Mobile</span>
                                                  </h1>
                                                  <p className="text-xl text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
                                                            Your AI companions, now in your pocket. Experience a new era of digital connection.
                                                  </p>
                                        </div>

                                        {/* Incentivized Waitlist Form */}
                                        {!submitted ? (
                                                  <div className="bg-white/70 backdrop-blur-xl border border-white p-2 rounded-[2.5rem] shadow-2xl shadow-purple-200/50 max-w-lg mx-auto transition-all hover:shadow-purple-300/40">
                                                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                                                                      <div className="relative flex-1">
                                                                                <Input
                                                                                          type="email"
                                                                                          required
                                                                                          value={email}
                                                                                          onChange={(e) => setEmail(e.target.value)}
                                                                                          placeholder="Enter your email"
                                                                                          className="rounded-full bg-transparent border-none h-14 px-8 text-lg focus-visible:ring-0 placeholder:text-slate-400"
                                                                                />
                                                                      </div>
                                                                      <Button
                                                                                type="submit"
                                                                                disabled={loading}
                                                                                className="rounded-full h-14 px-10 bg-slate-900 hover:bg-black text-white font-bold text-lg transition-all active:scale-95"
                                                                      >
                                                                                {loading ? "Joining..." : "Get 1 Month Pro Free"}
                                                                      </Button>
                                                            </form>
                                                            {errorMessage ? (
                                                                      <p className="px-4 pb-3 text-sm text-red-500">
                                                                                {errorMessage}
                                                                      </p>
                                                            ) : null}
                                                  </div>
                                        ) : (
                                                  <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500">
                                                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                                                      <CheckCircle2 className="text-green-600 w-8 h-8" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-slate-900">You&apos;re on the list!</h3>
                                                            <p className="text-slate-500">Check your inbox soon for your Pro Access invite.</p>
                                                  </div>
                                        )}

                                        {/* Curiosity / FOMO Perks */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
                                                  <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-left space-y-2">
                                                            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                                                      <Gift className="w-4 h-4" />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-800">Early Bird Perk</p>
                                                            <p className="text-xs text-slate-500">Pre-register now for 30 days of complimentary Pro features.</p>
                                                  </div>
                                                  <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-left space-y-2">
                                                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                                      <Lock className="w-4 h-4" />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-800">Exclusive ID</p>
                                                            <p className="text-xs text-slate-500">Secure your unique @username before the public launch.</p>
                                                  </div>
                                                  <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-left space-y-2">
                                                            <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                                                                      <Sparkles className="w-4 h-4" />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-800">Beta Testing</p>
                                                            <p className="text-xs text-slate-500">Be the first to test our high-memory companion models.</p>
                                                  </div>
                                        </div>

                                        {/* Platform Roadmap */}
                                        <div className="pt-8 flex justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                                                  <div className="flex flex-col items-center gap-2">
                                                            <Apple className="w-7 h-7" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">TestFlight</span>
                                                  </div>
                                                  <div className="flex flex-col items-center gap-2">
                                                            <Smartphone className="w-7 h-7" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Play Store</span>
                                                  </div>
                                                  <div className="flex flex-col items-center gap-2">
                                                            <Monitor className="w-7 h-7" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Web App</span>
                                                  </div>
                                        </div>
                              </div>

                              <p className="absolute bottom-8 text-xs font-bold text-slate-400 tracking-widest uppercase">
                                        Launching Spring 2026
                              </p>
                    </div>
          )
}
