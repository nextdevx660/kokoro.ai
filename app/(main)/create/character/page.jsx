"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";

const initialForm = {
  name: "",
  description: "",
  tag: "",
  prompt: "",
  visibility: "private",
};

export default function CreateCharacterPage() {
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

  const promptLength = useMemo(() => form.prompt.trim().length, [form.prompt]);

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
      setError("Please sign in before creating a character.");
      return;
    }

    if (!imageFile) {
      setError("Please choose a character image.");
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
      payload.append("name", form.name.trim());
      payload.append("description", form.description.trim());
      payload.append("tag", form.tag.trim());
      payload.append("prompt", form.prompt.trim());
      payload.append("visibility", form.visibility);
      payload.append("image", imageFile);

      const response = await fetch("/api/characters", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: payload,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create character.");
      }

      setForm(initialForm);
      setImageFile(null);
      router.push(`/chat/${data.id}`);
    } catch (submitError) {
      console.error("Create character failed:", submitError);
      setError(submitError.message || "Failed to create character.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-white px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: FORM SECTION */}
        <section className="max-w-2xl">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="h-3 w-3" />
              Character Studio
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-black md:text-5xl">
              Create your legend.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Configure your character's persona, visual identity, and access rules.
              Your profile will be stored securely in the Cloud.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Name</label>
                <Input
                  value={form.name}
                  onChange={updateField("name")}
                  placeholder="e.g. Aiko Nightshade"
                  className="h-14 rounded-2xl border-slate-200 bg-white px-4 focus:border-black focus:ring-0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tagline</label>
                <Input
                  value={form.tag}
                  onChange={updateField("tag")}
                  placeholder="e.g. Flirty Hacker"
                  className="h-14 rounded-2xl border-slate-200 bg-white px-4 focus:border-black focus:ring-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
              <textarea
                value={form.description}
                onChange={updateField("description")}
                placeholder="A short intro for the public gallery..."
                className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Prompt Instructions</label>
              <textarea
                value={form.prompt}
                onChange={updateField("prompt")}
                placeholder="Describe behavior, tone, and backstory in detail..."
                className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                required
              />
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
                <span>System Logic</span>
                <span>{promptLength} characters</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Visibility</label>
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
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Visuals</label>
                <label className="flex h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-sm transition hover:border-black">
                  <span className="truncate text-slate-500">
                    {imageFile ? imageFile.name : "Upload Character Image"}
                  </span>
                  <Upload className="h-4 w-4 text-slate-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || loading}
              className="h-14 w-full rounded-2xl bg-black text-sm font-bold uppercase tracking-widest text-white hover:bg-slate-800 disabled:bg-slate-200"
            >
              {submitting ? "Processing..." : "Create Character"}
            </Button>
          </form>
        </section>

        {/* RIGHT: LIVE PREVIEW (THE DARK CARD) */}
        <aside className="sticky top-8 self-start">
          <div className="mb-4 flex items-center justify-between px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Live Preview</p>
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          </div>

          <div className="group relative overflow-hidden rounded-[40px] border border-slate-200 bg-black shadow-2xl">
            <div className="relative aspect-[4/5] overflow-hidden">
              {imagePreviewUrl ? (
                <Image
                  src={imagePreviewUrl}
                  alt="Preview"
                  fill
                  unoptimized
                  className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                  <Upload className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-xs uppercase tracking-widest">Awaiting Image</p>
                </div>
              )}

              {/* Bottom Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              {/* Top Status Badge */}
              <div className="absolute left-6 top-6">
                <div className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  {form.visibility === "public" ? "Public" : "Private"}
                </div>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {form.name.trim() || "Character Name"}
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                {form.tag.trim() || "Category / Role"}
              </p>

              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-300">
                {form.description.trim() || "The public description will appear here..."}
              </p>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Start Chatting</span>
                <span className="text-lg">→</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-50 p-6">
            <p className="text-[11px] leading-relaxed text-slate-500">
              <strong className="text-black">Note:</strong> Public characters can be interacted with by all users. Private characters are strictly linked to your account.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
