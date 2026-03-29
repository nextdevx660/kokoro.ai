import Link from "next/link";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

function normalizeEntry(entryDoc) {
  const data = entryDoc.data();
  return {
    id: entryDoc.id,
    name: data.name || data.worldName || "Untitled",
    image: data.avatarUrl || data.avatar_url || "",
    tag: data.tag || data.sceneGenre || "Featured",
    isScene: Boolean(data.isScene),
    createdAt: data.createdAt || data.updatedAt || data.generatedAt || 0,
  };
}

async function getFeedEntries() {
  const feedQuery = query(
    collection(db, "characters"),
    orderBy("generatedAt", "desc"),
    limit(100)
  );
  const snapshot = await getDocs(feedQuery);
  return snapshot.docs.map(normalizeEntry).filter((entry) => entry.image);
}

export default async function FeedPage() {
  const entries = await getFeedEntries();

  return (
    <div className="min-h-screen bg-white px-2 py-8 md:px-5">
      <section className="mx-auto max-w-[2000px]">



        {entries.length ? (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/chat/${entry.id}`}
                className="group mb-4 block break-inside-avoid"
              >
                <article className="relative overflow-hidden">
                  {/* Image Container */}
                  <div className="relative overflow-hidden rounded-2xl bg-gray-100 transition-all duration-300 group-hover:brightness-90">
                    <img
                      src={entry.image}
                      alt={entry.name}
                      className="w-full h-auto object-cover"
                    />

                    {/* Hover Button - Pinterest Style */}
                    <div className="absolute inset-0 flex items-start justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <button className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white shadow-lg">
                        Chat
                      </button>
                    </div>

                    {/* Subtle Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-md bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-black backdrop-blur-md">
                        {entry.isScene ? "Scene" : "Character"}
                      </span>
                    </div>
                  </div>

                  {/* Minimal Text Below */}
                  <div className="mt-2 px-1">
                    <h2 className="line-clamp-1 text-sm font-semibold text-black group-hover:underline">
                      {entry.name}
                    </h2>
                    <p className="text-[11px] font-medium text-gray-500">
                      {entry.tag}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-20 text-center text-sm font-medium text-gray-400">
            Feed is currently empty.
          </div>
        )}
      </section>
    </div>
  );
}