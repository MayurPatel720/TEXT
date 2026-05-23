"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Download, Heart, Eye, Calendar, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout";

interface Generation {
  _id: string;
  prompt: string;
  referenceImageUrl: string;
  generatedImageUrl: string;
  status: string;
  isFavorite: boolean;
  downloads: number;
  views: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const CATEGORIES = ['all', 'saree', 'dress material', 'suiting', 'shawl', 'lehenga', 'print', 'jacquard', 'embroidery', 'bafta'];

  useEffect(() => {
    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, filter, categoryFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/history?filter=${filter}&category=${categoryFilter}`);
      const data = await response.json();
      
      if (data.success) {
        setGenerations(data.generations);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}/favorite`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchHistory();
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20 px-6">
        <Header />
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 shimmer rounded-lg mb-2" />
            <div className="h-4 w-24 shimmer rounded-lg" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-0 overflow-hidden">
                <div className="aspect-square shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 shimmer rounded" />
                  <div className="h-3 w-1/2 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-[var(--accent)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Sign in to view history</h1>
          <p className="text-[var(--text-secondary)] mb-6">Your generated designs will appear here</p>
          <Link href="/login">
            <button className="btn btn-primary">Sign In</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      
      <main className="pt-24 pb-20 md:pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link href="/studio">
                <button className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">History</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  {generations.length} {generations.length === 1 ? 'design' : 'designs'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] rounded-full p-1 border border-[var(--border)] self-start">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === 'favorites' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Favorites
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 -mx-2 px-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  categoryFilter === cat
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]/50'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Grid */}
          {generations.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {filter === 'favorites' ? 'No favorites yet' : 'No designs yet'}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {filter === 'favorites' 
                  ? "Heart your best designs to find them here" 
                  : "Start creating amazing textile designs in the studio"}
              </p>
              <Link href="/studio">
                <button className="btn btn-primary">
                  <Sparkles className="w-4 h-4" />
                  Go to Studio
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 md:gap-6">
              {generations.map((gen, idx) => (
                <motion.div
                  key={gen._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card p-0 overflow-hidden group hover:border-[var(--accent)] transition-all"
                >
                  <div className="relative aspect-square bg-[var(--bg-elevated)]">
                    <img
                      src={gen.generatedImageUrl}
                      alt={gen.prompt}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => toggleFavorite(gen._id)}
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-[var(--accent)] transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${gen.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
                        />
                      </button>
                      <button
                        onClick={() => downloadImage(gen.generatedImageUrl, `textile-${gen._id}.png`)}
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-[var(--accent)] transition-colors"
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {gen.status !== 'completed' && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30 font-medium">
                          {gen.status}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-sm font-medium line-clamp-2 mb-3 text-[var(--text-primary)]">
                      {gen.prompt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {gen.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {gen.downloads}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
