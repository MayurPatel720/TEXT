"use client";

import { VariationParams } from "@/app/page";

interface ControlPanelProps {
  params: VariationParams;
  onParamsChange: (params: VariationParams) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
}

export default function ControlPanel({
  params,
  onParamsChange,
  onGenerate,
  canGenerate,
  isGenerating,
}: ControlPanelProps) {
  return (
    <aside className="panel" aria-labelledby="controls-heading">
      <div className="panel-header">
        <h3 id="controls-heading" className="font-semibold">Design Controls</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Customize your pattern variations
        </p>
      </div>

      <div className="panel-content space-y-6">
        {/* Color Palette */}
        <div className="control-section">
          <label className="control-label">Color Palette</label>
          <div className="space-y-2">
            {(["original", "warm", "cool", "monochrome"] as const).map((palette) => (
              <div
                key={palette}
                className={`radio-option ${params.colorPalette === palette ? "selected" : ""}`}
                onClick={() => onParamsChange({ ...params, colorPalette: palette })}
                role="radio"
                aria-checked={params.colorPalette === palette}
                tabIndex={0}
              >
                <input
                  type="radio"
                  name="colorPalette"
                  value={palette}
                  checked={params.colorPalette === palette}
                  onChange={() => onParamsChange({ ...params, colorPalette: palette })}
                  className="mr-3"
                  aria-label={`${palette.charAt(0).toUpperCase() + palette.slice(1)} color palette`}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm capitalize">{palette}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {palette === "original" && "Keep original colors"}
                    {palette === "warm" && "Shift to warm red/yellow tones"}
                    {palette === "cool" && "Shift to cool blue tones"}
                    {palette === "monochrome" && "Convert to grayscale"}
                  </div>
                </div>
                {palette === "original" && <span className="text-lg">🎨</span>}
                {palette === "warm" && <span className="text-lg">🔥</span>}
                {palette === "cool" && <span className="text-lg">❄️</span>}
                {palette === "monochrome" && <span className="text-lg">⚫</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Motif Size */}
        <div className="control-section">
          <label className="control-label" htmlFor="motif-size-slider">
            Motif Size
            <span className="ml-2 text-[var(--color-text-secondary)] font-normal">
              {params.motifSize.toFixed(1)}x
            </span>
          </label>
          <input
            id="motif-size-slider"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={params.motifSize}
            onChange={(e) => onParamsChange({ ...params, motifSize: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[var(--color-secondary-bg)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
            aria-label="Adjust motif size from 0.5x to 2.0x"
          />
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1">
            <span>Small (0.5x)</span>
            <span>Large (2.0x)</span>
          </div>
        </div>

        {/* Density */}
        <div className="control-section">
          <label className="control-label">Pattern Density</label>
          <div className="space-y-2">
            {(["sparse", "normal", "dense"] as const).map((density) => (
              <div
                key={density}
                className={`radio-option ${params.density === density ? "selected" : ""}`}
                onClick={() => onParamsChange({ ...params, density })}
                role="radio"
                aria-checked={params.density === density}
                tabIndex={0}
              >
                <input
                  type="radio"
                  name="density"
                  value={density}
                  checked={params.density === density}
                  onChange={() => onParamsChange({ ...params, density })}
                  className="mr-3"
                  aria-label={`${density.charAt(0).toUpperCase() + density.slice(1)} density`}
                />
                <div className="flex-1 capitalize font-medium text-sm">{density}</div>
                <span className="text-lg">
                  {density === "sparse" && "···"}
                  {density === "normal" && "⋮⋮⋮"}
                  {density === "dense" && "▓▓▓"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div className="control-section">
          <label className="control-label">Orientation</label>
          <div className="space-y-2">
            {(["normal", "mirrored", "rotated"] as const).map((orientation) => (
              <div
                key={orientation}
                className={`radio-option ${params.orientation === orientation ? "selected" : ""}`}
                onClick={() => onParamsChange({ ...params, orientation })}
                role="radio"
                aria-checked={params.orientation === orientation}
                tabIndex={0}
              >
                <input
                  type="radio"
                  name="orientation"
                  value={orientation}
                  checked={params.orientation === orientation}
                  onChange={() => onParamsChange({ ...params, orientation })}
                  className="mr-3"
                  aria-label={`${orientation.charAt(0).toUpperCase() + orientation.slice(1)} orientation`}
                />
                <div className="flex-1 capitalize font-medium text-sm">{orientation}</div>
                <span className="text-lg">
                  {orientation === "normal" && "↑"}
                  {orientation === "mirrored" && "⇄"}
                  {orientation === "rotated" && "↻"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="btn btn-primary btn-large w-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Generate design variations"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse">⏳</span>
              Generating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🎨</span>
              Generate Variations
            </span>
          )}
        </button>

        {!canGenerate && !isGenerating && (
          <p className="text-xs text-center text-[var(--color-text-secondary)]">
            Upload and enhance an image first
          </p>
        )}
      </div>
    </aside>
  );
}
