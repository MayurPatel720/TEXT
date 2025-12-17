"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Palette, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 opacity-30 pointer-events-none"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        
        {/* Floating orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mb-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Professional Textile Design<br />in Seconds
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Transform your reference images into stunning, print-ready fabric patterns with AI. FabricDesigner.AI makes textile design faster, smarter, and more creative.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Link href="/studio" className="btn btn-primary btn-lg group">
                <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Start Designing Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link href="#features" className="btn btn-secondary btn-lg">
                See How It Works
              </Link>
            </motion.div>
            
            <motion.p 
              className="text-sm text-[var(--text-tertiary)] mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              ✨ Free credits on signup • No credit card required
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-[var(--bg-secondary)] via-purple-950/10 to-[var(--bg-secondary)] relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Why Choose FabricDesigner.AI?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              Professional-grade textile design tools powered by cutting-edge AI technology
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Lightning Fast"
              description="Generate professional textile designs in seconds, not hours. AI-powered speed meets human creativity."
              delay={0}
            />
            
            <FeatureCard
              icon={<Palette className="w-8 h-8" />}
              title="Print-Ready Quality"
              description="High-resolution, professionally optimized patterns ready for textile manufacturing. Perfect colors, seamless tiles."
              delay={0.1}
            />
            
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure & Private"
              description="Your designs stay yours. Bank-level security, private generations, complete ownership of all outputs."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-24 px-6 relative">
        {/* Background gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl rounded-full" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-200 via-white to-purple-200 bg-clip-text text-transparent">
              Stunning Results
            </h2>
            <p className="text-xl text-[var(--text-secondary)]">
              See what's possible with AI-powered textile design
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <ShowcaseCard
              title="Floral Patterns"
              description="Intricate, seamless floral designs for premium fabrics"
            />
            <ShowcaseCard
              title="Geometric Designs"
              description="Modern, bold geometric patterns for contemporary textiles"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-[var(--text-secondary)]">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
          
          <PricingToggle />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-12 bg-gradient-to-br from-[var(--accent-glow)] to-[var(--bg-secondary)] border-[var(--accent)]/20"
          >
            <Sparkles className="w-12 h-12 text-[var(--accent)] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Designs?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-8">
              Join designers and manufacturers creating stunning textile patterns with AI
            </p>
            <Link href="/studio" className="btn btn-primary btn-lg">
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="card p-8 text-center hover:border-[var(--accent)] transition-colors"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center mx-auto mb-6">
        <div className="text-[var(--accent)]">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-[var(--text-secondary)]">{description}</p>
    </motion.div>
  );
}

function ShowcaseCard({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="card overflow-hidden group cursor-pointer hover:border-[var(--accent)] transition-all"
    >
      <div className="aspect-video bg-[var(--bg-elevated)] flex items-center justify-center border-b border-[var(--border)] group-hover:bg-[var(--accent-glow)] transition-colors">
        <Palette className="w-16 h-16 text-[var(--accent)] opacity-40 group-hover:opacity-60 transition-opacity" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-[var(--text-secondary)]">{description}</p>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`card p-8 relative ${highlighted ? 'border-[var(--accent)] shadow-lg shadow-[var(--accent-glow)]' : ''}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--accent)] text-white text-xs font-semibold">
          {badge}
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>
        {priceUnit && <span className="text-[var(--text-secondary)]">{priceUnit}</span>}
      </div>
      <p className="text-[var(--text-secondary)] mb-6">{description}</p>
      
      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link href={href} className={`btn ${highlighted ? 'btn-primary' : 'btn-secondary'} w-full`}>
        {cta}
      </Link>
    </motion.div>
  );
}

function PricingToggle() {
  const [isYearly, setIsYearly] = useState(false);
  
  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative w-14 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] transition-colors"
        >
          <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-[var(--accent)] transition-transform ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
        <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
          Yearly
          <span className="ml-2 text-xs text-[var(--accent)]">Save 20%</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto px-4">
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

