/**
 * Token-efficient formatter for RunPod GPU types.
 * Strips verbose fields, promotes pricing and availability.
 */

interface GpuTypeSummary {
  id: string;
  displayName: string;
  memoryGb: number;
  secureCloud: boolean;
  communityCloud: boolean;
  securePrice: string;
  communityPrice: string;
  minBidPrice: string;
}

export function formatGpuType(raw: Record<string, unknown>): GpuTypeSummary {
  const lowestPrice = raw.lowestPrice as Record<string, unknown> | undefined;
  const secureLowestPrice = raw.securePrice as number | undefined;
  const communityLowestPrice = raw.communityPrice as number | undefined;

  return {
    id: (raw.id as string) || "",
    displayName: (raw.displayName as string) || (raw.id as string) || "unknown",
    memoryGb: (raw.memoryInGb as number) || 0,
    secureCloud: (raw.secureCloud as boolean) ?? false,
    communityCloud: (raw.communityCloud as boolean) ?? false,
    securePrice: formatPrice(
      secureLowestPrice || (lowestPrice?.uninterruptablePrice as number)
    ),
    communityPrice: formatPrice(
      communityLowestPrice || (lowestPrice?.uninterruptablePrice as number)
    ),
    minBidPrice: formatPrice(lowestPrice?.minimumBidPrice as number),
  };
}

export function formatGpuTypes(raw: Record<string, unknown>[]): GpuTypeSummary[] {
  return raw.map(formatGpuType);
}

function formatPrice(price: number | undefined | null): string {
  if (!price) return "n/a";
  return `$${price.toFixed(4)}/hr`;
}
