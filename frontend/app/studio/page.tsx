"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Sparkles, 
  ArrowLeft, 
  Download, 
  RefreshCw,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Wand2,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Header } from "@/components/layout";

interface Variation {
  id: string;
  url: string;
  seed: number;
}

type GenerationStatus = "idle" | "uploading" | "generating" | "complete" | "error";

export default function StudioPage() {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [styleStrength, setStyleStrength] = useState(0.7);
  const [structureStrength, setStructureStrength] = useState(0.5);
  const [numVariations, setNumVariations] = useState(4);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop/select
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG)");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string);
      setReferenceFile(file);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Generate variations
  const handleGenerate = useCallback(async () => {
    if (!referenceImage || !prompt.trim()) {
      setError("Please upload an image and enter a prompt");
      return;
    }

    setStatus("generating");
    setProgress(0);
    setError(null);
    setVariations([]);
    setSelectedIds([]);

    try {
      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Call backend API
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: referenceImage,
          prompt: prompt,
          style_strength: styleStrength,
          structure_strength: structureStrength,
          num_variations: numVariations
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed. Please try again.");
      }

      const data = await response.json();
      
      setProgress(100);
      setVariations(data.variations || []);
      setStatus("complete");
      
    } catch (err: any) {
      // For demo without backend - create mock variations
      setError(err.message || "Something went wrong");
      // await simulateGeneration();
    }
  }, [referenceImage, prompt, styleStrength, structureStrength, numVariations]);

  // Simulate generation for demo
  const simulateGeneration = async () => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 300));
      setProgress(i);
    }
    
    // Create mock variations using the reference image
    const mockVariations: Variation[] = Array.from({ length: numVariations }, (_, i) => ({
      id: `var-${i}`,
      url: referenceImage!,
      seed: Math.floor(Math.random() * 1000000)
    }));
    
    setVariations(mockVariations);
    setStatus("complete");
  };

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  // Download selected
  const handleDownload = useCallback(() => {
    alert(`Downloading ${selectedIds.length} design(s)...\n\nNote: Connect to the Replicate API to get real HD downloads.`);
  }, [selectedIds]);

  // Reset
  const handleReset = useCallback(() => {
    setReferenceImage(null);
    setReferenceFile(null);
    setPrompt("");
    setVariations([]);
    setSelectedIds([]);
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <Header />

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Upload Zone / Preview */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden"
              >
                <div className="p-6 border-b border-[var(--border)]">
                  <h2 className="font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[var(--accent)]" />
                    Reference Image
                  </h2>
                </div>
                
                <div className="p-6">
                  {!referenceImage ? (
                    <div
                      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      />
                      <Upload className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Drop your fabric image here</p>
                      <p className="text-[var(--text-secondary)] text-sm">
                        or click to browse • JPG, PNG up to 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
                      <Image
                        src={referenceImage}
                        alt="Reference"
                        fill
                        className="object-contain"
                      />
                      <button
                        onClick={handleReset}
                        className="absolute top-4 right-4 btn btn-icon bg-black/50 hover:bg-black/70"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Prompt Input */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="p-6 border-b border-[var(--border)]">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-[var(--accent)]" />
                    Describe Your Design
                  </h2>
                </div>
                
                <div className="p-6">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Elegant floral textile pattern, seamless tile design, vibrant colors, professional print quality, intricate details..."
                    className="input textarea"
                    rows={4}
                  />
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Seamless pattern", "Floral design", "Geometric", "Traditional motif", "Modern abstract"].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setPrompt(prev => prev ? `${prev}, ${tag.toLowerCase()}` : tag.toLowerCase())}
                        className="badge hover:bg-[var(--accent-glow)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Generated Variations */}
              <AnimatePresence>
                {variations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="card"
                  >
                    <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                      <h2 className="font-semibold">Generated Designs</h2>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {selectedIds.length} selected
                      </span>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {variations.map((variation, i) => (
                          <motion.div
                            key={variation.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => toggleSelection(variation.id)}
                            className={`variation-card ${selectedIds.includes(variation.id) ? 'selected' : ''}`}
                          >
                            <Image
                              src={variation.url}
                              alt={`Variation ${i + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="check">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            <div className="absolute bottom-2 left-2 badge text-xs">
                              #{variation.seed}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <div className="mt-6 flex items-center gap-4">
                        <button
                          onClick={handleDownload}
                          disabled={selectedIds.length === 0}
                          className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-5 h-5" />
                          Download Selected ({selectedIds.length})
                        </button>
                        
                        <button
                          onClick={handleGenerate}
                          className="btn btn-secondary"
                        >
                          <RefreshCw className="w-5 h-5" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-6">
              {/* Generation Settings */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card lg:sticky lg:top-24"
              >
                <div className="p-6 border-b border-[var(--border)]">
                  <h2 className="font-semibold">Settings</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Style Strength */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Style Strength</label>
                      <span className="text-sm text-[var(--accent)]">{Math.round(styleStrength * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={styleStrength}
                      onChange={(e) => setStyleStrength(parseFloat(e.target.value))}
                      className="slider"
                    />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      How much to match the reference style
                    </p>
                  </div>
                  
                  {/* Structure Strength */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Structure Strength</label>
                      <span className="text-sm text-[var(--accent)]">{Math.round(structureStrength * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={structureStrength}
                      onChange={(e) => setStructureStrength(parseFloat(e.target.value))}
                      className="slider"
                    />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      How much to preserve the structure
                    </p>
                  </div>
                  
                  {/* Number of Variations */}
                  <div>
                    <label className="label">Variations</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[2, 4, 6].map(num => (
                        <button
                          key={num}
                          onClick={() => setNumVariations(num)}
                          className={`btn ${numVariations === num ? 'btn-primary' : 'btn-secondary'} py-2`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="divider" />
                  
                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!referenceImage || !prompt.trim() || status === "generating"}
                    className="btn btn-primary btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "generating" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating... {Math.round(progress)}%
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Designs
                      </>
                    )}
                  </button>
                  
                  {/* Progress bar */}
                  {status === "generating" && (
                    <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                  
                  {/* Error */}
                  {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  
                  {/* Credits info */}
                  <p className="text-xs text-[var(--text-tertiary)] text-center">
                    Each generation uses 1 credit
                  </p>
                </div>
              </motion.div>
              
              {/* Tips Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <h3 className="font-semibold mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li>• Use high-resolution reference images</li>
                  <li>• Be specific in your prompt</li>
                  <li>• Mention "seamless" for tileable patterns</li>
                  <li>• Try different style strengths</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
