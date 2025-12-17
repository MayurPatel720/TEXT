"use client";

import { ProcessingStage } from "@/types/variation";
import { useState } from "react";

interface ImagePreviewProps {
  originalImage: string | null;
  enhancedImage: string | null;
  showComparison: boolean;
  onToggleComparison: () => void;
  stage: ProcessingStage;
}

export default function ImagePreview({
  originalImage,
  enhancedImage,
  showComparison,
  onToggleComparison,
  stage,
}: ImagePreviewProps) {
  const [zoom, setZoom] = useState(100);

  const displayImage = showComparison ? originalImage : (enhancedImage || originalImage);

  return (
    <section className="card h-full flex flex-col" aria-labelledby="preview-heading">
      <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
        <h3 id="preview-heading" className="font-semibold">
          {showComparison ? "Original Image" : "Enhanced Image"}
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="px-2 py-1 text-sm border border-[var(--border)] rounded hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Zoom out"
            >
              -
            </button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="px-2 py-1 text-sm border border-[var(--border)] rounded hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {enhancedImage && (
            <button
              onClick={onToggleComparison}
              className="btn btn-secondary text-sm"
              aria-pressed={showComparison}
            >
              {showComparison ? "Show Enhanced" : "Show Original"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 min-h-[400px] flex items-center justify-center bg-[var(--bg-secondary)]">
        {displayImage ? (
          <div className="relative overflow-auto max-w-full max-h-[600px]">
            <img
              src={displayImage}
              alt={showComparison ? "Original fabric image" : "Enhanced fabric image"}
              className="transition-transform duration-300"
              style={{ transform: `scale(${zoom / 100})` }}
            />
            
            <div className="absolute bottom-4 right-4 bg-[var(--bg-elevated)]/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs text-[var(--text-secondary)] border border-[var(--border)]">
              {showComparison ? "Before Enhancement" : "After Enhancement"}
            </div>
          </div>
        ) : (
          <div className="text-center text-[var(--text-secondary)]">
            <div className="text-4xl mb-4">🖼️</div>
            <p>Your image will appear here</p>
          </div>
        )}
      </div>

      {enhancedImage && !showComparison && (
        <div className="p-4 border-t border-[var(--border)] bg-[var(--success-glow)]">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✓</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1 text-[var(--success)]">
                Enhancement Complete
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Image optimized with improved sharpness, reduced noise, and balanced lighting. Ready for pattern generation.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
