'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Lock } from 'lucide-react'
import { useUser } from '@/context/UserContext'

export default function CharacterCard({ allCharacters }) {
          const router = useRouter()
          const { userData } = useUser()

          // Check if user is on a pro plan
          const isProUser = userData?.plan === 'pro'

          const handleAction = (character, isLocked) => {
                    if (!isLocked) {
                              router.push(`/chat/${character.id}`)
                    } else {
                              router.push('/premium')
                    }
          }

          return (
                    <>
                              {allCharacters.map((character, index) => {
                                        const isLocked = !character?.isFree && !isProUser;

                                        return (
                                                  <div
                                                            key={index}
                                                            onClick={() => handleAction(character, isLocked)}
                                                            className="group relative cursor-pointer overflow-hidden rounded-[32px] border border-slate-200 bg-white transition-all duration-500 hover:border-black hover:shadow-xl"
                                                  >
                                                            {/* Image Container */}
                                                            <div
                                                                      className={`relative aspect-[3/4] overflow-hidden transition-all duration-700 ${isLocked ? "grayscale" : "grayscale-0 group-hover:grayscale-0"
                                                                                }`}
                                                            >
                                                                      <Image
                                                                                src={character?.avatarUrl}
                                                                                alt={character?.name}
                                                                                fill
                                                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                                      />

                                                                      {/* Subtle overlay for text legibility */}
                                                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                                            </div>

                                                            {/* Lock Overlay - Clean & Minimal */}
                                                            {isLocked && (
                                                                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/20 backdrop-blur-[2px]">
                                                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-2xl">
                                                                                          <Lock className="h-6 w-6 text-black" />
                                                                                </div>
                                                                                <span className="mt-4 rounded-full bg-black px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                                                                                          Unlock Premium
                                                                                </span>
                                                                      </div>
                                                            )}

                                                            {/* Content Area */}
                                                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                                                                      <div className="flex items-center justify-between gap-2">
                                                                                <h3 className="text-xl font-bold tracking-tight">
                                                                                          {character?.name}
                                                                                </h3>

                                                                                {!character?.isFree && isProUser && (
                                                                                          <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter backdrop-blur-md">
                                                                                                    Pro
                                                                                          </span>
                                                                                )}
                                                                      </div>

                                                                      <p className="mt-1 line-clamp-1 text-xs font-light text-slate-200">
                                                                                {character?.description}
                                                                      </p>

                                                                      {/* Action indicator - disappears when locked to keep it clean */}
                                                                      {!isLocked && (
                                                                                <div className="mt-4 flex items-center text-[10px] font-bold uppercase tracking-widest opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                                                                                          Start Chatting
                                                                                          <span className="ml-1">→</span>
                                                                                </div>
                                                                      )}
                                                            </div>
                                                  </div>
                                        );
                              })}
                    </>
          )
}