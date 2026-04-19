/**
 * Token-efficient formatter for RunPod serverless endpoints.
 */

interface EndpointSummary {
  id: string;
  name: string;
  templateId: string;
  gpuIds: string;
  workersMin: number;
  workersMax: number;
  workersActive: number;
  idleTimeout: number;
  scalerType: string;
  scalerValue: number;
}

export function formatEndpoint(raw: Record<string, unknown>): EndpointSummary {
  return {
    id: (raw.id as string) || "",
    name: (raw.name as string) || "",
    templateId: (raw.templateId as string) || "",
    gpuIds: (raw.gpuIds as string) || "",
    workersMin: (raw.workersMin as number) || 0,
    workersMax: (raw.workersMax as number) || 0,
    workersActive: (raw.workersActive as number) || (raw.activeWorkers as number) || 0,
    idleTimeout: (raw.idleTimeout as number) || 0,
    scalerType: (raw.scalerType as string) || "unknown",
    scalerValue: (raw.scalerValue as number) || 0,
  };
}

export function formatEndpoints(raw: Record<string, unknown>[]): EndpointSummary[] {
  return raw.map(formatEndpoint);
}
