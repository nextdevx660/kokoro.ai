"use client";
import React, { useEffect, useState } from 'react';
import { Sparkles, AudioLines } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const CharacterHero = () => {
          const [images, setImages] = useState([]);
          const router = useRouter()

          // Fetch images from the waifu API
          useEffect(() => {
                    const fetchImages = async () => {
                              const fetches = Array(8).fill(0).map(() =>
                                        fetch('https://api.waifu.pics/sfw/waifu').then(res => res.json())
                              );
                              const results = await Promise.all(fetches);
                              setImages(results.map(r => r.url));
                    };
                    fetchImages();
          }, []);

          const handleClick = () => {
                    router.push('/create/character')
          }

          return (
                    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden p-4">

                              {/* Background Floating Elements */}
                              <div className="absolute inset-0 pointer-events-none">
                                        {images.map((url, i) => (
                                                  <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0 }}
                                                            animate={{
                                                                      opacity: 1,
                                                                      y: [0, -20, 0],
                                                            }}
                                                            transition={{
                                                                      duration: 4 + i,
                                                                      repeat: Infinity,
                                                                      ease: "easeInOut"
                                                            }}
                                                            className="absolute rounded-full shadow-lg overflow-hidden border-2 border-white"
                                                            style={{
                                                                      width: i % 2 === 0 ? '60px' : '40px',
                                                                      height: i % 2 === 0 ? '60px' : '40px',
                                                                      top: `${Math.random() * 80}%`,
                                                                      left: `${Math.random() * 90}%`,
                                                            }}
                                                  >
                                                            <img src={url} alt="scattered char" className="w-full h-full object-cover" />
                                                  </motion.div>
                                        ))}

                                        {/* Lucide Audio Icons & Tags */}
                                        <div className="absolute top-[20%] left-[10%] opacity-20"><AudioLines size={48} /></div>
                                        <div className="absolute bottom-[30%] right-[15%] opacity-20"><AudioLines size={32} /></div>

                                        <div className="absolute top-[40%] left-[15%] bg-gray-200 px-4 py-2 rounded-full text-sm font-medium text-gray-600">witty</div>
                                        <div className="absolute top-[15%] right-[10%] bg-gray-200 px-4 py-2 rounded-full text-sm font-medium text-gray-400">mentor</div>
                              </div>

                              {/* Main Content Container */}
                              <div className="relative z-10 flex flex-col items-center max-w-2xl text-center">

                                        {/* Central Card Stack */}
                                        <div className="relative flex items-center justify-center mb-12 h-64 w-full">
                                                  {/* Side Cards */}
                                                  <div className="absolute left-[15%] w-32 h-44 bg-gray-300 rounded-2xl rotate-[-5deg] overflow-hidden opacity-80 shadow-md">
                                                            <img src={images[0]} className="w-full h-full object-cover grayscale" />
                                                  </div>
                                                  <div className="absolute right-[15%] w-32 h-44 bg-gray-300 rounded-2xl rotate-[5deg] overflow-hidden opacity-80 shadow-md">
                                                            <img src={images[1]} className="w-full h-full object-cover grayscale" />
                                                  </div>

                                                  {/* Main Focus Card */}
                                                  <motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            className="relative z-20 w-48 h-48 bg-blue-600 rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                                                  >
                                                            <img src={images[2]} alt="Main Character" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                  </motion.div>
                                        </div>

                                        {/* Text Section */}
                                        <h1 className="text-5xl font-bold text-gray-800 mb-6">Create a Character</h1>
                                        <p className="text-gray-500 text-lg mb-10 px-8 leading-relaxed">
                                                  Try Character.AI, the #1 AI chat app. Endless Characters. Infinite adventures.
                                                  And a community of creators just like you.
                                        </p>

                                        {/* CTA Button */}
                                        <button className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                                                  onClick={()=> handleClick()}
                                        >
                                                  <Sparkles size={20} className="text-white" />
                                                  Create a Character
                                        </button>
                              </div>
                    </div>
          );
};

export default CharacterHero;