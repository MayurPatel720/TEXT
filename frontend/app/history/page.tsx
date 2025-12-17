"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Download, Heart, Eye, Calendar, ArrowLeft, Trash2 } from "lucide-react";
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, filter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/history?filter=${filter}`);
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[var(--accent)] animate-pulse mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading your designs...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view history</h1>
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
      
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/studio">
                <button className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Generation History</h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  {generations.length} {generations.length === 1 ? 'design' : 'designs'}
                </p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] rounded-full p-1 border border-[var(--border)]">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === 'favorites' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Favorites
              </button>
            </div>
          </div>

          {/* Grid */}
          {generations.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No designs yet</h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {filter === 'favorites' 
                  ? "You haven't favorited any designs yet" 
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generations.map((gen, idx) => (
                <motion.div
                  key={gen._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card p-0 overflow-hidden group hover:border-[var(--accent)] transition-all"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-[var(--bg-elevated)]">
                    <img
                      src={gen.generatedImageUrl}
                      alt={gen.prompt}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleFavorite(gen._id)}
                        className="p-3 bg-[var(--bg-elevated)] rounded-full hover:bg-[var(--accent)] transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${gen.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => downloadImage(gen.generatedImageUrl, `textile-${gen._id}.png`)}
                        className="p-3 bg-[var(--bg-elevated)] rounded-full hover:bg-[var(--accent)] transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Status Badge */}
                    {gen.status !== 'completed' && (
                      <div className="absolute top-2 right-2">
                        <span className="badge badge-warning">{gen.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm font-medium line-clamp-2 mb-3">
                      {gen.prompt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(gen.createdAt).toLocaleDateString()}
                        </span>
                      </div>
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
