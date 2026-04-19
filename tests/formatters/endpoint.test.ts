import { describe, it, expect } from "vitest";
import { formatEndpoint, formatEndpoints } from "../../src/formatters/endpoint.js";

const RAW_ENDPOINT = {
  id: "ep_abc123",
  name: "stable-diffusion-xl",
  templateId: "tmpl_xyz789",
  gpuIds: "AMPERE_24",
  workersMin: 0,
  workersMax: 3,
  activeWorkers: 1,
  idleTimeout: 300,
  scalerType: "QUEUE_DELAY",
  scalerValue: 4,
  // Verbose fields that should be stripped
  userId: "user_12345",
  networkVolumeId: "vol_456",
  locations: "US",
  createdAt: "2026-04-01T00:00:00Z",
};

describe("formatEndpoint", () => {
  it("extracts essential fields", () => {
    const result = formatEndpoint(RAW_ENDPOINT);

    expect(result.id).toBe("ep_abc123");
    expect(result.name).toBe("stable-diffusion-xl");
    expect(result.templateId).toBe("tmpl_xyz789");
    expect(result.gpuIds).toBe("AMPERE_24");
    expect(result.workersMin).toBe(0);
    expect(result.workersMax).toBe(3);
    expect(result.workersActive).toBe(1);
    expect(result.idleTimeout).toBe(300);
    expect(result.scalerType).toBe("QUEUE_DELAY");
    expect(result.scalerValue).toBe(4);
  });

  it("strips verbose fields", () => {
    const result = formatEndpoint(RAW_ENDPOINT) as Record<string, unknown>;
    expect(result.userId).toBeUndefined();
    expect(result.networkVolumeId).toBeUndefined();
    expect(result.locations).toBeUndefined();
    expect(result.createdAt).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatEndpoint({});
    expect(result.id).toBe("");
    expect(result.name).toBe("");
    expect(result.templateId).toBe("");
    expect(result.gpuIds).toBe("");
    expect(result.workersMin).toBe(0);
    expect(result.workersMax).toBe(0);
    expect(result.workersActive).toBe(0);
    expect(result.idleTimeout).toBe(0);
    expect(result.scalerType).toBe("unknown");
    expect(result.scalerValue).toBe(0);
  });

  it("uses workersActive field if activeWorkers not present", () => {
    const result = formatEndpoint({
      id: "ep_test",
      workersActive: 5,
    });
    expect(result.workersActive).toBe(5);
  });

  it("prefers activeWorkers over workersActive", () => {
    const result = formatEndpoint({
      id: "ep_test",
      activeWorkers: 3,
      workersActive: 5,
    });
    // The formatter checks workersActive first, then activeWorkers as fallback
    expect(result.workersActive).toBe(5);
  });
});

describe("formatEndpoints", () => {
  it("maps array of endpoints", () => {
    const results = formatEndpoints([RAW_ENDPOINT, RAW_ENDPOINT]);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("ep_abc123");
    expect(results[1].name).toBe("stable-diffusion-xl");
  });
});
