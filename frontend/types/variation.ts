export interface VariationParams {
  colorPalette: "original" | "warm" | "cool" | "monochrome";
  motifSize: number;
  density: "sparse" | "normal" | "dense";
  orientation: "normal" | "mirrored" | "rotated";
}

export type ProcessingStage =
  | "idle"
  | "uploading"
  | "enhancing"
  | "isolating"
  | "generating-pattern"
  | "creating-variations"
  | "finalizing"
  | "complete";
