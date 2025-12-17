"use client";

import { ProcessingStage } from "@/app/page";
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
    <section className="panel" aria-labelledby="preview-heading">
      <div className="panel-header flex items-center justify-between">
        <h3 id="preview-heading" className="font-semibold">
          {showComparison ? "Original Image" : "Enhanced Image"}
        </h3>
        
        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="px-2 py-1 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] transition-colors"
              aria-label="Zoom out"
            >
              -
            </button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="px-2 py-1 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] transition-colors"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {/* Before/After Toggle */}
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

      <div className="panel-content min-h-[400px] flex items-center justify-center bg-[var(--color-secondary-bg)]">
        {displayImage ? (
          <div className="relative overflow-auto max-w-full max-h-[600px]">
            <img
              src={displayImage}
              alt={showComparison ? "Original fabric image" : "Enhanced fabric image"}
              className="transition-transform duration-300"
              style={{ transform: `scale(${zoom / 100})` }}
            />
            
            {/* Watermark */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs text-[var(--color-text-secondary)]">
              {showComparison ? "Before Enhancement" : "After Enhancement"}
            </div>
          </div>
        ) : (
          <div className="text-center text-[var(--color-text-secondary)]">
            <div className="text-4xl mb-4">🖼️</div>
            <p>Your image will appear here</p>
          </div>
        )}
      </div>

      {enhancedImage && !showComparison && (
        <div className="panel-content border-t border-[var(--color-border)] bg-green-50">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✓</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1 text-green-900">
                Enhancement Complete
              </h4>
              <p className="text-sm text-green-800">
                Image optimized with improved sharpness, reduced noise, and balanced lighting. Ready for pattern generation.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
