import { describe, it, expect } from "vitest";
import { formatGpuType, formatGpuTypes } from "../../src/formatters/gpu.js";

const RAW_GPU = {
  id: "NVIDIA GeForce RTX 4090",
  displayName: "RTX 4090",
  memoryInGb: 24,
  secureCloud: true,
  communityCloud: true,
  lowestPrice: {
    minimumBidPrice: 0.3,
    uninterruptablePrice: 0.74,
  },
  // Verbose fields
  maxGpuCount: 4,
  maxGpuCountCommunityCloud: 2,
  communitySpotPrice: 0.44,
};

describe("formatGpuType", () => {
  it("extracts essential fields", () => {
    const result = formatGpuType(RAW_GPU);

    expect(result.id).toBe("NVIDIA GeForce RTX 4090");
    expect(result.displayName).toBe("RTX 4090");
    expect(result.memoryGb).toBe(24);
    expect(result.secureCloud).toBe(true);
    expect(result.communityCloud).toBe(true);
    expect(result.securePrice).toBe("$0.7400/hr");
    expect(result.minBidPrice).toBe("$0.3000/hr");
  });

  it("strips verbose fields", () => {
    const result = formatGpuType(RAW_GPU) as Record<string, unknown>;
    expect(result.maxGpuCount).toBeUndefined();
    expect(result.maxGpuCountCommunityCloud).toBeUndefined();
    expect(result.communitySpotPrice).toBeUndefined();
    expect(result.lowestPrice).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatGpuType({});
    expect(result.id).toBe("");
    expect(result.displayName).toBe("unknown");
    expect(result.memoryGb).toBe(0);
    expect(result.secureCloud).toBe(false);
    expect(result.communityCloud).toBe(false);
    expect(result.securePrice).toBe("n/a");
    expect(result.communityPrice).toBe("n/a");
    expect(result.minBidPrice).toBe("n/a");
  });

  it("handles GPU with no pricing", () => {
    const result = formatGpuType({
      id: "NVIDIA H100",
      displayName: "H100 SXM",
      memoryInGb: 80,
      secureCloud: true,
      communityCloud: false,
    });
    expect(result.memoryGb).toBe(80);
    expect(result.securePrice).toBe("n/a");
    expect(result.minBidPrice).toBe("n/a");
  });
});

describe("formatGpuTypes", () => {
  it("maps array of GPU types", () => {
    const results = formatGpuTypes([RAW_GPU, RAW_GPU]);
    expect(results).toHaveLength(2);
    expect(results[0].displayName).toBe("RTX 4090");
  });
});
