/**
 * Token-efficient formatter for RunPod pods.
 * Strips verbose fields while keeping identity, GPU spec, status, and pricing.
 */

interface PodSummary {
  id: string;
  name: string;
  status: string;
  gpu: string;
  gpuCount: number;
  vcpu: number;
  memoryGb: number;
  volumeGb: number;
  containerDiskGb: number;
  image: string;
  costPerHr: string;
  uptimeHrs: string;
  cloudType: string;
  ports: string;
}

export function formatPod(raw: Record<string, unknown>): PodSummary {
  const runtime = raw.runtime as Record<string, unknown> | undefined;
  const machine = raw.machine as Record<string, unknown> | undefined;

  return {
    id: (raw.id as string) || "",
    name: (raw.name as string) || "",
    status: (raw.desiredStatus as string) || (raw.lastStatusChange as string) || "unknown",
    gpu: (machine?.gpuDisplayName as string) || (raw.gpuTypeId as string) || "unknown",
    gpuCount: (raw.gpuCount as number) || 1,
    vcpu: (raw.vcpuCount as number) || (machine?.vcpuCount as number) || 0,
    memoryGb: Math.round(((raw.memoryInGb as number) || (machine?.memoryInGb as number) || 0)),
    volumeGb: (raw.volumeInGb as number) || 0,
    containerDiskGb: (raw.containerDiskInGb as number) || 0,
    image: (raw.imageName as string) || "unknown",
    costPerHr: formatCost(
      (raw.costPerHr as number) || (runtime?.costPerHr as number) || (machine?.costPerHr as number)
    ),
    uptimeHrs: formatUptime(runtime?.uptimeInSeconds as number),
    cloudType: (raw.cloudType as string) || "unknown",
    ports: (raw.ports as string) || "",
  };
}

export function formatPods(raw: Record<string, unknown>[]): PodSummary[] {
  return raw.map(formatPod);
}

function formatCost(cost: number | undefined | null): string {
  if (!cost) return "n/a";
  return `$${cost.toFixed(4)}/hr`;
}

function formatUptime(seconds: number | undefined | null): string {
  if (!seconds) return "n/a";
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.round(seconds / 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
