import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface VastGPU {
  id: number;
  gpu_name: string;
  gpu_ram: number;
  disk_space: number;
  cpu_cores: number;
  dph_total: number;
  geolocation: string;
  reliability2: number;
  inet_down: number;
  inet_up: number;
}

export async function GET() {
  try {
    // Query Vast.ai public API for available GPUs
    const response = await fetch('https://console.vast.ai/api/v0/bundles/', {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Vast.ai');
    }

    const data = await response.json();

    // Filter and format GPUs suitable for ComfyUI
    const gpus = data.offers
      ?.filter((gpu: VastGPU) =>
        gpu.gpu_name?.includes('RTX 4090') &&
        gpu.disk_space >= 50 &&
        gpu.gpu_ram >= 20 &&
        gpu.reliability2 >= 0.90
      )
      .map((gpu: VastGPU) => ({
        id: gpu.id,
        gpu_name: gpu.gpu_name,
        gpu_ram: gpu.gpu_ram,
        disk_space: gpu.disk_space,
        cpu_cores: gpu.cpu_cores,
        dph_total: gpu.dph_total,
        geolocation: gpu.geolocation,
        reliability: gpu.reliability2,
        inet_down: gpu.inet_down,
        inet_up: gpu.inet_up,
      }))
      .sort((a: any, b: any) => a.dph_total - b.dph_total) // Sort by price
      .slice(0, 12) || []; // Show top 12

    return NextResponse.json(gpus);
  } catch (error) {
    console.error('Error fetching GPUs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available GPUs' },
      { status: 500 }
    );
  }
}
