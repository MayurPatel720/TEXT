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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-label="Design variations">
      {variations.map((variation) => (
        <div
          key={variation.id}
          className={`variation-card ${selectedIds.includes(variation.id) ? "selected" : ""}`}
          onClick={() => onSelect(variation.id)}
          role="listitem button"
          tabIndex={0}
          aria-label={`Select ${variation.label} variation`}
          aria-pressed={selectedIds.includes(variation.id)}
        >
          <div className="aspect-square bg-[var(--bg-elevated)] relative overflow-hidden">
            <img
              src={variation.thumbnailUrl}
              alt={variation.label}
              className="w-full h-full object-cover"
            />
            
            {selectedIds.includes(variation.id) && (
              <div className="check">
                ✓
              </div>
            )}
          </div>

          <div className="p-3">
            <div className="font-medium text-sm mb-1">{variation.label}</div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
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
