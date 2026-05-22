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
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[var(--bg-elevated)] backdrop-blur-md text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)]">
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


          </div>
        </motion.div>
      </AnimatePresence>

      {/* Overlay content — centered headline + CTA */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="pointer-events-auto text-center px-4">
          <motion.h1
            key={`title-${slide.id}`}
            className="text-[clamp(2.5rem,6.5vw,5rem)] font-serif font-bold text-white mb-10 leading-[1.1] drop-shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Upload Image<br />
            <span className="text-[var(--accent)]">Get Pattern</span>
          </motion.h1>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <button
              onClick={() => router.push("/studio")}
              className="btn btn-primary btn-lg text-[17px] font-semibold px-10 py-4 rounded-full whitespace-nowrap flex items-center justify-center gap-2 shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.03] active:scale-95 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-[var(--accent)]/35 pointer-events-auto"
              style={{ color: '#ffffff' }}
            >
              <Sparkles className="w-5 h-5" />
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          <motion.div
            className="mt-12 inline-flex items-center justify-center gap-5 bg-black/85 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 text-[13px] md:text-sm font-semibold tracking-wide" style={{ color: '#ffffff' }}>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>5 Free Credits</span>
            </div>
            <div className="w-px h-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
            <div className="text-[13px] md:text-sm font-semibold tracking-wide" style={{ color: '#ffffff' }}>No Credit Card</div>
            <div className="w-px h-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
            <div className="text-[13px] md:text-sm font-bold px-3 py-1 rounded-full tracking-wide" style={{ color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
              ₹6/design
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dot navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {HERO_SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)}>
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === current ? "w-8 bg-[var(--accent)]" : "w-1.5 bg-white/30 hover:bg-[var(--bg-secondary)]0"
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
            className="text-[var(--text-tertiary)] text-[10px] tracking-widest uppercase"
          >
            {slide.category}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}
