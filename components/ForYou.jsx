import Image from 'next/image';
import React from 'react';
import { MessageSquare } from 'lucide-react'; // Optional: Use lucide-react for the icon

export default function ForYou({ forYou }) {
          return (
                    <div className="">
                              <h2 className="text-lg font-semibold text-black pb-2 px-2">For you</h2>

                              {/* Horizontal scrolling container */}
                              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                        {forYou.map((item, i) => (
                                                  <div
                                                            key={i}
                                                            className="flex min-w-[320px] max-w-[350px] bg-[#f3f4f6] rounded-2xl p-3 hover:bg-gray-200 transition-colors cursor-pointer"
                                                  >
                                                            {/* Image Section */}
                                                            <div className="relative w-24 h-24 flex-shrink-0">
                                                                      <Image
                                                                                src={item.avatarUrl}
                                                                                alt={item.name}
                                                                                fill
                                                                                className="rounded-xl object-cover"
                                                                      />
                                                            </div>

                                                            {/* Content Section */}
                                                            <div className="ml-4 flex flex-col justify-between">
                                                                      <div>
                                                                                <h3 className="font-bold text-gray-900 leading-tight line-clamp-1">
                                                                                          {item.name}
                                                                                </h3>
                                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                                          By @{item.author || 'System'}
                                                                                </p>
                                                                                <p className="text-sm text-gray-700 mt-2 line-clamp-2 leading-snug">
                                                                                          {item.description}
                                                                                </p>
                                                                      </div>

                                                                      {/* Tag / Interaction Count */}
                                                                      <div className="flex items-center text-gray-500 text-xs mt-2">
                                                                                <MessageSquare className="w-3 h-3 mr-1" />
                                                                                <span>{item.tag}</span>
                                                                      </div>
                                                            </div>
                                                  </div>
                                        ))}
                              </div>
                    </div>
          );
}