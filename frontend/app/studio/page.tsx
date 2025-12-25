"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Wand2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Sliders,
  Hash,
  Zap,
  Plus,
  HelpCircle,
  Info,
  Menu,
  GripVertical,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import { Header } from "@/components/layout";
import { GenerationProgress } from "@/components/GenerationProgress";

interface Variation {
  id: string;
  url?: string;
  imageUrl?: string;
  seed?: number;
  status?: "pending" | "processing" | "completed" | "failed";
}

interface ReferenceImage {
  id: string;
  url: string;
  file: File;
}

type GenerationStatus = "idle" | "uploading" | "generating" | "complete" | "error";

// Custom Slider Component with proper drag support
const Slider = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 1, 
  step = 0.01,
  label,
  displayValue,
  helpText
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  displayValue: string;
  helpText?: string;
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/60">{label}</span>
          {helpText && (
            <div className="group relative">
              <HelpCircle className="w-3 h-3 text-white/30 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-48 p-2 rounded-lg bg-[#222] border border-white/10 text-xs text-white/70 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                {helpText}
              </div>
            </div>
          )}
        </div>
        <span className="text-xs text-[var(--accent)] font-medium tabular-nums">{displayValue}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/70 rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ WebkitAppearance: 'none' }}
        />
        <div 
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg shadow-black/30 border-2 border-[var(--accent)] pointer-events-none transition-all duration-75"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

// Tooltip component for info
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex">
    <Info className="w-3.5 h-3.5 text-white/30 cursor-help" />
    <div className="absolute left-0 bottom-full mb-2 w-52 p-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 text-xs text-white/70 leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
      {text}
    </div>
  </div>
);

export default function StudioPage() {
  // Core state
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [selectedRefImage, setSelectedRefImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Settings
  const [styleStrength, setStyleStrength] = useState(0.9);
  const [structureStrength, setStructureStrength] = useState(0.5);
  const [numVariations, setNumVariations] = useState(2);

  // Advanced Settings
  const [seed, setSeed] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [guidance, setGuidance] = useState(2.5);

  // Collapsible sections
  const [showImageGuidance, setShowImageGuidance] = useState(true);
  const [showOutputSettings, setShowOutputSettings] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sidebar resize
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      // Clamp between 280px and 480px
      setSidebarWidth(Math.max(280, Math.min(480, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Handle file drop/select - now supports multiple files
  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload image files only (JPG, PNG)");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ReferenceImage = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: e.target?.result as string,
          file: file
        };
        setReferenceImages(prev => [...prev, newImage]);
        setSelectedRefImage(prev => prev || newImage.id);
        setError(null);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Remove a reference image
  const removeRefImage = useCallback((id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
    if (selectedRefImage === id) {
      setSelectedRefImage(referenceImages.find(img => img.id !== id)?.id || null);
    }
  }, [selectedRefImage, referenceImages]);

  // Get the currently selected reference image URL
  const getCurrentRefImageUrl = useCallback(() => {
    return referenceImages.find(img => img.id === selectedRefImage)?.url || null;
  }, [referenceImages, selectedRefImage]);

  // Generation polling state
  const [generationJobs, setGenerationJobs] = useState<{
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    imageUrl?: string;
    error?: string;
    queuePosition?: number;
    estimatedWait?: number;
  }[]>([]);
  const pollTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Poll a single job for status
  const pollJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/generate/${jobId}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      
      setGenerationJobs(prev => prev.map(job => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          status: data.status,
          imageUrl: data.imageUrl,
          error: data.error,
          queuePosition: data.queuePosition,
          estimatedWait: data.estimatedWait,
        };
      }));

      // Update variations when completed
      if (data.status === "completed" && data.imageUrl) {
        setVariations(prev => {
          const exists = prev.some(v => v.id === jobId);
          if (exists) {
            return prev.map(v => v.id === jobId ? { ...v, url: data.imageUrl, imageUrl: data.imageUrl } : v);
          }
          return [...prev, { id: jobId, url: data.imageUrl, imageUrl: data.imageUrl }];
        });
        
        // Select first completed variation
        setSelectedVariation(prev => prev || { id: jobId, url: data.imageUrl, imageUrl: data.imageUrl });
      }

      return data.status === "completed" || data.status === "failed";
    } catch {
      return false;
    }
  }, []);

  // Start polling all jobs
  const startPolling = useCallback((jobIds: string[]) => {
    const poll = async () => {
      const results = await Promise.all(jobIds.map(id => pollJob(id)));
      
      // Check if all done
      const allDone = results.every(done => done);
      
      if (allDone) {
        setStatus("complete");
        setProgress(100);
      } else {
        // Continue polling
        const timeout = setTimeout(poll, 3000);
        pollTimeoutsRef.current.push(timeout);
      }
    };
    
    poll();
  }, [pollJob]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Generate variations (async with polling)
  const handleGenerate = useCallback(async () => {
    const refImageUrl = getCurrentRefImageUrl();
    if (!refImageUrl || !prompt.trim()) {
      setError("Please upload an image and enter a prompt");
      return;
    }

    setStatus("generating");
    setProgress(10);
    setError(null);
    setVariations([]);
    setSelectedIds([]);
    setSelectedVariation(null);
    setGenerationJobs([]);
    pollTimeoutsRef.current.forEach(clearTimeout);
    pollTimeoutsRef.current = [];

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: refImageUrl,
          prompt: prompt,
          style_strength: styleStrength,
          structure_strength: structureStrength,
          num_variations: numVariations,
          seed: seed ? parseInt(seed) : undefined,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          quality: quality,
          guidance: guidance
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed. Please try again.");
      }

      const data = await response.json();
      setProgress(30);
      
      // Handle async response (self-hosted backend)
      if (data.async && data.variations) {
        const jobs = data.variations.map((v: any) => ({
          id: v.id,
          status: v.status || "pending",
        }));
        
        setGenerationJobs(jobs);
        startPolling(jobs.map((j: any) => j.id));
        
      } else if (data.variations?.length > 0) {
        // Handle sync response (legacy/fallback)
        setProgress(100);
        setVariations(data.variations);
        setSelectedVariation(data.variations[0]);
        setStatus("complete");
      }
      
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  }, [getCurrentRefImageUrl, prompt, styleStrength, structureStrength, numVariations, seed, aspectRatio, outputFormat, quality, guidance, startPolling]);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  // Select variation for large preview
  const selectForPreview = useCallback((variation: Variation) => {
    setSelectedVariation(variation);
  }, []);

  // Download selected
  const handleDownload = useCallback(() => {
    alert(`Downloading ${selectedIds.length} design(s)...`);
  }, [selectedIds]);

  // Reset
  const handleReset = useCallback(() => {
    setReferenceImages([]);
    setSelectedRefImage(null);
    setPrompt("");
    setVariations([]);
    setSelectedIds([]);
    setSelectedVariation(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  // Use selected image as new reference
  const useAsReference = useCallback(() => {
    if (selectedVariation) {
      const newImage: ReferenceImage = {
        id: `ref-${Date.now()}`,
        url: selectedVariation.url || selectedVariation.imageUrl || "",
        file: new File([], "generated.png")
      };
      setReferenceImages(prev => [...prev, newImage]);
      setSelectedRefImage(newImage.id);
      setVariations([]);
      setSelectedVariation(null);
      setStatus("idle");
    }
  }, [selectedVariation]);

  // Collapsible section component
  const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    isOpen, 
    onToggle, 
    children 
  }: { 
    title: string; 
    icon: React.ElementType; 
    isOpen: boolean; 
    onToggle: () => void; 
    children: React.ReactNode;
  }) => (
    <div className="border-b border-white/5">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Icon className="w-4 h-4 text-[var(--accent)]" />
          {title}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );

  const currentRefImage = getCurrentRefImageUrl();

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      {/* Mobile Sidebar Toggle Button - Fixed position */}
      {isMobile && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed bottom-6 left-6 z-40 p-4 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="pt-16 h-screen flex">
        {/* Left Sidebar - Desktop Resizable / Mobile Drawer */}
        <AnimatePresence>
          {(!isMobile || isMobileSidebarOpen) && (
            <motion.aside
              ref={sidebarRef}
              initial={isMobile ? { x: -320 } : false}
              animate={isMobile ? { x: 0 } : false}
              exit={isMobile ? { x: -320 } : undefined}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`
                ${isMobile 
                  ? 'fixed left-0 top-0 bottom-0 z-50 w-[320px] pt-16' 
                  : 'relative flex-shrink-0'
                }
                border-r border-white/10 bg-[#111111] flex flex-col overflow-hidden
              `}
              style={!isMobile ? { width: sidebarWidth } : undefined}
            >
              {/* Mobile Close Button */}
              {isMobile && (
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="absolute top-20 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Prompt Section */}
            <div className="p-4 border-b border-white/5">
              <label className="flex items-center gap-2 text-sm font-medium mb-3 text-white/90">
                <Wand2 className="w-4 h-4 text-[var(--accent)]" />
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your textile design..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                rows={3}
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {["Seamless", "Floral", "Geometric", "Abstract"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setPrompt(prev => prev ? `${prev}, ${tag.toLowerCase()}` : tag.toLowerCase())}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] text-white/60 hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] border border-white/5 hover:border-[var(--accent)]/30 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Guidance */}
            <CollapsibleSection
              title="Image Guidance"
              icon={ImageIcon}
              isOpen={showImageGuidance}
              onToggle={() => setShowImageGuidance(!showImageGuidance)}
            >
              {/* Reference Images Grid */}
              <div className="grid grid-cols-3 gap-2">
                {referenceImages.map((img) => (
                  <div
                    key={img.id}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                      selectedRefImage === img.id 
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' 
                        : 'border-transparent hover:border-white/20'
                    }`}
                    onClick={() => setSelectedRefImage(img.id)}
                  >
                    <Image
                      src={img.url}
                      alt="Reference"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRefImage(img.id);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {selectedRefImage === img.id && (
                      <div className="absolute inset-0 bg-[var(--accent)]/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-[var(--accent)]" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add More Button */}
                <div
                  className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/20 hover:border-[var(--accent)] hover:bg-white/5'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                  <Plus className="w-5 h-5 text-white/40" />
                </div>
              </div>

              {referenceImages.length === 0 && (
                <p className="text-xs text-white/40 text-center mt-2">
                  Drop images or click + to upload
                </p>
              )}

              {/* Style Strength Slider */}
              <Slider
                value={styleStrength}
                onChange={setStyleStrength}
                min={0}
                max={1}
                step={0.05}
                label="Style Strength"
                displayValue={`${Math.round(styleStrength * 100)}%`}
                helpText="Controls how much the AI follows the artistic style. Higher = more stylized output."
              />

              {/* Structure Strength Slider */}
              <Slider
                value={structureStrength}
                onChange={setStructureStrength}
                min={0}
                max={1}
                step={0.05}
                label="Structure Strength"
                displayValue={`${Math.round(structureStrength * 100)}%`}
                helpText="Controls how closely the output follows the original composition and layout."
              />
            </CollapsibleSection>

            {/* Output Settings */}
            <CollapsibleSection
              title="Output Settings"
              icon={Sliders}
              isOpen={showOutputSettings}
              onToggle={() => setShowOutputSettings(!showOutputSettings)}
            >
              {/* Number of Images */}
              <div>
                <span className="text-xs text-white/60 block mb-2">Number of Images</span>
                <div className="flex gap-2">
                  {[1, 2, 4, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setNumVariations(num)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        numVariations === num 
                          ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                          : 'bg-[#1a1a1a] text-white/60 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <span className="text-xs text-white/60 block mb-2">Aspect Ratio</span>
                <div className="grid grid-cols-4 gap-2">
                  {["1:1", "16:9", "4:3", "3:2"].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 rounded-xl text-xs font-medium transition-all ${
                        aspectRatio === ratio 
                          ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                          : 'bg-[#1a1a1a] text-white/60 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format */}
              <div>
                <span className="text-xs text-white/60 block mb-2">Format</span>
                <div className="flex gap-2">
                  {[
                    { value: "png", label: "PNG", desc: "Lossless" },
                    { value: "jpg", label: "JPG", desc: "Smaller" },
                    { value: "webp", label: "WEBP", desc: "Modern" }
                  ].map(format => (
                    <button
                      key={format.value}
                      onClick={() => setOutputFormat(format.value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                        outputFormat === format.value 
                          ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                          : 'bg-[#1a1a1a] text-white/60 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* Advanced Settings */}
            <CollapsibleSection
              title="Advanced"
              icon={Settings2}
              isOpen={showAdvanced}
              onToggle={() => setShowAdvanced(!showAdvanced)}
            >
              {/* Info banner */}
              <div className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-white/70 leading-relaxed">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                  <span>Fine-tune generation parameters. Hover over <HelpCircle className="w-3 h-3 inline text-white/40" /> icons for explanations.</span>
                </div>
              </div>

              {/* Seed */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/60">Seed</span>
                  <InfoTooltip text="A seed number ensures reproducible results. Using the same seed with the same settings will generate the same image. Leave empty for random variations each time." />
                </div>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Leave empty for random"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                />
              </div>

              {/* Guidance Scale Slider */}
              <Slider
                value={guidance}
                onChange={setGuidance}
                min={1}
                max={5}
                step={0.1}
                label="Guidance Scale"
                displayValue={guidance.toFixed(1)}
                helpText="How strictly the AI follows your prompt. Higher values = more literal interpretation, lower = more creative freedom."
              />

              {/* Quality Slider */}
              <Slider
                value={quality}
                onChange={setQuality}
                min={50}
                max={100}
                step={5}
                label="Output Quality"
                displayValue={`${quality}%`}
                helpText="Image compression quality. Higher = better quality but larger file size. 80-90% is usually ideal."
              />
            </CollapsibleSection>
          </div>

          {/* Bottom Fixed Section */}
          <div className="p-4 border-t border-white/10 bg-[#111111]">
            <button
              onClick={handleGenerate}
              disabled={referenceImages.length === 0 || !prompt.trim() || status === "generating"}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[#0052cc] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              {status === "generating" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Design
                </>
              )}
            </button>

            {/* Progress bar */}
            {status === "generating" && (
              <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-[#0052cc]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Credits */}
            <p className="text-xs text-white/40 text-center mt-3">
              <Zap className="w-3 h-3 inline mr-1" />
              1 credit per image • {numVariations} credits total
            </p>
          </div>

          {/* Resize Handle - Desktop only */}
          {!isMobile && (
            <div
              onMouseDown={startResizing}
              className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group hover:bg-[var(--accent)]/50 transition-colors ${
                isResizing ? 'bg-[var(--accent)]' : 'bg-transparent'
              }`}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 -mr-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-white/40" />
              </div>
            </div>
          )}
        </motion.aside>
          )}
        </AnimatePresence>

        {/* Right Main Panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0a]">
          {/* Large Preview */}
          <div className="mb-8">
            <div className="aspect-square max-w-xl mx-auto rounded-2xl overflow-hidden bg-[#111111] border border-white/10">
              {selectedVariation && (selectedVariation.url || selectedVariation.imageUrl) ? (
                <div className="relative w-full h-full">
                  <Image
                    src={selectedVariation.url || selectedVariation.imageUrl || ""}
                    alt="Selected design"
                    fill
                    className="object-contain"
                  />
                  {selectedVariation.seed && (
                    <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/60 text-xs text-white/80 backdrop-blur-sm">
                      Seed: #{selectedVariation.seed}
                    </div>
                  )}
                </div>
              ) : currentRefImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={currentRefImage}
                    alt="Reference"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/60 text-xs text-white/80 backdrop-blur-sm">
                    Reference Image
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">No image yet</p>
                  <p className="text-sm">Upload a reference and generate designs</p>
                </div>
              )}
            </div>
          </div>

          {/* Variation Thumbnails */}
          {variations.length > 0 && (
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">Generated Designs</h3>
                <span className="text-sm text-white/50">
                  {selectedIds.length} selected
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
                {variations.map((variation, i) => (
                  <motion.div
                    key={variation.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedVariation?.id === variation.id 
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' 
                        : 'border-transparent hover:border-white/20'
                    }`}
                    onClick={() => selectForPreview(variation)}
                  >
                    <Image
                      src={variation.url || variation.imageUrl || ""}
                      alt={`Variation ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                    {/* Checkbox for multi-select */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(variation.id);
                      }}
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedIds.includes(variation.id)
                          ? 'bg-[var(--accent)] border-[var(--accent)]'
                          : 'bg-black/40 border-white/40 hover:border-white'
                      }`}
                    >
                      {selectedIds.includes(variation.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <button
                  onClick={handleDownload}
                  disabled={selectedIds.length === 0}
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span> ({selectedIds.length})
                </button>
                
                <button
                  onClick={useAsReference}
                  disabled={!selectedVariation}
                  className="py-2.5 px-3 md:px-4 rounded-xl bg-white/10 text-white font-medium flex items-center gap-2 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                  title="Use selected image as new reference"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Iterate</span>
                </button>
                
                <button
                  onClick={handleGenerate}
                  className="py-2.5 px-3 md:px-4 rounded-xl bg-white/10 text-white font-medium flex items-center gap-2 hover:bg-white/15 transition-all text-sm md:text-base"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </main>
  );
}
