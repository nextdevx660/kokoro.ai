"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Mail, Save, User2 } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useUser } from "@/context/UserContext";
import { getFirebaseAccessToken } from "@/lib/auth-client";

export default function Page() {
          const router = useRouter();
          // const { user, loading: authLoading } = useAuth();
          const { userData, setUserData, user, loading: authLoading } = useUser();

          const [profile, setProfile] = useState(null);
          const [name, setName] = useState("");
          const [selectedImage, setSelectedImage] = useState(null);
          const [previewUrl, setPreviewUrl] = useState("");
          const [pageLoading, setPageLoading] = useState(true);
          const [saving, setSaving] = useState(false);
          const [error, setError] = useState("");
          const [success, setSuccess] = useState("");

          // Handle local image preview
          useEffect(() => {
                    if (!selectedImage) return undefined;

                    const objectUrl = URL.createObjectURL(selectedImage);
                    setPreviewUrl(objectUrl);

                    return () => URL.revokeObjectURL(objectUrl);
          }, [selectedImage]);

          // Protect route
          useEffect(() => {
                    if (!authLoading && !user) {
                              router.push("/");
                    }
          }, [authLoading, router, user]);

          // Fetch initial profile data
          useEffect(() => {
                    let active = true;

                    async function loadProfile() {
                              if (!user) {
                                        setPageLoading(false);
                                        return;
                              }

                              try {
                                        setPageLoading(true);
                                        setError("");

                                        const accessToken = await getFirebaseAccessToken();

                                        if (!accessToken) throw new Error("Session expired. Please sign in again.");

                                        const response = await fetch("/api/profile", {
                                                  headers: { Authorization: `Bearer ${accessToken}` },
                                        });

                                        const payload = await response.json();

                                        if (!response.ok) throw new Error(payload.error || "Failed to load profile.");
                                        if (!active) return;

                                        setProfile(payload.profile);
                                        setName(payload.profile?.name || user.user_metadata?.name || "");
                              } catch (loadError) {
                                        if (active) setError(loadError.message || "Failed to load profile.");
                              } finally {
                                        if (active) setPageLoading(false);
                              }
                    }

                    loadProfile();

                    return () => {
                              active = false;
                    };
          }, [user]);

          const avatarUrl = previewUrl || profile?.avatar_url || userData?.avatar_url || "";

          async function handleSubmit(event) {
                    event.preventDefault();

                    if (!user) {
                              setError("Please sign in again.");
                              return;
                    }

                    try {
                              setSaving(true);
                              setError("");
                              setSuccess("");

                              const accessToken = await getFirebaseAccessToken();

                              if (!accessToken) throw new Error("Session expired. Please sign in again.");

                              const formData = new FormData();
                              formData.append("name", name.trim());

                              if (selectedImage) {
                                        formData.append("image", selectedImage);
                              }

                              const response = await fetch("/api/profile", {
                                        method: "POST",
                                        headers: { Authorization: `Bearer ${accessToken}` },
                                        body: formData,
                              });

                              const payload = await response.json();

                              if (!response.ok) throw new Error(payload.error || "Failed to update profile.");

                              setProfile(payload.profile);
                              setUserData(payload.profile);
                              setSelectedImage(null);
                              setPreviewUrl("");
                              setSuccess("Profile updated successfully.");
                    } catch (saveError) {
                              setError(saveError.message || "Failed to update profile.");
                    } finally {
                              setSaving(false);
                    }
          }

          if (authLoading || pageLoading) {
                    return (
                              <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 md:px-6">
                                        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                  Loading profile...
                                        </div>
                              </div>
                    );
          }

          return (
                    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-8 lg:py-10">
                              <div className="mx-auto max-w-2xl">
                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:rounded-[32px] md:shadow-lg">

                                                  {/* Header */}
                                                  <div className="border-b border-slate-200 bg-slate-900 px-6 py-6 text-white md:px-10 md:py-8">
                                                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                                                      Manage Profile
                                                            </h1>
                                                            <p className="mt-2 text-sm text-slate-300 md:text-base">
                                                                      Update your photo and personal details.
                                                            </p>
                                                  </div>

                                                  {/* Form Content */}
                                                  <div className="p-6 md:p-10">
                                                            <form onSubmit={handleSubmit} className="space-y-8">

                                                                      {/* Profile Photo Section */}
                                                                      <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
                                                                                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-slate-50 bg-slate-200 shadow-sm md:h-28 md:w-28">
                                                                                          {avatarUrl ? (
                                                                                                    <Image
                                                                                                              src={avatarUrl}
                                                                                                              alt="Profile photo"
                                                                                                              fill
                                                                                                              className="object-cover"
                                                                                                              unoptimized
                                                                                                    />
                                                                                          ) : (
                                                                                                    <div className="flex h-full items-center justify-center text-3xl font-semibold text-slate-500">
                                                                                                              {(name || profile?.email || "U")[0]?.toUpperCase()}
                                                                                                    </div>
                                                                                          )}
                                                                                </div>

                                                                                <div className="flex-1">
                                                                                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                                                                                                    <Camera className="h-4 w-4" />
                                                                                                    Upload new photo
                                                                                                    <input
                                                                                                              type="file"
                                                                                                              accept="image/*"
                                                                                                              className="hidden"
                                                                                                              onChange={(event) => {
                                                                                                                        const file = event.target.files?.[0] || null;
                                                                                                                        setSelectedImage(file);
                                                                                                                        setSuccess("");
                                                                                                                        setError("");
                                                                                                              }}
                                                                                                    />
                                                                                          </label>
                                                                                          <p className="mt-2 text-xs text-slate-500">
                                                                                                    Recommended size: 256x256px.
                                                                                          </p>
                                                                                </div>
                                                                      </div>

                                                                      {/* Basic Info Section */}
                                                                      <div className="space-y-5">
                                                                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-900">
                                                                                          <User2 className="h-5 w-5" />
                                                                                          <h2 className="text-lg font-semibold">Personal Information</h2>
                                                                                </div>

                                                                                <div className="grid gap-5 md:grid-cols-2">
                                                                                          <div>
                                                                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                                                                              Full Name
                                                                                                    </label>
                                                                                                    <input
                                                                                                              type="text"
                                                                                                              value={name}
                                                                                                              onChange={(event) => {
                                                                                                                        setName(event.target.value);
                                                                                                                        setSuccess("");
                                                                                                              }}
                                                                                                              placeholder="Enter your name"
                                                                                                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                                                                                                    />
                                                                                          </div>

                                                                                          <div>
                                                                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                                                                              Email Address
                                                                                                    </label>
                                                                                                    <div className="relative">
                                                                                                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                                                                                        <Mail className="h-4 w-4" />
                                                                                                              </div>
                                                                                                              <input
                                                                                                                        type="email"
                                                                                                                        value={profile?.email || user?.email || ""}
                                                                                                                        readOnly
                                                                                                                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
                                                                                                              />
                                                                                                    </div>
                                                                                          </div>
                                                                                </div>
                                                                      </div>

                                                                      {/* Status Messages */}
                                                                      {error && (
                                                                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                                                                          {error}
                                                                                </div>
                                                                      )}

                                                                      {success && (
                                                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                                                                          {success}
                                                                                </div>
                                                                      )}

                                                                      {/* Submit Button */}
                                                                      <div className="pt-2">
                                                                                <button
                                                                                          type="submit"
                                                                                          disabled={saving}
                                                                                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:px-8"
                                                                                >
                                                                                          {saving ? (
                                                                                                    <>
                                                                                                              <Loader2 className="h-4 w-4 animate-spin" />
                                                                                                              Saving changes...
                                                                                                    </>
                                                                                          ) : (
                                                                                                    <>
                                                                                                              <Save className="h-4 w-4" />
                                                                                                              Save Changes
                                                                                                    </>
                                                                                          )}
                                                                                </button>
                                                                      </div>

                                                            </form>
                                                  </div>
                                        </div>
                              </div>
                    </div>
          );
}
