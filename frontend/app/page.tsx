"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Palette, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { useRouter } from "next/navigation";
import { useTransition } from "@/context/TransitionContext";
import { PricingSection } from "@/components/PricingSection";
import ServicesSection from "./ServiceSection";
// Removed TextileBackground

export default function HomePage() {
  const router = useRouter();
  const { triggerTransition } = useTransition();
  
  return (
    <main className="min-h-screen relative">
      {/* Fixed Full-Page Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-multiply pointer-events-none" 
        style={{ backgroundImage: 'url("/bg.jpeg")' }}
      />
      <div className="fixed inset-0 z-0 bg-[var(--bg-primary)]/40 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 overflow-hidden z-10">
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center relative"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] mb-8 relative z-10 backdrop-blur-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-[var(--text-primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                AI-Powered Design Assistant
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-[var(--text-primary)] mb-6 md:mb-8 relative z-10 py-4 sm:py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Upload Image<br />Get Fabric Pattern
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto px-4 relative z-10 font-medium drop-shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Speed up your textile design workflow. Upload reference images, generate multiple pattern variations in seconds, and focus on what you do best — creating stunning designs.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <button 
                onClick={() => triggerTransition(() => router.push("/studio"))}
                className="btn btn-primary btn-lg group"
              >
                <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Start Creating
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <Link href="#features" className="btn btn-secondary btn-lg bg-white/50 backdrop-blur-md">
                See How It Works
              </Link>
            </motion.div>
            
            <motion.p 
              className="text-sm text-[var(--text-tertiary)] mt-8 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              ✨ 5 Free Credits • No Credit Card • Results in Seconds
            </motion.p>
          </motion.div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-[var(--text-primary)]">
              Why Choose
              <br />
              FabricDesigner.AI?
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed px-2">
              Professional-grade textile design tools powered by cutting-edge AI technology
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
            <FeatureCard
              icon={<Zap className="w-10 h-10" />}
              title="Lightning Fast"
              description="Generate professional textile designs in seconds, not hours. AI-powered speed meets human creativity."
              delay={0}
            />
            
            <FeatureCard
              icon={<Palette className="w-10 h-10" />}
              title="Print-Ready Quality"
              description="High-resolution, professionally optimized patterns ready for textile manufacturing. Perfect colors, seamless tiles."
              delay={0.1}
            />
            
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Secure & Private"
              description="Your designs stay yours. Bank-level security, private generations, complete ownership of all outputs."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-12 md:py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-[var(--text-primary)]">
              Stunning Results
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[var(--text-secondary)]">
              See what's possible with AI-powered textile design
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            <ShowcaseCard
              title="Floral Patterns"
              description="Intricate, seamless floral designs for premium fabrics"
              gradient="from-gray-500/10 to-gray-400/10"
              icon={<Palette className="w-12 h-12 text-[var(--text-primary)]" />}
            />
            <ShowcaseCard
              title="Geometric Designs"
              description="Modern, bold geometric patterns for contemporary textiles"
              gradient="from-gray-500/10 to-gray-400/10"
              icon={<Sparkles className="w-12 h-12 text-[var(--text-primary)]" />}
            />
          </div>
        </div>
      </section>

      {/* BYOG Section - Prominent Explainer */}
      <section className="py-20 px-4 sm:px-6 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-purple-500/5 rounded-3xl"></div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative border border-[var(--border)] rounded-3xl p-8 md:p-12 lg:p-16 bg-[var(--bg-elevated)] shadow-xl shadow-[var(--accent)]/5"
          >
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[120px] opacity-70"></div>
            
            <div className="relative z-10">
              {/* Badge */}
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-6"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
              >
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span className="text-sm font-medium text-[var(--accent)]">New: Bring Your Own GPU</span>
              </motion.div>

              <motion.h2 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Pay Only for GPU Time.
                  <br />
                  Keep 100% Control.
                </span>
              </motion.h2>

              <motion.p 
                className="text-lg md:text-xl text-[var(--text-secondary)] mb-12 max-w-3xl"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Rent a high-performance GPU on Vast.ai, we handle the setup automatically. 
                Unlimited generations, zero platform fees, complete transparency.
              </motion.p>

              {/* Benefits Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <BenefitCard
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Lower Costs"
                  description="RTX 4090 from $0.29/hour. Generate unlimited designs without per-image fees."
                  delay={0.3}
                />
                <BenefitCard
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  title="Auto-Setup"
                  description="Select GPU, click rent. We install ComfyUI + models in 5-10 minutes. Zero manual work."
                  delay={0.4}
                />
                <BenefitCard
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Full Control"
                  description="Your GPU, your account. Start, stop, upgrade anytime. Total transparency."
                  delay={0.5}
                />
              </div>

              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={() => triggerTransition(() => router.push("/gpu-marketplace"))}
                  className="btn btn-primary btn-lg group"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Browse GPUs
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>

                <Link href="#pricing" className="btn btn-secondary btn-lg">
                  Compare Pricing
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div 
                className="mt-12 pt-8 border-t border-[var(--border)] grid grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
              >
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">$0.29/hr</div>
                  <div className="text-sm text-[var(--text-secondary)]">GPU Starting Price</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">5-10min</div>
                  <div className="text-sm text-[var(--text-secondary)]">Auto Setup Time</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">Unlimited</div>
                  <div className="text-sm text-[var(--text-secondary)]">Generations</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

        <Footer />
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group relative h-full"
    >
      <div className="relative p-10 h-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-500 flex flex-col">
        <div className="absolute inset-0 rounded-3xl bg-[var(--text-primary)] opacity-0 group-hover:opacity-5 transition-all duration-500 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-[var(--border)] border-opacity-20">
            <div className="text-[var(--text-primary)] transition-colors duration-500 [&>svg]:w-8 [&>svg]:h-8">{icon}</div>
          </div>
          <h3 className="text-2xl font-bold mb-4 group-hover:text-[var(--accent)] transition-colors duration-300">{title}</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed text-lg">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ShowcaseCard({ title, description, gradient, icon }: { title: string; description: string; gradient: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
      <div className="absolute inset-0 bg-[var(--bg-card)] -z-10" />
      
      <div className="absolute inset-0 border border-[var(--border)] rounded-3xl group-hover:border-[var(--border-hover)] transition-colors duration-500 pointer-events-none" />

      <div className="h-full flex flex-col justify-between p-10 relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-elevated)]/50 backdrop-blur-sm border border-[var(--border)] flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500">
          {icon}
        </div>

        <div>
          <h3 className="text-3xl font-bold mb-3 text-[var(--text-primary)] transition-transform duration-300">{title}</h3>
          <p className="text-lg text-[var(--text-secondary)] max-w-md transition-colors duration-300">{description}</p>
        </div>
      </div>
      
      {/* Hover Glow */}
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors duration-500 pointer-events-none" />
    </motion.div>
  );
}

function BenefitCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group"
    >
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function PricingCard({ name, price, priceUnit, description, features, cta, href, highlighted, badge }: {
  name: string;
  price: string;
  priceUnit?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  badge?: string;
}) {
  const router = useRouter();
  const { triggerTransition } = useTransition();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 ${
        highlighted 
          ? 'bg-[var(--bg-card)] border-[var(--accent)] shadow-[0_0_40px_-10px_var(--accent-glow)]' 
          : 'bg-transparent border-[var(--border)] hover:border-[var(--border-hover)]'
      }`}
    >
      {badge && (
        <div className="absolute -top-4 left-8 px-4 py-1 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold tracking-wider uppercase shadow-lg">
          {badge}
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{name}</h3>
        <p className="text-[var(--text-secondary)] text-sm">{description}</p>
      </div>

      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">{price}</span>
        {priceUnit && <span className="text-[var(--text-secondary)]">{priceUnit}</span>}
      </div>
      
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-0.5 ${highlighted ? 'bg-[#0066FF]/20 text-[#0066FF]' : 'bg-[var(--border)] text-[var(--text-secondary)]'}`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className={`text-sm ${highlighted ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      
      <button 
        onClick={() => {
          if (href.startsWith("mailto:")) {
            window.location.href = href;
          } else {
            triggerTransition(() => router.push(href));
          }
        }}
        className={`btn w-full py-4 rounded-xl font-semibold text-center transition-all duration-300 ${
          highlighted 
            ? 'btn-primary' 
            : 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
        }`}
      >
        {cta}
      </button>
    </motion.div>
  );
}


function PricingToggle() {
  const [isYearly, setIsYearly] = useState(false);
  
  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-16">
        <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative w-16 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-inner"
        >
          <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-[var(--accent)] transition-transform duration-300 shadow-md ${isYearly ? 'translate-x-8' : 'translate-x-0'}`} />
        </button>
        <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
          Yearly
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--success-glow)] text-[var(--success)] uppercase tracking-wide">Save 20%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        <PricingCard
          name="Free"
          price="$0"
          priceUnit="/mo"
          description="Perfect for trying out"
          features={[
            "10 free credits",
            "All design features",
            "High-resolution exports",
            "Email support"
          ]}
          cta="Get Started Free"
          href="/register"
          highlighted={false}
        />
        
        <PricingCard
          name="Pro"
          price={isYearly ? "$19" : "$24"}
          priceUnit="/mo"
          description="For professional designers"
          features={[
            "200 credits/month",
            "Priority generation",
            "Advanced AI models",
            "Commercial license",
            "Priority support"
          ]}
          cta="Start Pro"
          href="/studio"
          highlighted={true}
          badge="POPULAR"
        />
        
        <PricingCard
          name="Business"
          price={isYearly ? "$79" : "$99"}
          priceUnit="/mo"
          description="For design teams"
          features={[
            "1000 credits/month",
            "Team collaboration",
            "Custom branding",
            "API access",
            "Dedicated support",
            "Analytics dashboard"
          ]}
          cta="Start Business"
          href="/studio"
          highlighted={false}
        />
        
        <PricingCard
          name="Enterprise"
          price="Custom"
          description="For large organizations"
          features={[
            "Unlimited credits",
            "Custom AI training",
            "White-label solution",
            "SLA guarantee",
            "Dedicated account manager",
            "Custom integrations"
          ]}
          cta="Contact Sales"
          href="mailto:sales@fabricdesigner.ai"
          highlighted={false}
        />
      </div>
    </>
  );
}
