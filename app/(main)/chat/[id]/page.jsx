"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, SendHorizontal, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { useUser } from "@/context/UserContext";
import ReactMarkdown from "react-markdown";
import { getFirebaseAccessToken } from "@/lib/auth-client";
import { FREE_DAILY_TOKENS } from "@/lib/token-system";
import {
  getStoredChat,
  saveActiveChatId,
  saveChatSession,
} from "@/lib/chat-storage";

const WELCOME_MESSAGE = (character) => ({
  role: "assistant",
  content: character?.isScene
    ? `You are now inside ${character.name}. You are ${character.playerName}. What do you do first?`
    : `Hey, I'm ${character?.name}. What do you want to talk about?`,
});

const markdownComponents = {
  p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
  ul: ({ children }) => <ul className="ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[13px]">
        {children}
      </code>
    ) : (
      <code className="block overflow-x-auto rounded-xl bg-black px-3 py-2 font-mono text-[13px] text-white">
        {children}
      </code>
    ),
  pre: ({ children }) => <pre className="my-3 overflow-x-auto">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-slate-300 pl-3 italic text-slate-600">
      {children}
    </blockquote>
  ),
};

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  // const { user, loading: authLoading } = useAuth();
  const { setUserData, userData, user, loading: authLoading } = useUser();
  const [character, setCharacter] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingCharacter, setLoadingCharacter] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [ttsLoadingIndex, setTtsLoadingIndex] = useState(null);
  const [tokenState, setTokenState] = useState(null);
  const bottomRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const storageKey = `chat-history:${id}`;
  const remainingTokens =
    tokenState?.remainingTokens ??
    userData?.daily_tokens_remaining ??
    FREE_DAILY_TOKENS;
  const isBlocked = Boolean(tokenState?.isBlocked);
  const isPremium = Boolean(
    tokenState?.isPremium ||
      userData?.plan === "pro" ||
      userData?.plan === "premium"
  );

  function syncTokenState(nextTokenState) {
    setTokenState(nextTokenState);
    setUserData((current) =>
      current
        ? {
            ...current,
            plan: nextTokenState.plan,
            daily_tokens_remaining: nextTokenState.remainingTokens,
          }
        : current
    );
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    let active = true;

    async function loadCharacter() {
      try {
        setLoadingCharacter(true);
        setError("");

        const accessToken = await getFirebaseAccessToken();
        const headers = accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined;
        const response = await axios.get(`/api/characters/${id}`, { headers });

        if (!active) {
          return;
        }

        setCharacter(response.data);
      } catch (loadError) {
        console.error("Failed to load character:", loadError);

        if (active) {
          setError("Could not load this character.");
        }
      } finally {
        if (active) {
          setLoadingCharacter(false);
        }
      }
    }

    if (id) {
      loadCharacter();
    }

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadConversation() {
      if (!character || authLoading) {
        if (!authLoading && !character) {
          setLoadingConversation(false);
        }
        return;
      }

      try {
        setLoadingConversation(true);

        if (user) {
          const storedChat = await getStoredChat({
            userId: user.uid,
            characterId: character.id,
          });

          if (!active) {
            return;
          }

          if (storedChat) {
            setChatId(storedChat.id);
            setMessages(
              Array.isArray(storedChat.messages) && storedChat.messages.length
                ? storedChat.messages
                : [WELCOME_MESSAGE(character)]
            );
          } else {
            setChatId(null);
            setMessages([WELCOME_MESSAGE(character)]);
          }
        } else {
          const savedMessages =
            typeof window !== "undefined"
              ? window.localStorage.getItem(storageKey)
              : null;

          setChatId(null);
          setMessages(
            savedMessages
              ? JSON.parse(savedMessages)
              : [WELCOME_MESSAGE(character)]
          );
        }
      } catch (conversationError) {
        console.error("Failed to load saved conversation:", conversationError);

        if (active) {
          setError("Chat loaded, but saved history could not be restored.");
          setMessages([WELCOME_MESSAGE(character)]);
        }
      } finally {
        if (active) {
          setLoadingConversation(false);
        }
      }
    }

    loadConversation();

    return () => {
      active = false;
    };
  }, [authLoading, character, storageKey, user]);

  useEffect(() => {
    let active = true;

    async function loadTokenState() {
      if (authLoading) {
        return;
      }

      if (!user) {
        if (active) {
          setTokenState(null);
        }
        return;
      }

      try {
        setLoadingTokens(true);
        const accessToken = await getFirebaseAccessToken();

        if (!accessToken) {
          throw new Error("Please sign in to use your daily chat tokens.");
        }

        const response = await axios.get("/api/chat", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (active) {
          syncTokenState(response.data);
        }
      } catch (tokenError) {
        console.error("Failed to load token state:", tokenError);

        if (active) {
          setError(
            tokenError.response?.data?.error ||
              tokenError.message ||
              "Failed to load token status."
          );
        }
      } finally {
        if (active) {
          setLoadingTokens(false);
        }
      }
    }

    loadTokenState();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!messages.length || typeof window === "undefined" || user) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey, user]);

  async function persistConversation(nextMessages, existingChatId = chatId) {
    if (!character) {
      return existingChatId;
    }

    if (!user) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(nextMessages));
      }

      return null;
    }

    const savedChatId = await saveChatSession({
      chatId: existingChatId,
      userId: user.uid,
      character,
      messages: nextMessages,
    });

    await saveActiveChatId(user.uid, savedChatId);
    setChatId(savedChatId);
    setUserData((current) =>
      current ? { ...current, chat_id: savedChatId } : current
    );

    return savedChatId;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const content = draft.trim();

    if (!content || sending || !character || loadingTokens) {
      return;
    }

    if (!user) {
      setError("Please sign in to use your daily free messages.");
      return;
    }

    if (isBlocked) {
      setError("Your 20 free daily messages are finished. Buy a membership to continue.");
      router.push("/premium");
      return;
    }

    const nextMessages = [...messages, { role: "user", content }];
    setDraft("");
    setMessages(nextMessages);
    setSending(true);
    setError("");

    try {
      const accessToken = await getFirebaseAccessToken();

      if (!accessToken) {
        throw new Error("Please sign in again to continue chatting.");
      }

      const response = await axios.post("/api/chat", {
        characterId: character.id,
        messages: nextMessages,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const fullConversation = [
        ...nextMessages,
        { role: "assistant", content: response.data.reply },
      ];

      setMessages(fullConversation);
      syncTokenState(response.data.tokenState);
      await persistConversation(fullConversation);
    } catch (sendError) {
      console.error("Chat request failed:", sendError);
      setMessages((currentMessages) => currentMessages.slice(0, -1));
      setDraft(content);

      const apiError = sendError.response?.data;
      if (apiError?.redirectTo) {
        if (apiError.plan && typeof apiError.remainingTokens === "number") {
          syncTokenState({
            plan: apiError.plan,
            remainingTokens: apiError.remainingTokens,
            isPremium: false,
            isBlocked: true,
          });
        }
        setError(apiError.error || "Your free messages are finished.");
        router.push(apiError.redirectTo);
      } else {
        setError(apiError?.error || sendError.message || "Failed to send your message.");
      }
    } finally {
      setSending(false);
    }
  }

  function clearConversation() {
    if (!character) {
      return;
    }

    const resetMessages = [WELCOME_MESSAGE(character)];
    setMessages(resetMessages);
    setError("");

    persistConversation(resetMessages).catch((persistError) => {
      console.error("Failed to reset saved chat:", persistError);
    });
  }

  async function handleSpeak(message, index) {
    if (!message?.content?.trim()) {
      return;
    }

    if (speakingIndex === index && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setSpeakingIndex(null);
      setTtsLoadingIndex(null);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      setTtsLoadingIndex(index);
      setError("");

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message.content,
          voiceId:
            character?.elevenLabsVoiceId ||
            character?.elevenlabsVoiceId ||
            character?.voiceId ||
            character?.ttsVoiceId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeakingIndex(null);
        setTtsLoadingIndex(null);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeakingIndex(null);
        setTtsLoadingIndex(null);
        setError("Audio playback failed.");
      };

      await audio.play();
      setSpeakingIndex(index);
    } catch (ttsError) {
      console.error("TTS failed:", ttsError);
      setError(ttsError.message || "Failed to play voice.");
      setSpeakingIndex(null);
    } finally {
      setTtsLoadingIndex(null);
    }
  }

  if (loadingCharacter || loadingConversation || authLoading) {
    return (
      <div className="flex h-[calc(100vh-72px)] flex-col bg-white p-4 md:p-6 no-scrollbar">
        <div className="mx-auto w-full max-w-3xl animate-pulse space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="h-12 w-12 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-3 w-48 rounded bg-slate-50" />
            </div>
          </div>

          {/* Messages Skeleton */}
          <div className="space-y-6">
            <div className="h-16 w-3/4 rounded-2xl bg-slate-100" />
            <div className="ml-auto h-12 w-1/2 rounded-2xl bg-slate-200" />
            <div className="h-20 w-2/3 rounded-2xl bg-slate-100" />
            <div className="ml-auto h-16 w-3/4 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }


  if (error && !character) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-white p-6 no-scrollbar">
        <div className="max-w-md w-full text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-black mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 border border-slate-100 bg-slate-50 rounded-2xl px-6 py-4">
            {error}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6 bg-black text-white hover:bg-slate-800 rounded-xl px-8"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-72px)] flex-col bg-white text-black no-scrollbar">
      {/* Header Section - Clean & Minimal */}
      <section className="border-b border-slate-100 bg-white p-4 md:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-4">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image
                src={character.avatarUrl}
                alt={character.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{character.name}</h1>
              <p className="text-xs text-slate-500 line-clamp-1">{character.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {isPremium
                ? "Premium plan"
                : loadingTokens
                  ? "Loading tokens..."
                  : `${remainingTokens} / ${FREE_DAILY_TOKENS} free messages left`}
            </div> */}
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-slate-400 hover:text-red-500"
              onClick={clearConversation}
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </section>

      {/* Chat Messages - This part scrolls */}
      <section className="flex-1 overflow-y-auto px-4 py-6 md:px-0 no-scrollbar">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed md:max-w-[80%] ${isUser
                    ? "bg-black text-white shadow-sm"
                    : "bg-slate-100 text-black"
                    }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="space-y-3">
                      <ReactMarkdown components={markdownComponents}>
                        {message.content}
                      </ReactMarkdown>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSpeak(message, index)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          {ttsLoadingIndex === index ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : speakingIndex === index ? (
                            <Square className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                          {ttsLoadingIndex === index
                            ? "Generating voice..."
                            : speakingIndex === index
                              ? "Stop voice"
                              : "Play voice"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending ? (
            <div className="flex justify-start">
              <div className="text-sm italic text-slate-400">
                {character.name} is typing...
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </section>

      {/* Input Area - Fixed at the bottom */}
      <section className="border-t border-slate-100 bg-white p-4 pb-6 md:pb-8">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  !user
                    ? "Sign in to use your daily free messages..."
                    : isBlocked
                      ? "Free messages finished. Upgrade to continue..."
                      : `Ask ${character.name} anything...`
                }
                className="h-14 w-full rounded-2xl border-slate-200 bg-slate-50 pr-12 text-black focus-visible:ring-black"
                disabled={!user || isBlocked || loadingTokens || sending}
              />
              {error && (
                <p className="absolute -top-6 left-2 text-xs text-red-500">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={sending || !draft.trim() || !user || isBlocked || loadingTokens}
              className="h-14 w-14 rounded-2xl bg-black p-0 text-white hover:bg-slate-800 disabled:bg-slate-200"
            >
              <SendHorizontal size={20} />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            {isBlocked
              ? "Your free quota is used up. Upgrade membership on /premium to keep chatting."
              : "Each message costs 1 token. Free users get 20 tokens every day."}
          </p>
        </div>
      </section>
    </div>
  );
}
