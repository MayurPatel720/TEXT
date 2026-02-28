"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Script from "next/script";
import { Header } from "@/components/layout";
import { Download, AlertCircle, ShoppingCart, Info, Loader2, CheckCircle2 } from "lucide-react";

export default function SharePage({ params }: { params: { id: string } }) {
    const [image, setImage] = useState<{ url: string; seed?: number } | null>(null);
    const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isObscured, setIsObscured] = useState(false);

    useEffect(() => {
        async function fetchImage() {
            try {
                const res = await fetch(`/api/share/${params.id}`);
                if (!res.ok) throw new Error("Image not found");
                const data = await res.json();
                if (data.success && data.generation) {
                    setImage(data.generation);
                } else {
                    throw new Error("Could not load image");
                }
            } catch (err) {
                setError("This shared design could not be found or has been removed.");
            } finally {
                setLoading(false);
            }
        }

        fetchImage();
    }, [params.id]);

    useEffect(() => {
        // Advanced Anti-Screenshot / Snipping Tool Detection
        // Browsers fire the blur event or visibilitychange when native screenshot tools overlay the screen
        const handleBlur = () => {
            if (!unlockedUrl) {
                setIsObscured(true);
            }
        };

        const handleFocus = () => {
            setIsObscured(false);
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block Print Screen key
            if (e.key === 'PrintScreen') {
                setIsObscured(true);
                setTimeout(() => setIsObscured(false), 3000);
            }
            // Block Ctrl+S / Cmd+S
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
            }
            // Block Command+Shift+3 or 4 (Mac Screenshots)
            if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
                setIsObscured(true);
                setTimeout(() => setIsObscured(false), 3000);
            }
        };

        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [unlockedUrl, isObscured]);

    const handlePurchase = async () => {
        if (typeof window === 'undefined' || !(window as any).Razorpay) {
            alert("Payment system is loading. Please wait a moment.");
            return;
        }

        try {
            setPurchasing(true);
            const response = await fetch(`/api/share/${params.id}/purchase`);
            const data = await response.json();

            if (!data.success) {
                alert("Failed to initialize payment: " + (data.error || "Unknown error"));
                setPurchasing(false);
                return;
            }

            const options = {
                key: data.razorpayKey,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Textile AI",
                description: data.order.planName,
                order_id: data.order.id,
                handler: async function (paymentResponse: any) {
                    try {
                        const verifyRes = await fetch(`/api/share/${params.id}/purchase`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                paymentId: paymentResponse.razorpay_payment_id,
                                orderId: paymentResponse.razorpay_order_id,
                                signature: paymentResponse.razorpay_signature,
                            }),
                        });
                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            setUnlockedUrl(verifyData.url);
                        } else {
                            alert("Payment verification failed. Please contact support.");
                        }
                    } catch (err) {
                        alert("Error verifying payment.");
                    }
                },
                modal: {
                    ondismiss: function () {
                        setPurchasing(false);
                    }
                },
                theme: { color: "#0066FF" },
                image: "/logo.png"
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error(error);
            alert("Payment failed to initialize");
            setPurchasing(false);
        }
    };

    const watermarkStyles = `
    .watermark-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 20;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 50px,
        rgba(255, 255, 255, 0.1) 50px,
        rgba(255, 255, 255, 0.1) 100px
      );
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      opacity: 0.8;
      transform: rotate(-30deg) scale(1.5);
      mix-blend-mode: overlay;
    }

    .watermark-text-primary {
      font-size: clamp(1.5rem, 5vw, 3rem);
      font-weight: 900;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      text-shadow: 2px 2px 10px rgba(0,0,0,0.8), -2px -2px 10px rgba(0,0,0,0.8);
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
    }

    .watermark-text-secondary {
      font-size: clamp(1rem, 3vw, 2rem);
      font-weight: 700;
      color: rgba(255, 100, 100, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.5em;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.8), -2px -2px 8px rgba(0,0,0,0.8);
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
    }

    .anti-theft-shield {
      position: absolute;
      inset: 0;
      z-index: 30;
      background: transparent;
      cursor: crosshair;
    }

    /* Blackout screen if user tries to Print to PDF or Print screen in some browsers */
    @media print {
      body {
        display: none !important;
      }
      html {
        background-color: black !important;
      }
    }
  `;

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            {/* Razorpay Script */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <style dangerouslySetInnerHTML={{ __html: watermarkStyles }} />
            <Header />

            <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start">

                {/* Left Side: Watermarked Image Preview */}
                <div className="flex-1 w-full relative">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#111111] border border-white/10 relative select-none shadow-2xl">
                        {loading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                <p>Loading design preview...</p>
                            </div>
                        ) : error ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-8 text-center">
                                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                                <p>{error}</p>
                            </div>
                        ) : unlockedUrl ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                                <img
                                    src={unlockedUrl}
                                    alt="Unlocked Design"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        ) : image ? (
                            <div
                                className="relative w-full h-full"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                            >
                                {/* Image Background instead of img tag to make inspect element harder */}
                                <div
                                    className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none"
                                    style={{
                                        backgroundImage: `url(${image.url})`
                                    }}
                                />

                                {/* Invisible Shield for right click blocking */}
                                <div
                                    className="anti-theft-shield"
                                    onContextMenu={(e) => e.preventDefault()}
                                    title="Preview Image"
                                />

                                {/* High Quality Watermark Overlay */}
                                <div className="watermark-overlay">
                                    <div className="watermark-text-primary">FabricDesigner.AI</div>
                                    <div className="watermark-text-secondary">Preview Only</div>
                                </div>
                                <div className="watermark-overlay" style={{ transform: 'rotate(-30deg) scale(1.5) translate(0%, 100%)' }}>
                                    <div className="watermark-text-primary">FabricDesigner.AI</div>
                                    <div className="watermark-text-secondary">Preview Only</div>
                                </div>
                                <div className="watermark-overlay" style={{ transform: 'rotate(-30deg) scale(1.5) translate(0%, -100%)' }}>
                                    <div className="watermark-text-primary">FabricDesigner.AI</div>
                                    <div className="watermark-text-secondary">Preview Only</div>
                                </div>

                                {/* Blackout layer for when window loses focus (screenshot tools) */}
                                {isObscured && (
                                    <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center text-white transition-all duration-200">
                                        <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
                                        <h2 className="text-2xl font-black mb-2 uppercase tracking-widest text-red-500 text-center px-4">Security Alert</h2>
                                        <p className="text-white/80 font-medium text-center px-6">Screenshots are strictly prohibited.<br />Please return to the window.</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Right Side: Purchase/Download Controls */}
                <div className="w-full md:w-[320px] shrink-0 bg-[#111111] border border-white/10 rounded-2xl p-6 flex flex-col shadow-xl">
                    <div className="mb-6">
                        <h1 className="text-xl font-bold text-white mb-2">Exclusive AI Textile Design</h1>
                        <p className="text-sm text-white/60">
                            This is a protected preview. The creator of this design has shared it with you for approval.
                        </p>
                    </div>

                    <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                            <div className="text-sm text-white/80">
                                <strong className="text-[var(--accent)] block mb-1">Commercial License (₹100)</strong>
                                Purchase the original, unwatermarked, 300 DPI high-resolution file perfectly suited for industrial fabric printing.
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        {unlockedUrl ? (
                            <>
                                <div className="bg-[var(--success)]/10 text-[var(--success)] p-4 rounded-xl flex items-center gap-2 font-medium mb-2 border border-[var(--success)]/20">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    Successfully unlocked!
                                </div>
                                <button
                                    onClick={() => {
                                        const a = document.createElement('a');
                                        a.href = unlockedUrl;
                                        a.download = `textile-design-${params.id}.png`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    }}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
                                >
                                    <Download className="w-5 h-5" />
                                    DOWNLOAD CLEAN DESIGN
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handlePurchase}
                                    disabled={loading || purchasing || !!error}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[#0052cc] text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/30 group"
                                >
                                    {purchasing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    )}
                                    {purchasing ? "PROCESSING..." : "BUY DESIGN (₹100)"}
                                </button>

                                <button
                                    disabled
                                    title="Purchase required to unlock"
                                    className="w-full py-3 rounded-xl bg-white/5 text-white/40 font-medium flex items-center justify-center gap-2 border border-white/10 cursor-not-allowed text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Free Preview (Disabled)
                                </button>
                            </>
                        )}
                    </div>

                </div>

            </div>
        </main>
    );
}
