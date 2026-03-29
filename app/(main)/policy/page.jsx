"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Scale,
  Lock,
  AlertTriangle,
  FileText,
  ArrowRight
} from "lucide-react";

const policySections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "1. Acceptance of Terms",
    body: "By using Kokoro.ai, you agree to follow these policies, our platform rules, and any additional feature-specific restrictions that may apply inside the product.",
  },
  {
    id: "eligibility",
    icon: Lock,
    title: "2. Account Responsibility",
    body: "You are responsible for the activity on your account, the accuracy of the information you provide, and the security of your sign-in credentials. Accounts may not be shared for abuse.",
  },
  {
    id: "content",
    icon: ShieldCheck,
    title: "3. User Content",
    body: "You retain responsibility for prompts, images, characters, and chats. You must have the necessary rights to use the content you upload to our platform.",
  },
  {
    id: "prohibited",
    icon: AlertTriangle,
    title: "4. Prohibited Use",
    body: "Illegal conduct, harassment, hate speech, impersonation, or generating non-consensual sexual content is strictly prohibited and will lead to immediate ban.",
  },
  {
    id: "safety",
    icon: Scale,
    title: "5. AI Safety & Moderation",
    body: "We may filter or remove content that creates safety risks. Our moderation uses both automated systems and manual reviews to ensure a safe environment.",
  },
  {
    id: "payments",
    icon: ArrowRight,
    title: "6. Payments & Tokens",
    body: "Paid plans and token usage are subject to pricing and availability. Fraudulent chargebacks or exploitative usage will result in permanent account termination.",
  },
  {
    id: "disclaimer",
    icon: AlertTriangle,
    title: "7. Important Disclaimers",
    body: "AI outputs may be inaccurate or biased. Always review outputs before relying on them for medical, legal, or financial decisions. Use at your own risk.",
  },
];

export default function PolicyPage() {
  const [activeTab, setActiveTab] = useState("acceptance");

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header */}
      <div className="bg-[#0f172a] py-16 text-center text-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Legal & Trust Center
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            Platform Policy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Everything you need to know about how we protect your data, maintain safety, and handle account responsibilities.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-[-40px] max-w-6xl px-4 md:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">

          {/* Quick Navigation Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-6 space-y-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                On this page
              </p>
              {policySections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${activeTab === section.id
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <section.icon className={`h-4 w-4 ${activeTab === section.id ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="truncate">{section.title.split('. ')[1]}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Policy Content */}
          <main className="flex-1 space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
              <div className="prose prose-slate max-w-none">
                <p className="text-sm font-medium text-slate-500">Last Updated: March 2024</p>
                <div className="mt-8 space-y-12">
                  {policySections.map((section) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-10 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          <section.icon className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {section.title}
                        </h2>
                      </div>
                      <p className="mt-4 pl-[52px] text-base leading-8 text-slate-600">
                        {section.body}
                      </p>
                    </section>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-16 rounded-3xl bg-slate-900 p-8 text-center text-white">
                <h3 className="text-xl font-semibold">Questions about our policies?</h3>
                <p className="mt-2 text-slate-400">We're here to help you understand your rights and responsibilities.</p>
                <button className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-200">
                  Contact Support Team
                </button>
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}