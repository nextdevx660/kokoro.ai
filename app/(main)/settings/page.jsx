"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Globe,
  Loader2,
  MoonStar,
  Shield,
  Sparkles,
  UserCog,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getFirebaseAccessToken } from "@/lib/auth-client";

const initialToggles = {
  emailAnnouncements: true,
  productUpdates: true,
  privateProfile: false,
  safeMode: true,
  language: "English",
  theme: "System default",
};

// Cleaned up Toggle Switch
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${checked ? "bg-black" : "bg-slate-200"
        }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${checked ? "translate-x-5" : "-translate-x-3"
          } mt-0.5`}
      />
    </button>
  );
}

export default function Page() {
  const { userData, setUserData } = useUser();
  const [toggles, setToggles] = useState(initialToggles);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // Load Initial Settings
  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        const accessToken = await getFirebaseAccessToken();

        if (!accessToken) throw new Error("Session expired. Please sign in again.");

        const response = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.error || "Failed to load settings.");
        if (!active) return;

        setToggles({ ...initialToggles, ...payload.settings });
        setUserData((current) =>
          current ? { ...current, settings: payload.settings } : current
        );
      } catch (loadError) {
        if (active) setError(loadError.message || "Failed to load settings.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, [setUserData]);

  // Update specific setting
  async function updateSettings(nextSettings, key) {
    const previous = toggles;
    setToggles(nextSettings);
    setSavingKey(key);
    setStatus("");
    setError("");

    try {
      const accessToken = await getFirebaseAccessToken();

      if (!accessToken) throw new Error("Session expired.");

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: nextSettings }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to update settings.");

      setToggles(payload.settings);
      setUserData((current) =>
        current ? { ...current, settings: payload.settings } : current
      );
      setStatus("Settings saved successfully.");

      // Auto-hide success message after 3 seconds
      setTimeout(() => setStatus(""), 3000);
    } catch (saveError) {
      setToggles(previous);
      setError(saveError.message || "Failed to update settings.");
    } finally {
      setSavingKey("");
    }
  }

  const settingsGroups = useMemo(
    () => [
      {
        title: "Account Experience",
        items: [
          {
            icon: UserCog,
            title: "Profile visibility",
            detail: toggles.privateProfile ? "Private" : "Public inside app",
            saveKey: "privateProfile",
            action: (
              <Toggle
                checked={toggles.privateProfile}
                onChange={() =>
                  updateSettings({ ...toggles, privateProfile: !toggles.privateProfile }, "privateProfile")
                }
              />
            ),
          },
          {
            icon: Shield,
            title: "Safe mode",
            detail: "Filter explicit content",
            saveKey: "safeMode",
            action: (
              <Toggle
                checked={toggles.safeMode}
                onChange={() => updateSettings({ ...toggles, safeMode: !toggles.safeMode }, "safeMode")}
              />
            ),
          },
        ],
      },
      {
        title: "Preferences",
        items: [
          {
            icon: Globe,
            title: "Language",
            detail: "Platform default language",
            saveKey: "language",
            action: (
              <select
                value={toggles.language || "English"}
                onChange={(e) => updateSettings({ ...toggles, language: e.target.value }, "language")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            ),
          },
          {
            icon: MoonStar,
            title: "Theme",
            detail: "App appearance",
            saveKey: "theme",
            action: (
              <select
                value={toggles.theme || "System default"}
                onChange={(e) => updateSettings({ ...toggles, theme: e.target.value }, "theme")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="System default">System default</option>
                <option value="Light">Light</option>
                <option value="Dark">Dark</option>
              </select>
            ),
          },
        ],
      },
      {
        title: "Notifications",
        items: [
          {
            icon: Bell,
            title: "Product updates",
            detail: "New features & launches",
            saveKey: "productUpdates",
            action: (
              <Toggle
                checked={toggles.productUpdates}
                onChange={() => updateSettings({ ...toggles, productUpdates: !toggles.productUpdates }, "productUpdates")}
              />
            ),
          },
          {
            icon: Sparkles,
            title: "Email announcements",
            detail: "Promotions & highlights",
            saveKey: "emailAnnouncements",
            action: (
              <Toggle
                checked={toggles.emailAnnouncements}
                onChange={() => updateSettings({ ...toggles, emailAnnouncements: !toggles.emailAnnouncements }, "emailAnnouncements")}
              />
            ),
          },
        ],
      },
    ],
    [toggles]
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-6 md:px-8 lg:py-10">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header section */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your app preferences and notifications.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {status && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {status}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">

          {/* User Snapshot Card (Left side on desktop, top on mobile) */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 truncate">
              {userData?.name || "User"}
            </h2>
            <p className="text-sm text-slate-500 truncate">
              {userData?.email || "No email"}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Plan</p>
                <p className="mt-1 font-medium capitalize text-slate-700">{userData?.plan || "Free"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Daily Tokens</p>
                <p className="mt-1 font-medium text-slate-700">
                  {typeof userData?.daily_tokens_remaining === "number"
                    ? userData.daily_tokens_remaining
                    : "∞"}
                </p>
              </div>
            </div>
          </div>

          {/* Settings Groups (Right side on desktop, bottom on mobile) */}
          <div className="space-y-6">
            {settingsGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">{group.title}</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-center justify-between gap-4 px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500 truncate">{item.detail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {savingKey === item.saveKey && (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          )}
                          {item.action}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
