"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface GenerationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
  queuePosition?: number;
  estimatedWait?: number;
  executionTime?: number;
}

interface UseGenerationOptions {
  pollInterval?: number;
  maxPolls?: number;
  onComplete?: (job: GenerationJob) => void;
  onError?: (error: string) => void;
}

interface GenerationInput {
  image: string;
  prompt: string;
  numVariations?: number;
  seed?: number;
  guidance?: number;
}

/**
 * Hook for managing async generation with polling
 */
export function useGeneration(options: UseGenerationOptions = {}) {
  const {
    pollInterval = 3000,
    maxPolls = 60,
    onComplete,
    onError,
  } = options;

  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef<Record<string, number>>({});
  const pollTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Poll a single job for status
  const pollJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/generate/${jobId}`);
      if (!response.ok) throw new Error("Failed to fetch status");
      
      const data = await response.json();
      
      setJobs(prev => prev.map(job => {
        if (job.id !== jobId) return job;
        
        return {
          ...job,
          status: data.status,
          imageUrl: data.imageUrl,
          error: data.error,
          queuePosition: data.queuePosition,
          estimatedWait: data.estimatedWait,
          executionTime: data.executionTime,
        };
      }));

      // Handle completion
      if (data.status === "completed") {
        onComplete?.({
          id: jobId,
          status: "completed",
          imageUrl: data.imageUrl,
          executionTime: data.executionTime,
        });
        return true; // Stop polling
      }

      // Handle failure
      if (data.status === "failed") {
        onError?.(data.error || "Generation failed");
        return true; // Stop polling
      }

      return false; // Continue polling
      
    } catch (err) {
      console.error("Polling error:", err);
      return false;
    }
  }, [onComplete, onError]);

  // Start polling a job
  const startPolling = useCallback((jobId: string) => {
    pollCountRef.current[jobId] = 0;

    const poll = async () => {
      pollCountRef.current[jobId]++;
      
      if (pollCountRef.current[jobId] > maxPolls) {
        console.warn(`Max polls reached for job ${jobId}`);
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: "failed", error: "Timeout" } : job
        ));
        return;
      }

      const done = await pollJob(jobId);
      
      if (!done) {
        pollTimeoutsRef.current[jobId] = setTimeout(poll, pollInterval);
      } else {
        // Check if all jobs are done
        const allDone = jobs.every(j => 
          j.id === jobId || j.status === "completed" || j.status === "failed"
        );
        if (allDone) {
          setIsGenerating(false);
        }
      }
    };

    poll();
  }, [pollJob, pollInterval, maxPolls, jobs]);

  // Stop polling
  const stopPolling = useCallback(() => {
    Object.values(pollTimeoutsRef.current).forEach(clearTimeout);
    pollTimeoutsRef.current = {};
    pollCountRef.current = {};
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Submit generation request
  const generate = useCallback(async (input: GenerationInput): Promise<GenerationJob[]> => {
    setIsGenerating(true);
    setError(null);
    setJobs([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: input.image,
          prompt: input.prompt,
          num_variations: input.numVariations || 1,
          seed: input.seed,
          guidance: input.guidance,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();
      
      // Create job objects
      const newJobs: GenerationJob[] = data.variations.map((v: any) => ({
        id: v.id,
        status: v.status || "pending",
        queuePosition: undefined,
        estimatedWait: undefined,
      }));

      setJobs(newJobs);

      // Start polling each job
      newJobs.forEach(job => startPolling(job.id));

      return newJobs;

    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
      onError?.(err.message);
      return [];
    }
  }, [startPolling, onError]);

  // Cancel generation
  const cancel = useCallback(() => {
    stopPolling();
    setIsGenerating(false);
    setJobs(prev => prev.map(job => ({
      ...job,
      status: job.status === "pending" || job.status === "processing" 
        ? "failed" 
        : job.status,
      error: "Cancelled",
    })));
  }, [stopPolling]);

  // Get aggregate progress
  const progress = jobs.length > 0
    ? {
        total: jobs.length,
        completed: jobs.filter(j => j.status === "completed").length,
        failed: jobs.filter(j => j.status === "failed").length,
        processing: jobs.filter(j => j.status === "processing").length,
        pending: jobs.filter(j => j.status === "pending").length,
        percent: Math.round(
          (jobs.filter(j => j.status === "completed" || j.status === "failed").length / jobs.length) * 100
        ),
      }
    : null;

  return {
    generate,
    cancel,
    jobs,
    isGenerating,
    error,
    progress,
  };
}
