"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TransitionLink from "@/components/TransitionLink";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X, ChevronRight, Github, Twitter, Instagram, LogOut, Clock } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTransition } from "@/context/TransitionContext";


export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { triggerTransition } = useTransition();

  const { data: session, status } = useSession();
  const isStudio = pathname === "/studio";

  /* Nav Links for Main Header */
  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "Showcase", href: "/#showcase" },
    { name: "Pricing", href: "/#pricing" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (isStudio) {
    return (
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
            <button 
              onClick={() => triggerTransition(() => router.push("/"))}
              className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-colors group"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] rotate-180 group-hover:text-white" />
            </button>

            <div className="h-6 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center relative">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-semibold text-lg">Design Studio</span>
            </div>
            </div>
            
            <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full border border-[var(--border)]">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              <span className="text-sm font-medium">
                {session?.user?.credits !== undefined ? `${session.user.credits} credits left` : 'Loading...'}
              </span>
            </div>
            {session ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border border-white/10 ring-2 ring-transparent hover:ring-[var(--accent)] transition-all cursor-pointer flex items-center justify-center text-white text-sm font-semibold"
                >
                  {session.user?.name?.[0] || "U"}
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-xl py-2">
                    <div className="px-4 py-2 border-b border-[var(--border)]">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{session.user?.email}</p>
                    </div>
                    <button onClick={handleSignOut} className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-primary)] flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button className="btn btn-primary px-4 py-2 text-sm">Sign In</button>
              </Link>
            )}
            </div>
        </div>
      </motion.header>
    );
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)]" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <TransitionLink href="/" className="flex items-center gap-3 group">

            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={40} height={40} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight">FabricDesigner.AI</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wider uppercase">Studio</span>
            </div>
          </TransitionLink>



          {/* Desktop Nav - Perfectly Centered */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
            {navLinks.map((link) => (
              <TransitionLink
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--accent)] transition-all group-hover:w-full" />
              </TransitionLink>
            ))}

          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] animate-pulse" />
            ) : session ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                    {session.user?.name?.[0] || "U"}
                  </div>
                  <span className="text-sm font-medium">{session.user?.name?.split(" ")[0]}</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-xl py-2">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{session.user?.email}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        triggerTransition(() => router.push("/studio"));
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-primary)] flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Design Studio
                    </button>

                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        triggerTransition(() => router.push("/history"));
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-primary)] flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      History
                    </button>

                    <button onClick={handleSignOut} className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-primary)] flex items-center gap-2 text-red-400">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <TransitionLink href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
                  Sign In
                </TransitionLink>

                <button 
                  onClick={() => triggerTransition(() => router.push("/studio"))}
                  className="btn btn-primary px-4 py-2 text-sm"
                >
                  Get Started
                </button>

              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[var(--bg-primary)]/95 backdrop-blur-xl md:hidden"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-lg">Menu</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-[var(--bg-elevated)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-6 text-lg font-medium">
                {navLinks.map((link) => (
                  <TransitionLink
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between border-b border-[var(--border)] pb-4"
                  >
                    {link.name}
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </TransitionLink>
                ))}

              </nav>

              <div className="mt-auto flex flex-col gap-4">
                {session ? (
                  <>
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        triggerTransition(() => router.push("/studio"));
                      }}
                      className="btn btn-primary w-full py-4 text-lg"
                    >
                      Launch Studio
                    </button>
                    <button onClick={handleSignOut} className="btn btn-secondary w-full py-4 text-lg">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <TransitionLink 
                      href="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-secondary w-full py-4 text-lg text-center"
                    >
                      Sign In
                    </TransitionLink>
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        triggerTransition(() => router.push("/studio"));
                      }}
                      className="btn btn-primary w-full py-4 text-lg"
                    >
                      Get Started
                    </button>
                  </>
                )}

                <div className="text-center text-sm text-[var(--text-tertiary)] mt-4">
                   © 2025 FabricDesigner.AI
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <TransitionLink href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center relative">
                <Image src="/logo.png" alt="FabricDesigner.AI" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-bold text-lg">FabricDesigner.AI</span>
            </TransitionLink>


            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                 AI-powered fabric and textile design generation platform. Transform reference images into professional, print-ready patterns.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink icon={<Twitter className="w-4 h-4" />} href="#" />
              <SocialLink icon={<Github className="w-4 h-4" />} href="#" />
              <SocialLink icon={<Instagram className="w-4 h-4" />} href="#" />
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
              <li><TransitionLink href="/#features" className="hover:text-[var(--accent)] transition-colors">Features</TransitionLink></li>
              <li><TransitionLink href="/studio" className="hover:text-[var(--accent)] transition-colors">Design Studio</TransitionLink></li>
              <li><TransitionLink href="/pricing" className="hover:text-[var(--accent)] transition-colors">Pricing</TransitionLink></li>
              <li><TransitionLink href="/showcase" className="hover:text-[var(--accent)] transition-colors">Showcase</TransitionLink></li>
              <li><Link href="/api" className="hover:text-[var(--accent)] transition-colors">API</Link></li>
            </ul>

          </div>

          <div>
            <h4 className="font-semibold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
              <li><Link href="/docs" className="hover:text-[var(--accent)] transition-colors">Documentation</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent)] transition-colors">Blog</Link></li>
              <li><Link href="/community" className="hover:text-[var(--accent)] transition-colors">Community</Link></li>
              <li><Link href="/help" className="hover:text-[var(--accent)] transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-6">Stay Updated</h4>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Get the latest updates and design tips directly in your inbox.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="input bg-[var(--bg-primary)] border-[var(--border)] focus:border-[var(--accent)]"
              />
              <button className="btn btn-primary px-3">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-tertiary)]">
          <p>© 2025 FabricDesigner.AI. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-[var(--text-secondary)] transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon, href }: { icon: React.ReactNode, href: string }) {
  return (
    <a 
      href={href}
      className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white hover:border-transparent transition-all hover:-translate-y-1"
    >
      {icon}
    </a>
  );
}
