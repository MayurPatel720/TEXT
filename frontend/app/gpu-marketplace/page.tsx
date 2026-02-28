'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface GPU {
  id: number;
  gpu_name: string;
  gpu_ram: number;
  disk_space: number;
  cpu_cores: number;
  dph_total: number;
  geolocation: string;
  reliability: number;
  inet_down: number;
  inet_up: number;
}

export default function GPUMarketplacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGpu, setSelectedGpu] = useState<GPU | null>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [vastApiKey, setVastApiKey] = useState('');
  const [isRenting, setIsRenting] = useState(false);
  const [progress, setProgress] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'reliability' | 'location'>('price');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
      return;
    }

    if (status === 'authenticated') {
      fetchGPUs();
    }
  }, [status, router]);

  const fetchGPUs = async () => {
    try {
      const res = await fetch('/api/list-gpus');
      const data = await res.json();
      setGpus(data);
    } catch (error) {
      console.error('Error fetching GPUs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGpu = (gpu: GPU) => {
    setSelectedGpu(gpu);
    setShowRentalModal(true);
  };

  const handleRent = async () => {
    if (!selectedGpu || !vastApiKey) return;

    setIsRenting(true);
    setProgress('Renting and setting up your GPU...');

    try {
      const res = await fetch('/api/rent-gpu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vastApiKey,
          offerId: selectedGpu.id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to rent GPU');
      }

      // Poll for completion
      pollJobStatus(data.jobId);
    } catch (error: any) {
      setProgress('');
      setIsRenting(false);
      alert('Error: ' + error.message);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job-status/${jobId}`);
        const data = await res.json();

        setProgress(data.message);

        if (data.status === 'completed') {
          clearInterval(interval);
          setProgress('✅ GPU Ready! Redirecting...');
          setTimeout(() => router.push('/dashboard/my-gpus'), 2000);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsRenting(false);
          alert('Setup failed: ' + data.message);
        }
      } catch (error) {
        clearInterval(interval);
        setIsRenting(false);
      }
    }, 5000);
  };

  const sortedGPUs = [...gpus].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.dph_total - b.dph_total;
      case 'reliability':
        return b.reliability - a.reliability;
      case 'location':
        return a.geolocation.localeCompare(b.geolocation);
      default:
        return 0;
    }
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading GPUs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-[#0A0A0A] to-[var(--bg-secondary)] border-b border-white/5">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent)]/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Choose Your GPU
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Select from premium RTX 4090 GPUs. Pay only for what you use.
              <br className="hidden sm:block" />
              Automated setup in 5-10 minutes.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-12">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{gpus.length}</div>
                <div className="text-sm text-gray-500">Available GPUs</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">5-10min</div>
                <div className="text-sm text-gray-500">Setup Time</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">24GB</div>
                <div className="text-sm text-gray-500">VRAM</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-sm text-gray-400">
            Showing {sortedGPUs.length} available GPUs
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('price')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === 'price'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Best Price
            </button>
            <button
              onClick={() => setSortBy('reliability')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === 'reliability'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Most Reliable
            </button>
            <button
              onClick={() => setSortBy('location')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === 'location'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Location
            </button>
          </div>
        </div>

        {/* GPU Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGPUs.map((gpu, index) => (
            <motion.div
              key={gpu.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <GPUCard gpu={gpu} onSelect={handleSelectGpu} />
            </motion.div>
          ))}
        </div>

        {gpus.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No GPUs available at the moment.</p>
            <button
              onClick={fetchGPUs}
              className="mt-4 px-6 py-2 bg-[var(--accent)] text-white rounded-full hover:bg-[var(--accent-hover)] transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Rental Modal */}
      <AnimatePresence>
        {showRentalModal && selectedGpu && (
          <RentalModal
            gpu={selectedGpu}
            vastApiKey={vastApiKey}
            setVastApiKey={setVastApiKey}
            isRenting={isRenting}
            progress={progress}
            onRent={handleRent}
            onClose={() => {
              setShowRentalModal(false);
              setSelectedGpu(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// GPU Card Component
function GPUCard({ gpu, onSelect }: { gpu: GPU; onSelect: (gpu: GPU) => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[var(--accent)]/50 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onSelect(gpu)}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-purple-500/0 group-hover:from-[var(--accent)]/5 group-hover:to-purple-500/5 transition-all duration-300"></div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">{gpu.gpu_name}</h3>
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-400">Available</span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <SpecItem icon="💾" label="VRAM" value={`${gpu.gpu_ram} GB`} />
          <SpecItem icon="💿" label="Disk" value={`${gpu.disk_space} GB`} />
          <SpecItem icon="⚡" label="CPU" value={`${gpu.cpu_cores} cores`} />
          <SpecItem icon="🌐" label="Speed" value={`${gpu.inet_down} Mbps`} />
        </div>

        {/* Location & Reliability */}
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">📍</span>
            <span className="text-white text-sm">{gpu.geolocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">⭐</span>
            <span className="text-white text-sm">{(gpu.reliability * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-3xl font-bold text-white mb-1">
              ${gpu.dph_total.toFixed(3)}
              <span className="text-base text-gray-500 font-normal">/hr</span>
            </div>
            <div className="text-sm text-gray-500">
              ~${(gpu.dph_total * 24).toFixed(2)}/day
            </div>
          </div>

          <button className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full font-medium transition-all group-hover:scale-105">
            Select
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Spec Item Component
function SpecItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  );
}

// Rental Modal Component
function RentalModal({
  gpu,
  vastApiKey,
  setVastApiKey,
  isRenting,
  progress,
  onRent,
  onClose,
}: {
  gpu: GPU;
  vastApiKey: string;
  setVastApiKey: (key: string) => void;
  isRenting: boolean;
  progress: string;
  onRent: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">Complete Rental</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selected GPU Summary */}
          <div className="bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 border border-[var(--accent)]/20 rounded-2xl p-6 mb-6">
            <div className="text-sm text-gray-400 mb-2">Selected GPU</div>
            <div className="text-xl font-bold text-white mb-4">{gpu.gpu_name}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">${gpu.dph_total.toFixed(3)}</span>
              <span className="text-gray-400">/hour</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ~${(gpu.dph_total * 24 * 30).toFixed(2)}/month if running 24/7
            </div>
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Vast.ai API Key
              <a
                href="https://cloud.vast.ai/account/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-[var(--accent)] hover:underline text-sm font-normal"
              >
                Get API Key →
              </a>
            </label>
            <input
              type="password"
              value={vastApiKey}
              onChange={(e) => setVastApiKey(e.target.value)}
              placeholder="Enter your Vast.ai API key"
              disabled={isRenting}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-2">
              Your API key is encrypted and only used to rent GPUs on your behalf
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onRent}
            disabled={isRenting || !vastApiKey}
            className="w-full px-6 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isRenting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Setting up...
              </span>
            ) : (
              '🚀 Rent & Auto-Setup'
            )}
          </button>

          {/* Progress */}
          {progress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                <span className="text-blue-400 text-sm">{progress}</span>
              </div>
            </motion.div>
          )}

          {/* What Happens Next */}
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">What happens next:</h3>
            <ol className="space-y-3">
              {[
                'We rent this GPU on your Vast.ai account',
                'Automatically install ComfyUI + FLUX models (8GB)',
                'Configure all textile design workflows',
                'Start worker on port 8000',
                'You start generating! (~5-10 minutes)',
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
