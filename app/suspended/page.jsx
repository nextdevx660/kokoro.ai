import React from 'react'
import { Lock } from 'lucide-react'

export default function BanPage() {
          return (
                    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
                              {/* Minimalist Lock Icon */}
                              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-black">
                                        <Lock className="h-10 w-10 text-black" strokeWidth={2.5} />
                              </div>

                              {/* Main Heading */}
                              <h1 className="max-w-xl text-5xl font-black uppercase tracking-tighter text-black md:text-7xl">
                                        ACCESS <br /> RESTRICTED
                              </h1>

                              {/* Subtext - English Version */}
                              <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed text-gray-500">
                                        Your account has been suspended for violating our Terms of Service.
                                        If you believe this is a mistake, please contact our support team below.
                              </p>
                              {/* Action Buttons */}
                              <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                                        <button className="min-w-[180px] rounded-full bg-black px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 active:scale-95">
                                                  Contact Support
                                        </button>
                                        <button className="min-w-[180px] rounded-full border-2 border-black bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-zinc-50 active:scale-95">
                                                  Log Out
                                        </button>
                              </div>

                              {/* Footer code/id (optional) */}
                              <div className="mt-24 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-300">
                                        System Status: Restricted
                              </div>
                    </div>
          )
}