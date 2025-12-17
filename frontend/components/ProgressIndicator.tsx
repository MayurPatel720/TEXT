"use client";

import { ProcessingStage } from "@/app/page";

interface ProgressIndicatorProps {
  stage: ProcessingStage;
  progress: number;
}

const stageLabels: Record<ProcessingStage, string> = {
  idle: "Ready",
  uploading: "Uploading image...",
  enhancing: "Enhancing image quality...",
  isolating: "Isolating pattern motifs...",
  "generating-pattern": "Generating seamless repeat...",
  "creating-variations": "Creating design variations...",
  finalizing: "Finalizing print-ready file...",
  complete: "Complete",
};

const stageDescriptions: Record<ProcessingStage, string> = {
  idle: "",
  uploading: "Preparing your fabric image for processing",
  enhancing: "Applying professional sharpness, noise reduction, and color balance",
  isolating: "Detecting and extracting primary motif elements",
  "generating-pattern": "Creating perfectly tileable pattern with seamless edges",
  "creating-variations": "Generating customized design variations based on your settings",
  finalizing: "Converting to 300 DPI CMYK format for professional printing",
  complete: "Your design is ready to download",
};

export default function ProgressIndicator({ stage, progress }: ProgressIndicatorProps) {
  if (stage === "idle" || stage === "complete") {
    return null;
  }

  return (
    <div className="panel panel-content" role="status" aria-live="polite" aria-atomic="true">
      <div className="flex items-center gap-4 mb-4">
        <div className="animate-pulse text-3xl">
          {stage === "uploading" && "📤"}
          {stage === "enhancing" && "✨"}
          {stage === "isolating" && "🎯"}
          {stage === "generating-pattern" && "🔄"}
          {stage === "creating-variations" && "🎨"}
          {stage === "finalizing" && "📐"}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {stageLabels[stage]}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {stageDescriptions[stage]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-[var(--color-progress)]">
            {progress}%
          </div>
        </div>
      </div>

      <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>Processing...</span>
        <span>Please wait</span>
      </div>
    </div>
  );
}
