/**
 * Vast.ai API Client for GPU Instance Management
 * Handles auto-start of GPU instances when jobs are submitted
 */

const VASTAI_API_URL = "https://console.vast.ai/api/v0";
const VASTAI_API_KEY = process.env.VASTAI_API_KEY || "";
const VASTAI_INSTANCE_ID = process.env.VASTAI_INSTANCE_ID || "";

interface InstanceStatus {
  id: number;
  status: "running" | "stopped" | "loading" | "exited";
  publicIp: string | null;
  ports: Record<string, Array<{ HostPort: number }>>;
}

/**
 * Get instance status from Vast.ai
 */
export async function getInstanceStatus(): Promise<InstanceStatus | null> {
  if (!VASTAI_API_KEY || !VASTAI_INSTANCE_ID) {
    console.warn("Vast.ai credentials not configured");
    return null;
  }

  try {
    const response = await fetch(`${VASTAI_API_URL}/instances/`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${VASTAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to get instances:", response.status);
      return null;
    }

    const data = await response.json();
    const instances = data.instances || [];

    for (const inst of instances) {
      if (String(inst.id) === String(VASTAI_INSTANCE_ID)) {
        return {
          id: inst.id,
          status: inst.actual_status || "unknown",
          publicIp: inst.public_ipaddr || null,
          ports: inst.ports || {},
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching instance status:", error);
    return null;
  }
}

/**
 * Start the GPU instance
 */
export async function startInstance(): Promise<boolean> {
  if (!VASTAI_API_KEY || !VASTAI_INSTANCE_ID) {
    console.warn("Vast.ai credentials not configured");
    return false;
  }

  try {
    console.log(`🚀 Starting GPU instance ${VASTAI_INSTANCE_ID}...`);

    const response = await fetch(
      `${VASTAI_API_URL}/instances/${VASTAI_INSTANCE_ID}/`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${VASTAI_API_KEY}`,
        },
        body: JSON.stringify({ state: "running" }),
      }
    );

    if (response.ok) {
      console.log("✅ Instance start requested");
      return true;
    }

    console.error("❌ Failed to start instance:", response.status);
    return false;
  } catch (error) {
    console.error("Error starting instance:", error);
    return false;
  }
}

/**
 * Get the worker URL for the GPU instance
 */
export async function getWorkerUrl(): Promise<string | null> {
  const status = await getInstanceStatus();
  
  if (!status || status.status !== "running" || !status.publicIp) {
    return null;
  }

  // Get port 8000 mapping
  const portMapping = status.ports["8000/tcp"];
  const port = portMapping?.[0]?.HostPort || 8000;

  return `http://${status.publicIp}:${port}`;
}

/**
 * Check if worker is healthy and ready
 */
export async function isWorkerHealthy(workerUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${workerUrl}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.status === "healthy";
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Ensure GPU is running and return worker URL
 * Auto-starts the instance if stopped
 */
export async function ensureGpuAvailable(): Promise<{
  url: string | null;
  status: "ready" | "starting" | "unavailable";
  message: string;
}> {
  const status = await getInstanceStatus();

  if (!status) {
    return {
      url: null,
      status: "unavailable",
      message: "GPU instance not found. Check VASTAI_INSTANCE_ID.",
    };
  }

  // If already running, check if worker is healthy
  if (status.status === "running" && status.publicIp) {
    const workerUrl = await getWorkerUrl();
    
    if (workerUrl) {
      const healthy = await isWorkerHealthy(workerUrl);
      
      if (healthy) {
        return {
          url: workerUrl,
          status: "ready",
          message: "GPU is ready",
        };
      }
      
      // Running but not healthy yet - still loading
      return {
        url: null,
        status: "starting",
        message: "GPU is starting, worker initializing...",
      };
    }
  }

  // If stopped, start it
  if (status.status === "stopped" || status.status === "exited") {
    const started = await startInstance();
    
    if (started) {
      return {
        url: null,
        status: "starting",
        message: "GPU instance starting, please wait 60-90 seconds...",
      };
    }

    return {
      url: null,
      status: "unavailable",
      message: "Failed to start GPU instance",
    };
  }

  // If loading
  if (status.status === "loading") {
    return {
      url: null,
      status: "starting",
      message: "GPU instance is starting up...",
    };
  }

  return {
    url: null,
    status: "unavailable",
    message: `Unknown instance status: ${status.status}`,
  };
}
