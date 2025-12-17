"use client";

import { Variation } from "@/types/variation";

interface VariationGridProps {
  variations: Variation[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

export default function VariationGrid({
  variations,
  selectedIds,
  onSelect,
}: VariationGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="Design variations">
      {variations.map((variation) => (
        <div
          key={variation.id}
          className={`variation-thumbnail ${selectedIds.includes(variation.id) ? "selected" : ""}`}
          onClick={() => onSelect(variation.id)}
          role="listitem button"
          tabIndex={0}
          aria-label={`Select ${variation.label} variation`}
          aria-pressed={selectedIds.includes(variation.id)}
        >
          <div className="aspect-square bg-[var(--color-secondary-bg)] relative">
            <img
              src={variation.thumbnailUrl}
              alt={variation.label}
              className="w-full h-full object-cover"
            />
            
            {selectedIds.includes(variation.id) && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <div className="w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white text-2xl">
                  ✓
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white">
            <div className="font-medium text-sm mb-1">{variation.label}</div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="capitalize">{variation.params.density}</span>
              <span>•</span>
              <span>{variation.params.motifSize}x</span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
