'use client'
import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Zap } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function Demoness({ demoness }) {
          const router = useRouter();
          const { userData } = useUser(); // Logic for checking the plan

          // Example: user.plan can be 'free' or 'premium'

          const handleCardClick = (item) => {
                    router.push(`/chat/${item.id}`);
          };
// console.log(demoness);

          return (
                    <div className="pt-8 w-full bg-white overflow-hidden">
                              {/* Header Section - Minimalist Black & White */}
                              <div className="flex justify-between items-end mb-8 px-4">
                                        <div>
                                                  <div className="flex items-center gap-2 mb-1">
                                                            <Zap className="text-black w-4 h-4 fill-black" />
                                                            <span className="text-[10px] font-bold text-black uppercase tracking-[0.3em]">Exclusive</span>
                                                  </div>
                                                  <h2 className="text-4xl font-black text-black uppercase tracking-tighter">
                                                            BDSM Queen
                                                  </h2>
                                        </div>
                              </div>

                              {/* Horizontal Scroll Container */}
                              <div className="flex gap-4 overflow-x-auto pb-10 px-4 no-scrollbar snap-x snap-mandatory">
                                        {demoness.map((item, i) => {
                                                  // isLocked logic can be removed or modified to only control the "PRO" tag
                                                  // const isLocked = !item.isFree && isUserFree;

                                                  return (
                                                            <div
                                                                      key={i}
                                                                      onClick={() => handleCardClick(item)}
                                                                      className="relative flex-shrink-0 w-[200px] aspect-[2/3] group cursor-pointer snap-start"
                                                            >
                                                                      {/* Main Card */}
                                                                      <div className="relative h-full w-full bg-gray-100 rounded-sm overflow-hidden border border-black/5 shadow-sm group-hover:shadow-xl transition-all duration-500">

                                                                                {/* Image */}
                                                                                <Image
                                                                                          src={item.avatarUrl}
                                                                                          alt={item.name}
                                                                                          fill
                                                                                          className="object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
                                                                                />

                                                                                {/* Removed Locked State Overlay */}

                                                                                {/* Bottom Gradient for Text (Always visible now) */}
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />

                                                                                {/* Text Content */}
                                                                                <div className="absolute bottom-0 p-5 w-full z-20">
                                                                                          <h3 className="text-white text-xl font-black leading-tight uppercase tracking-tight">
                                                                                                    {item.name}
                                                                                          </h3>

                                                                                          {/* Info Row */}
                                                                                          <div className="flex items-center justify-between mt-2">
                                                                                                    <span className="text-[9px] font-medium text-gray-300 uppercase tracking-widest">
                                                                                                              {item.tag || 'Demoness'}
                                                                                                    </span>
                                                                                                    {!item.isFree && (
                                                                                                              <div className="flex items-center gap-1">
                                                                                                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                                                                                                        <span className="text-[9px] text-white font-bold tracking-tighter italic">PRO</span>
                                                                                                              </div>
                                                                                                    )}
                                                                                          </div>
                                                                                </div>
                                                                      </div>
                                                            </div>
                                                  );
                                        })}

                                        <div className="min-w-[40px] h-full flex-shrink-0"></div>
                              </div>
                    </div>
          );
}