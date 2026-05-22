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

export interface Variation {
  id: string;
  label: string;
  thumbnailUrl: string;
  params: VariationParams;
}
