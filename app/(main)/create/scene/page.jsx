"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Compass, CompassIcon, Globe2, Globe2Icon, Loader2, Loader2Icon, Lock, Sparkles, SparklesIcon, Upload, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";

const initialForm = {
  playerName: "",
  worldName: "",
  genre: "",
  setting: "",
  tone: "",
  promptDescription: "",
  visibility: "private",
};

export default function CreateScenePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const summary = useMemo(() => {
    if (
      !form.playerName &&
      !form.worldName &&
      !form.genre &&
      !form.setting &&
      !form.tone
    ) {
      return "Shape your world and step into it.";
    }

    return `${form.playerName || "You"} enter ${form.worldName || "your custom world"
      }, a ${form.tone || "cinematic"} ${form.genre || "custom"
      } world set in ${form.setting || "a time of your choice"}.`;
  }, [form]);

  function updateField(field) {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  function handleImageChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setImageFile(nextFile);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      setError("Please sign in before creating a world.");
      return;
    }

    if (!imageFile) {
      setError("Please choose a world image.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const payload = new FormData();
      payload.append("playerName", form.playerName.trim());
      payload.append("worldName", form.worldName.trim());
      payload.append("genre", form.genre.trim());
      payload.append("setting", form.setting.trim());
      payload.append("tone", form.tone.trim());
      payload.append("promptDescription", form.promptDescription.trim());
      payload.append("visibility", form.visibility);
      payload.append("image", imageFile);

      const response = await fetch("/api/scenes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: payload,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create scene.");
      }

      setForm(initialForm);
      setImageFile(null);
      router.push(`/chat/${data.id}`);
    } catch (submitError) {
      console.error("Create scene failed:", submitError);
      setError(submitError.message || "Failed to create scene.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-white px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: FORM SECTION (WHITE THEME) */}
        <section className="max-w-2xl">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="h-3 w-3" />
              Scene Builder
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-black md:text-5xl">
              Build your world.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Define the setting, tone, and narrative rules. Once initialized, the system
              will drop you directly into the life you've designed.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Identity Assumption</label>
                <Input
                  value={form.playerName}
                  onChange={updateField("playerName")}
                  placeholder="Character name you become"
                  className="h-14 rounded-2xl border-slate-200 bg-white px-4 focus:border-black focus:ring-0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">World Designation</label>
                <Input
                  value={form.worldName}
                  onChange={updateField("worldName")}
                  placeholder="Custom world name"
                  className="h-14 rounded-2xl border-slate-200 bg-white px-4 focus:border-black focus:ring-0"
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Atmospheric Genre</label>
                <Input
                  value={form.genre}
                  onChange={updateField("genre")}
                  placeholder="e.g. Cyberpunk Romance"
                  className="h-14 rounded-2xl border-slate-200 bg-white px-4 focus:border-black focus:ring-0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Emotional Tone</label>
                <Input
                  value={form.tone}
                  onChange={updateField("tone")}
                  placeholder="e.g. Dark, Suspenseful"
                  className="h-14 rounded-2xl border-slate-200 bg-white px-4 focus:border-black focus:ring-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Spatiotemporal Setting</label>
              <Input
                value={form.setting}
                onChange={updateField("setting")}
                placeholder="e.g. Neo Tokyo, Year 2098"
                className="h-14 rounded-2xl border-slate-200 bg-white px-4 focus:border-black focus:ring-0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Narrative Blueprint</label>
              <textarea
                value={form.promptDescription}
                onChange={updateField("promptDescription")}
                placeholder="Describe the dream life, world rules, and interaction goals..."
                className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">World Visibility</label>
                <select
                  value={form.visibility}
                  onChange={updateField("visibility")}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-black appearance-none"
                >
                  <option value="private">Private (Only Me)</option>
                  <option value="public">Public (Everyone)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">World Visuals</label>
                <label className="flex h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-sm transition hover:border-black">
                  <span className="truncate text-slate-500">
                    {imageFile ? imageFile.name : "Upload World Image"}
                  </span>
                  <UploadCloud className="h-4 w-4 text-slate-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || loading}
              className="h-14 w-full rounded-2xl bg-black text-sm font-bold uppercase tracking-widest text-white hover:bg-slate-800 disabled:bg-slate-200 transition-all shadow-lg hover:shadow-black/10"
            >
              {submitting ? "Opening Portal..." : "Create Scene"}
            </Button>
          </form>
        </section>

        {/* RIGHT: LIVE PREVIEW (THE DARK PREVIEW CARD) */}
        <aside className="sticky top-8 self-start">
          <div className="mb-4 flex items-center justify-between px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Atmospheric Preview</p>
            <div className="h-2 w-2 animate-pulse rounded-full bg-black" />
          </div>

          <div className="group relative overflow-hidden rounded-[40px] border border-slate-200 bg-black shadow-2xl">
            <div className="relative aspect-[4/5] overflow-hidden">
              {imagePreviewUrl ? (
                <Image
                  src={imagePreviewUrl}
                  alt="World Preview"
                  fill
                  unoptimized
                  className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                  <Globe2Icon className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-xs uppercase tracking-widest">Awaiting Visuals</p>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              <div className="absolute left-6 top-6">
                <div className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  {form.visibility === "public" ? "Public World" : "Private Session"}
                </div>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {form.worldName.trim() || "Your Custom World"}
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                {form.genre.trim() || "Genre"} • {form.setting.trim() || "Location"}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/10 px-3 py-1 text-[10px] font-bold uppercase text-white border border-white/10">
                  Identity: {form.playerName || "TBD"}
                </span>
                <span className="rounded-lg bg-white/10 px-3 py-1 text-[10px] font-bold uppercase text-white border border-white/10">
                  Tone: {form.tone || "TBD"}
                </span>
              </div>

              <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-slate-300">
                {form.promptDescription.trim() || "The dream brief will materialize here..."}
              </p>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 group-hover:text-white transition-colors text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-widest">Manifest Reality</span>
                <span className="text-lg">→</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-50 p-6 border border-slate-100">
            <p className="text-[11px] leading-relaxed text-slate-500">
              <strong className="text-black">Protocol:</strong> Worlds are generated based on your Blueprint. Private worlds are encrypted to your session, while Public worlds join the Shared Reality gallery.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
