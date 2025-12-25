"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface GenerationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
  queuePosition?: number;
  estimatedWait?: number;
  executionTime?: number;
}

interface Progress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  percent: number;
}

interface GenerationProgressProps {
  jobs: GenerationJob[];
  progress: Progress | null;
  isGenerating: boolean;
  error?: string | null;
}

/**
 * Real-time generation progress indicator
 */
export function GenerationProgress({
  jobs,
  progress,
  isGenerating,
  error,
}: GenerationProgressProps) {
  if (!isGenerating && !progress) return null;

  const currentJob = jobs.find(j => j.status === "processing") || jobs.find(j => j.status === "pending");

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">
            {isGenerating ? "Generating designs..." : "Complete"}
          </span>
          <span className="text-sm text-[var(--accent)] font-medium">
            {progress?.completed || 0} / {progress?.total || 0}
          </span>
        </div>
        
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--accent)] to-[#0052cc]"
            initial={{ width: 0 }}
            animate={{ width: `${progress?.percent || 0}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Status Details */}
      <AnimatePresence mode="wait">
        {currentJob && (
          <motion.div
            key={currentJob.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-[#111111] border border-white/10"
          >
            <div className="flex items-center gap-3">
              {currentJob.status === "pending" && (
                <>
                  <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Waiting in queue...
                    </p>
                    {currentJob.queuePosition && (
                      <p className="text-xs text-white/50">
                        Position #{currentJob.queuePosition} • 
                        Est. {Math.ceil((currentJob.estimatedWait || 35) / 60)} min
                      </p>
                    )}
                  </div>
                </>
              )}
              
              {currentJob.status === "processing" && (
                <>
                  <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      AI is creating your design...
                    </p>
                    <p className="text-xs text-white/50">
                      This usually takes ~30-40 seconds
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {!isGenerating && progress && progress.completed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-400">
                  Generation complete!
                </p>
                <p className="text-xs text-green-400/70">
                  {progress.completed} design{progress.completed > 1 ? "s" : ""} created
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  Generation failed
                </p>
                <p className="text-xs text-red-400/70">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Status Pills */}
      {jobs.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {jobs.map((job, index) => (
            <div
              key={job.id}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                job.status === "completed"
                  ? "bg-green-500/20 text-green-400"
                  : job.status === "processing"
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : job.status === "failed"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {job.status === "processing" && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {job.status === "completed" && (
                <CheckCircle className="w-3 h-3" />
              )}
              {job.status === "failed" && <XCircle className="w-3 h-3" />}
              {job.status === "pending" && <Clock className="w-3 h-3" />}
              Design {index + 1}
            </div>
          ))}
        </div>
      )}

      {/* GPU Info */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white/30">
          <Zap className="w-3 h-3" />
          <span>Powered by RTX 4090 • FLUX Kontext Dev</span>
        </div>
      )}
    </div>
  );
}
