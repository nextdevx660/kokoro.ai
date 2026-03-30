'use client'

import {
          Plus,
          Compass,
          AlignLeft,
          Sparkles,
          Search,
          ChevronsLeft,
          ChevronDown,
          User as UserIcon,
          Settings,
          ShieldCheck,
          LogOut,
          MessageCircle,
          History,
          User2Icon,
          FilmIcon
} from "lucide-react"

import {
          Sidebar,
          SidebarContent,
          SidebarFooter,
          SidebarGroup,
          SidebarGroupContent,
          SidebarHeader,
          SidebarMenu,
          SidebarMenuButton,
          SidebarMenuItem,
          useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { signOutUser } from "@/lib/auth-client"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/context/AuthProvider"
import { useUser } from "@/context/UserContext"
import { usePathname, useRouter } from "next/navigation"
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore"

export function AppSidebar() {
          // const { user, setUser } = useAuth()
          const { userData, setUserData, user } = useUser()
          const { toggleSidebar } = useSidebar()
          const pathname = usePathname()
          const router = useRouter()
          const [isCreateOpen, setIsCreateOpen] = useState(false);
          // Agar click outside close karna hai to iske liye bhi ref use kar sakte ho
          const createDropdownRef = useRef(null);

          // Custom Dropdown State
          const [isDropdownOpen, setIsDropdownOpen] = useState(false)
          const dropdownRef = useRef(null)
          const [chatHistory, setChatHistory] = useState([])
          const [historyLoading, setHistoryLoading] = useState(false)
          const [searchTerm, setSearchTerm] = useState("")

          const avatarUrl = userData?.avatar_url || "";

          useEffect(() => {
                    let active = true

                    async function loadChatHistory() {
                              if (!user) {
                                        setChatHistory([])
                                        return
                              }

                              try {
                                        setHistoryLoading(true)

                                        const chatsQuery = query(
                                                  collection(db, "chats"),
                                                  where("user_id", "==", user.uid),
                                                  orderBy("updated_at", "desc"),
                                                  limit(12)
                                        )
                                        const snapshot = await getDocs(chatsQuery)
                                        const data = snapshot.docs.map((chatDoc) => ({
                                                  id: chatDoc.id,
                                                  ...chatDoc.data(),
                                        }))

                                        if (active) {
                                                  setChatHistory(data || [])
                                        }
                              } catch (error) {
                                        console.error("Failed to load chat history:", error)
                                        if (active) {
                                                  setChatHistory([])
                                        }
                              } finally {
                                        if (active) {
                                                  setHistoryLoading(false)
                                        }
                              }
                    }

                    loadChatHistory()

                    return () => {
                              active = false
                    }
          }, [user, userData?.chat_id, pathname])

          const filteredHistory = chatHistory.filter((chat) => {
                    const normalizedSearch = searchTerm.trim().toLowerCase()

                    if (!normalizedSearch) {
                              return true
                    }

                    const messageText = Array.isArray(chat.messages)
                              ? chat.messages
                                        .map((message) => {
                                                  if (typeof message?.content === "string") {
                                                            return message.content
                                                  }

                                                  if (Array.isArray(message?.content)) {
                                                            return message.content
                                                                      .map((part) => typeof part?.text === "string" ? part.text : "")
                                                                      .join(" ")
                                                  }

                                                  return ""
                                        })
                                        .join(" ")
                              : ""

                    const searchableText = `${chat.character_name || ""} ${chat.character_id || ""} ${messageText}`.toLowerCase()
                    return searchableText.includes(normalizedSearch)
          })

          const formatRelativeDate = (value) => {
                    if (!value) {
                              return ""
                    }

                    const date = new Date(value)
                    const diffMs = Date.now() - date.getTime()
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

                    if (diffHours < 1) {
                              return "just now"
                    }

                    if (diffHours < 24) {
                              return `${diffHours}h ago`
                    }

                    const diffDays = Math.floor(diffHours / 24)
                    if (diffDays < 7) {
                              return `${diffDays}d ago`
                    }

                    return date.toLocaleDateString()
          }

          const getPreview = (messages = []) => {
                    if (!Array.isArray(messages)) {
                              return "Open conversation"
                    }

                    const lastUserMessage = [...messages].reverse().find((message) => message?.role === "user")
                    return lastUserMessage?.content || "Open conversation"
          }

          // Dropdown ke bahar click karne par close karne ka logic
          useEffect(() => {
                    function handleClickOutside(event) {
                              if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                                        setIsDropdownOpen(false)
                              }
                    }
                    document.addEventListener("mousedown", handleClickOutside)
                    return () => document.removeEventListener("mousedown", handleClickOutside)
          }, [])

          const handleLogout = async () => {
                    await signOutUser()
                    setUserData(null)
                    window.location.href = "/" // Ya jo bhi aapka login route ho
          }


          const redirectDiscover = () => {
                    router.push('/home')
          }

          const redirectFeed = () => {
                    router.push('/feed')
          }

          const redirectHome = () => {
                    router.push('/home')
          }
          

          return (
                    <Sidebar className="w-64 bg-[#f9f9fb] border-r-0">
                              {/* Header: Logo and Collapse Icon */}
                              <SidebarHeader className="p-4 flex flex-row items-center justify-between">
                                        <span className="font-bold text-xl tracking-tight cursor-pointer" onClick={() => redirectHome()}>(kokoro.ai)</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 block md:hidden text-gray-400 hover:text-gray-600" onClick={toggleSidebar}>
                                                  <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                              </SidebarHeader>

                              <SidebarContent className="px-3">
                                        <SidebarGroup>
                                                  <SidebarGroupContent>
                                                            <SidebarMenu className="gap-2">
                                                                      {/* Create Button with Dropdown */}
                                                                      <SidebarMenuItem className="mb-2 relative" ref={createDropdownRef}>
                                                                                <Button
                                                                                          variant="secondary"
                                                                                          className={`rounded-full bg-gray-200/80 hover:bg-gray-300/80 text-gray-900 justify-between px-4 py-5 w-[130px] transition-all ${isCreateOpen ? 'ring-2 ring-gray-300' : ''}`}
                                                                                          onClick={() => setIsCreateOpen(!isCreateOpen)}
                                                                                >
                                                                                          <div className="flex items-center">
                                                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                                                    Create
                                                                                          </div>
                                                                                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isCreateOpen ? 'rotate-180' : ''}`} />
                                                                                </Button>

                                                                                {/* Create Dropdown Content */}
                                                                                {isCreateOpen && (
                                                                                          <div className="absolute top-full left-0 mt-2 w-[160px] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                                                    <button
                                                                                                              onClick={() => {
                                                                                                                        router.push("/create/character");
                                                                                                                        setIsCreateOpen(false);
                                                                                                              }}
                                                                                                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                                                    >
                                                                                                              <User2Icon className="h-4 w-4 text-gray-500" />
                                                                                                              Character
                                                                                                    </button>

                                                                                                    <button
                                                                                                              onClick={() => {
                                                                                                                        router.push("/create/scene");
                                                                                                                        setIsCreateOpen(false);
                                                                                                              }}
                                                                                                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                                                    >
                                                                                                              <FilmIcon className="h-4 w-4 text-gray-500" />
                                                                                                              Scene
                                                                                                    </button>
                                                                                          </div>
                                                                                )}
                                                                      </SidebarMenuItem>

                                                                      {/* Navigation Links */}
                                                                      <SidebarMenuItem>
                                                                                <SidebarMenuButton isActive className='bg-gray-200/60 hover:bg-gray-200/80 rounded-xl py-5' onClick={() => redirectDiscover()}>
                                                                                          <Compass className="mr-2 h-5 w-5" />
                                                                                          <span className="font-medium">Discover</span>
                                                                                </SidebarMenuButton>
                                                                      </SidebarMenuItem>

                                                                      <SidebarMenuItem>
                                                                                <SidebarMenuButton className="hover:bg-gray-200/60 text-gray-600 rounded-xl py-5" onClick={() => redirectFeed()}>
                                                                                          <AlignLeft className="mr-2 h-5 w-5" />
                                                                                          <span className="font-medium">Feed</span>
                                                                                </SidebarMenuButton>
                                                                      </SidebarMenuItem>

                                                                      {/* <SidebarMenuItem>
                                                                                <SidebarMenuButton className="hover:bg-purple-100/50 rounded-xl py-5" onClick={() => redirectAvatar()}>
                                                                                          <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
                                                                                          <span className="font-medium text-purple-500">AvatarFX</span>
                                                                                </SidebarMenuButton>
                                                                      </SidebarMenuItem> */}
                                                            </SidebarMenu>
                                                  </SidebarGroupContent>
                                        </SidebarGroup>

                                        {/* Search Bar */}
                                        <SidebarGroup className="mt-2">
                                                  <div className="relative">
                                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                            <Input
                                                                      placeholder="Search"
                                                                      value={searchTerm}
                                                                      onChange={(event) => setSearchTerm(event.target.value)}
                                                                      className="w-full bg-gray-200/60 border-none rounded-xl pl-9 pr-4 py-5 text-sm focus-visible:ring-1 focus-visible:ring-gray-300 placeholder:text-gray-500"
                                                            />
                                                  </div>
                                        </SidebarGroup>

                                        <SidebarGroup className="pt-1">
                                                  <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                                                            <History className="h-3.5 w-3.5" />
                                                            Recent Chats
                                                  </div>

                                                  <SidebarGroupContent>
                                                            <SidebarMenu className="gap-1.5">
                                                                      {historyLoading ? (
                                                                                <div className="px-2 py-3 text-sm text-gray-500">
                                                                                          Loading chats...
                                                                                </div>
                                                                      ) : null}

                                                                      {!historyLoading && user && filteredHistory.length === 0 ? (
                                                                                <div className="px-2 py-3 text-sm text-gray-500">
                                                                                          {searchTerm.trim() ? "No matching chats found." : "No saved chats yet."}
                                                                                </div>
                                                                      ) : null}

                                                                      {!user ? (
                                                                                <div className="px-2 py-3 text-sm text-gray-500">
                                                                                          Sign in to sync chat history.
                                                                                </div>
                                                                      ) : null}

                                                                      {filteredHistory.map((chat) => {
                                                                                const isActive = pathname === `/chat/${chat.character_id}`

                                                                                return (
                                                                                          <SidebarMenuItem key={chat.id}>
                                                                                                    <SidebarMenuButton
                                                                                                              isActive={isActive}
                                                                                                              className={`h-auto items-start rounded-2xl px-3 py-3 ${isActive ? "bg-gray-200/80" : "hover:bg-gray-200/50"}`}
                                                                                                              onClick={() => {
                                                                                                                        router.push(`/chat/${chat.character_id}`)
                                                                                                              }}
                                                                                                    >
                                                                                                              {chat.character_avatar_url ? (
                                                                                                                        <img
                                                                                                                                  src={chat.character_avatar_url}
                                                                                                                                  alt={chat.character_name || "Chat Avatar"}
                                                                                                                                  width={32}
                                                                                                                                  height={32}
                                                                                                                                  className="mr-3 h-8 w-8 rounded-full object-cover"
                                                                                                                        />
                                                                                                              ) : (
                                                                                                                        <MessageCircle className="mt-0.5 mr-3 h-4 w-4 shrink-0 text-gray-500" />
                                                                                                              )}
                                                                                                              <div className="min-w-0 flex-1">
                                                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                                                                  <span className="truncate font-medium text-gray-800">
                                                                                                                                            {chat.character_name || chat.character_id}
                                                                                                                                  </span>
                                                                                                                                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
                                                                                                                                            {formatRelativeDate(chat.updated_at)}
                                                                                                                                  </span>
                                                                                                                        </div>
                                                                                                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                                                                                                                  {getPreview(chat.messages)}
                                                                                                                        </p>
                                                                                                              </div>
                                                                                                    </SidebarMenuButton>
                                                                                          </SidebarMenuItem>
                                                                                )
                                                                      })}
                                                            </SidebarMenu>
                                                  </SidebarGroupContent>
                                        </SidebarGroup>
                              </SidebarContent>

                              <SidebarFooter className="p-4 flex flex-col gap-3 relative">
                                        {/* Upgrade Button */}
                                        <Button
                                                  variant="outline"
                                                  className="w-full justify-center bg-transparent border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-200/50 h-10"
                                                  onClick={() => router.push("/premium")}
                                        >
                                                  Upgrade to (k.ai+)
                                        </Button>

                                        {/* CUSTOM DROPDOWN CONTAINER */}
                                        <div className="relative w-full" ref={dropdownRef}>
                                                  {/* User Profile Trigger */}
                                                  <div
                                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                            className={`flex items-center justify-between w-full p-2 rounded-xl cursor-pointer transition-all duration-200 ${isDropdownOpen ? 'bg-gray-200' : 'hover:bg-gray-200/50'}`}
                                                  >
                                                            <div className="flex items-center gap-3">
                                                                      <Avatar className="h-8 w-8" key={avatarUrl}>
                                                                                <AvatarImage
                                                                                          src={avatarUrl}
                                                                                          referrerPolicy="no-referrer"
                                                                                          alt="User Avatar"
                                                                                />
                                                                                <AvatarFallback>
                                                                                          {userData?.name?.[0] || userData?.email?.[0]?.toUpperCase() || "U"}
                                                                                </AvatarFallback>
                                                                      </Avatar>
                                                                      <span className="text-sm font-medium text-gray-700 truncate max-w-[110px]">
                                                                                {userData?.name || "User"}
                                                                      </span>
                                                            </div>
                                                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                  </div>

                                                  {/* Actual Dropdown Menu Content */}
                                                  {isDropdownOpen && (
                                                            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                                      <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                                                My Account
                                                                      </div>

                                                                      <button
                                                                                onClick={() => {
                                                                                          router.push("/profile")
                                                                                          setIsDropdownOpen(false)
                                                                                }}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                      >
                                                                                <UserIcon className="h-4 w-4 text-gray-500" />
                                                                                Profile
                                                                      </button>

                                                                      <button
                                                                                onClick={() => {
                                                                                          router.push("/settings")
                                                                                          setIsDropdownOpen(false)
                                                                                }}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                      >
                                                                                <Settings className="h-4 w-4 text-gray-500" />
                                                                                Settings
                                                                      </button>

                                                                      <div className="h-[1px] bg-gray-100 my-1" />

                                                                      <button
                                                                                onClick={() => {
                                                                                          router.push("/policy")
                                                                                          setIsDropdownOpen(false)
                                                                                }}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                      >
                                                                                <ShieldCheck className="h-4 w-4 text-gray-500" />
                                                                                Policy
                                                                      </button>

                                                                      <button
                                                                                onClick={handleLogout}
                                                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                      >
                                                                                <LogOut className="h-4 w-4" />
                                                                                Logout
                                                                      </button>
                                                            </div>
                                                  )}
                                        </div>
                              </SidebarFooter>
                    </Sidebar>
          )
}
