"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Crown,
  Image as ImageIcon,
  MessageCircleMore,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import PayPalUpgradeButton from "@/components/PayPalUpgradeButton";
import { useUser } from "@/context/UserContext";

const proFeatures = [
  {
    icon: Zap,
    title: "Unlimited Tokens",
    desc: "Daily limit hat jata hai aur Pro users ko unlimited chat access milta hai.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: ShieldAlert,
    title: "Priority Access",
    desc: "Platform ke premium flows aur future member-only upgrades ke liye faster access.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: Users,
    title: "Pro Characters",
    desc: "Exclusive characters aur premium unlocks ko access karne ke liye Pro badge.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: ImageIcon,
    title: "Pro Scenes",
    desc: "Premium scenes aur richer experiences ko unlock karne ke liye upgrade path ready.",
    color: "bg-blue-100 text-blue-600",
  },
];

export default function PremiumPage() {
  const { userData } = useUser();
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const isPro = useMemo(
    () => userData?.plan === "pro" || userData?.plan === "premium",
    [userData?.plan]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_50%)] px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-600 shadow-sm">
            <Crown className="h-4 w-4 fill-amber-500" />
            Premium Membership
          </div>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Chat Without Limits.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            PayPal se upgrade karo. Payment complete hote hi database me aapka
            `plan` automatically `pro` ho jayega aur unlimited access unlock ho
            jayega.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {proFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-[32px] border border-slate-200 bg-white/60 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${feature.color} transition-transform group-hover:scale-110`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-slate-100 bg-slate-50/50 p-8 md:border-b-0 md:border-r md:p-12">
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Current Plan
              </h4>
              <p className="mt-2 text-3xl font-bold text-slate-800">
                {isPro ? "Kokoro Pro" : "Free Tier"}
              </p>

              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-slate-300" />
                  <span>
                    {isPro ? "Unlimited usage active" : "20 free messages per day"}
                  </span>
                </li>
                <li
                  className={`flex items-center gap-3 ${
                    isPro
                      ? "text-slate-600"
                      : "text-slate-400 line-through"
                  }`}
                >
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      isPro ? "text-emerald-500" : "text-slate-300"
                    }`}
                  />
                  <span>Pro access enabled on successful payment</span>
                </li>
                <li
                  className={`flex items-center gap-3 ${
                    isPro
                      ? "text-slate-600"
                      : "text-slate-400 line-through"
                  }`}
                >
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      isPro ? "text-emerald-500" : "text-slate-300"
                    }`}
                  />
                  <span>Priority premium unlock path</span>
                </li>
              </ul>

              <div
                className={`mt-12 rounded-2xl p-4 ${
                  isPro
                    ? "border border-emerald-100 bg-emerald-50"
                    : "border border-red-100 bg-red-50"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-tight ${
                    isPro ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  Status: {isPro ? "Pro Active" : "Upgrade Available"}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full ${
                      isPro ? "w-full bg-emerald-500" : "w-1/3 bg-red-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-8 md:p-12">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-100/50 blur-3xl" />

              <h4 className="text-sm font-bold uppercase tracking-widest text-amber-600">
                Recommended
              </h4>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                Kokoro Pro
              </p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900">$9.99</span>
                <span className="font-medium text-slate-500">one-time</span>
              </p>

              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 font-semibold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 fill-emerald-50 text-emerald-500" />
                  <span>Unlimited chat access</span>
                </li>
                <li className="flex items-center gap-3 font-semibold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 fill-emerald-50 text-emerald-500" />
                  <span>Plan updated in Pro after capture</span>
                </li>
                <li className="flex items-center gap-3 font-semibold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 fill-emerald-50 text-emerald-500" />
                  <span>Payment logged for upgrade audit trail</span>
                </li>
              </ul>

              <div className="mt-10 flex flex-col gap-3">
                {isPro ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white">
                    <CheckCircle2 className="h-4 w-4" />
                    Pro plan active
                  </div>
                ) : (
                  <PayPalUpgradeButton onError={setCheckoutMessage} />
                )}

                <Link
                  href="/home"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-transparent px-8 py-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <MessageCircleMore className="h-4 w-4" />
                  Back to Discover
                </Link>

                {checkoutMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {checkoutMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          Secure checkout via PayPal. After a successful capture, the backend
          updates your `users.plan` to `pro`.
        </p>
      </div>
    </div>
  );
}
