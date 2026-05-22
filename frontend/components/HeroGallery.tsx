"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const HERO_SLIDES = [
  {
    id: "saree",
    category: "Saree",
    label: "Plain fabric → Banarasi silk",
    input: "/hero/saree-input.png",
    output: "/hero/saree-output.png",
  },
  {
    id: "embroidery",
    category: "Embroidery",
    label: "Base fabric → Embroidered textile",
    input: "/hero/embroidery-input.png",
    output: "/hero/embroidery-output.png",
  },
  {
    id: "dress",
    category: "Dress Material",
    label: "Solid fabric → Floral print",
    input: "/hero/dress-input.png",
    output: "/hero/dress-output.png",
  },
  {
    id: "shawl",
    category: "Shawl",
    label: "Blank fabric → Paisley shawl",
    input: "/hero/shawl-input.png",
    output: "/hero/shawl-output.png",
  },
  {
    id: "lehenga",
    category: "Lehenga",
    label: "Plain fabric → Bridal lehenga",
    input: "/hero/lehenga-input.png",
    output: "/hero/lehenga-output.png",
  },
];

export default function HeroGallery() {
  const [current, setCurrent] = useState(0);
  const [errored, setErrored] = useState<Set<string>>(new Set());
  const router = useRouter();

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = HERO_SLIDES[current];

  const handleError = (id: string) => {
    setErrored((prev) => new Set(prev).add(id));
  };

  const imgStyle = (src: string, id: string) => ({
    backgroundImage: errored.has(id) ? "none" : `url(${src})`,
  });

  const fallbackColors: Record<string, string> = {
    input: "bg-gradient-to-br from-gray-800 to-gray-900",
    output: "bg-gradient-to-br from-[#1B3A6B] to-[#D4A843]",
  };

  return (
    <section className="relative min-h-screen w-full bg-[#0f0f1a]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className="absolute inset-0 grid grid-cols-1 md:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Left: Input side */}
          <div className="relative h-1/2 md:h-full overflow-hidden">
            <motion.div
              className={`absolute inset-0 bg-cover bg-center ${fallbackColors.input}`}
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={imgStyle(slide.input, `input-${slide.id}`)}
            >
              <img
                src={slide.input}
                alt=""
                className="hidden"
                onError={() => handleError(`input-${slide.id}`)}
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/80 text-xs font-medium border border-white/20">
              Your Fabric
            </div>
          </div>

          {/* Right: Output side */}
          <div className="relative h-1/2 md:h-full overflow-hidden">
            <motion.div
              className={`absolute inset-0 bg-cover bg-center ${fallbackColors.output}`}
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
              style={imgStyle(slide.output, `output-${slide.id}`)}
            >
              <img
                src={slide.output}
                alt=""
                className="hidden"
                onError={() => handleError(`output-${slide.id}`)}
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[var(--accent)]/20 backdrop-blur-md text-[var(--accent)] text-xs font-medium border border-[var(--accent)]/30">
              AI Design
            </div>

            {/* Arrow between the two */}
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/40">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Overlay content — centered headline + CTA */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="pointer-events-auto text-center px-4">
          <motion.h1
            key={`title-${slide.id}`}
            className="text-[clamp(2rem,6vw,4.5rem)] font-serif font-bold text-white mb-4 drop-shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Upload Image<br />
            <span className="text-[var(--accent)]">Get Pattern</span>
          </motion.h1>

          <motion.p
            key={`sub-${slide.id}`}
            className="text-base md:text-lg text-white/70 mb-8 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            From reference to print-ready textile design in seconds
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <button
              onClick={() => router.push("/studio")}
              className="btn btn-primary btn-lg text-base shadow-xl shadow-[var(--accent)]/20"
            >
              <Sparkles className="w-5 h-5" />
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          <motion.div
            className="mt-8 flex items-center justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              5 Free Credits
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="text-white/60 text-xs">No Credit Card</div>
            <div className="w-px h-4 bg-white/20" />
            <div className="text-[var(--accent)] text-xs font-semibold">₹6/design</div>
          </motion.div>
        </div>
      </div>

      {/* Dot navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {HERO_SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)}>
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === current ? "w-8 bg-[var(--accent)]" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Slide label */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20">
        <AnimatePresence mode="wait">
          <motion.p
            key={slide.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-white/40 text-[10px] tracking-widest uppercase"
          >
            {slide.category}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}
