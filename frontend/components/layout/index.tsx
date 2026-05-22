"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LocalTransitionLink from "@/components/TransitionLink";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Github, Twitter, Instagram, LogOut, Clock, Home, Wand2, History, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";


export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, status } = useSession();
  const isStudio = pathname === "/studio";

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
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border)]"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="h-16 flex items-center justify-between">
          {/* Left side - Desktop: matches sidebar, Mobile: compact */}
          <div className="hidden md:flex w-80 flex-shrink-0 px-4 items-center gap-3 border-r border-[var(--border)] h-full">
            <button 
              onClick={() => router.push("/")}
              className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors group"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] rotate-180 group-hover:text-[var(--text-primary)]" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={28} height={28} className="object-contain" />
              <span className="font-semibold text-[var(--text-primary)]">Design Studio</span>
            </div>
          </div>
          
          {/* Mobile Header - visible on small screens */}
          <div className="flex md:hidden items-center gap-3 px-4">
            <button 
              onClick={() => router.push("/")}
              className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={24} height={24} className="object-contain" />
              <span className="font-medium text-[var(--text-primary)] text-sm">Studio</span>
            </div>
          </div>
          
          {/* Right side - main content area */}
          <div className="flex-1 px-6 flex items-center justify-end gap-4">
            {/* Credits Badge */}
            <div className="hidden md:flex items-center gap-2 bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full border border-[var(--border)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {session?.user?.credits !== undefined ? `${session.user.credits} credits` : '...'}
              </span>
            </div>
            
            {/* User Profile */}
            {session ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center justify-center text-white text-sm font-semibold"
                >
                  {session.user?.name?.[0] || "U"}
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl py-2 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                      <p className="text-sm font-medium text-white">{session.user?.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">{session.user?.email}</p>
                    </div>

                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push("/history");
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--bg-secondary)] flex items-center gap-3 text-[var(--text-primary)]"
                    >
                      <Clock className="w-4 h-4" />
                      History
                    </button>
                    <button onClick={handleSignOut} className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--bg-secondary)] flex items-center gap-3 text-red-400">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button className="btn btn-primary px-6 py-2 text-sm font-semibold rounded-full whitespace-nowrap">Sign In</button>
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[var(--bg-primary)]/90 backdrop-blur-md ${
          isScrolled ? "border-b border-[var(--border)]" : ""
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <LocalTransitionLink href="/" className="flex items-center gap-2.5 group">

            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={36} height={36} className="object-contain" />
            </div>
            <span className="font-bold text-lg leading-none tracking-tight">FabricDesigner.AI</span>
          </LocalTransitionLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link 
              href="/#features" 
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Features
            </Link>
            <Link 
              href="/#how-it-works" 
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              How It Works
            </Link>
            <Link 
              href="/#pricing" 
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Pricing
            </Link>
            <LocalTransitionLink 
              href="/studio" 
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1"
            >
              Design Studio
            </LocalTransitionLink>
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
                        router.push("/history");
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-primary)] flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Design Studio
                    </button>

                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push("/history");
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
                <LocalTransitionLink href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Sign In
                </LocalTransitionLink>

                <button 
                  onClick={() => router.push("/studio")}
                  className="btn btn-primary px-6 py-2.5 text-sm font-semibold rounded-full whitespace-nowrap"
                >
                  Get Started
                </button>

              </>
            )}
          </div>

        </div>
      </motion.header>
      <BottomTab />
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <LocalTransitionLink href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center relative">
                <Image src="/logo.png" alt="FabricDesigner.AI" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-bold text-lg">FabricDesigner.AI</span>
            </LocalTransitionLink>


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
              <li><LocalTransitionLink href="/#features" className="hover:text-[var(--accent)] transition-colors">Features</LocalTransitionLink></li>
              <li><LocalTransitionLink href="/studio" className="hover:text-[var(--accent)] transition-colors">Design Studio</LocalTransitionLink></li>
              <li><LocalTransitionLink href="/#pricing" className="hover:text-[var(--accent)] transition-colors">Pricing</LocalTransitionLink></li>
              <li><LocalTransitionLink href="/showcase" className="hover:text-[var(--accent)] transition-colors">Showcase</LocalTransitionLink></li>
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
              <button className="btn btn-primary w-10 h-10 flex items-center justify-center rounded-full p-0 flex-shrink-0">
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

function BottomTab() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: "Home", icon: <Home className="w-5 h-5" />, href: "/" },
    { name: "Studio", icon: <Wand2 className="w-5 h-5" />, href: "/studio" },
    { name: "History", icon: <History className="w-5 h-5" />, href: "/history" },
    { name: "Account", icon: <User className="w-5 h-5" />, href: "/login" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg-elevated)] border-t border-[var(--border)] safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
