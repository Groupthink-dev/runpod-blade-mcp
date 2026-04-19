import { describe, it, expect } from "vitest";
import { formatPod, formatPods } from "../../src/formatters/pod.js";

const RAW_POD = {
  id: "abc123def456",
  name: "training-run-01",
  desiredStatus: "RUNNING",
  gpuTypeId: "NVIDIA GeForce RTX 4090",
  gpuCount: 2,
  vcpuCount: 16,
  memoryInGb: 64,
  volumeInGb: 100,
  containerDiskInGb: 20,
  imageName: "runpod/pytorch:2.1.0-py3.10-cuda12.1.0-devel",
  cloudType: "SECURE",
  ports: "8888/http,22/tcp",
  machine: {
    gpuDisplayName: "RTX 4090",
    vcpuCount: 16,
    memoryInGb: 64,
    costPerHr: 0.74,
  },
  runtime: {
    uptimeInSeconds: 7200,
    costPerHr: 0.74,
  },
  // Verbose fields that should be stripped
  apiKey: "secret-key",
  templateId: "tmpl_123",
  dockerArgs: "--shm-size=16g",
  machineId: "m-12345",
  volumeMountPath: "/workspace",
  env: [{ key: "HF_TOKEN", value: "hf_xxx" }],
};

describe("formatPod", () => {
  it("extracts essential fields", () => {
    const result = formatPod(RAW_POD);

    expect(result.id).toBe("abc123def456");
    expect(result.name).toBe("training-run-01");
    expect(result.status).toBe("RUNNING");
    expect(result.gpu).toBe("RTX 4090");
    expect(result.gpuCount).toBe(2);
    expect(result.vcpu).toBe(16);
    expect(result.memoryGb).toBe(64);
    expect(result.volumeGb).toBe(100);
    expect(result.containerDiskGb).toBe(20);
    expect(result.image).toBe("runpod/pytorch:2.1.0-py3.10-cuda12.1.0-devel");
    expect(result.costPerHr).toBe("$0.7400/hr");
    expect(result.uptimeHrs).toBe("2.0h");
    expect(result.cloudType).toBe("SECURE");
    expect(result.ports).toBe("8888/http,22/tcp");
  });

  it("strips sensitive and verbose fields", () => {
    const result = formatPod(RAW_POD) as Record<string, unknown>;
    expect(result.apiKey).toBeUndefined();
    expect(result.templateId).toBeUndefined();
    expect(result.dockerArgs).toBeUndefined();
    expect(result.machineId).toBeUndefined();
    expect(result.volumeMountPath).toBeUndefined();
    expect(result.env).toBeUndefined();
    expect(result.machine).toBeUndefined();
    expect(result.runtime).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatPod({});
    expect(result.id).toBe("");
    expect(result.name).toBe("");
    expect(result.status).toBe("unknown");
    expect(result.gpu).toBe("unknown");
    expect(result.gpuCount).toBe(1);
    expect(result.vcpu).toBe(0);
    expect(result.memoryGb).toBe(0);
    expect(result.costPerHr).toBe("n/a");
    expect(result.uptimeHrs).toBe("n/a");
  });

  it("falls back to gpuTypeId when machine.gpuDisplayName missing", () => {
    const { machine: _, ...noMachine } = RAW_POD;
    const result = formatPod(noMachine);
    expect(result.gpu).toBe("NVIDIA GeForce RTX 4090");
  });

  it("formats short uptime as minutes", () => {
    const result = formatPod({
      ...RAW_POD,
      runtime: { uptimeInSeconds: 1800 },
    });
    expect(result.uptimeHrs).toBe("30m");
  });

  it("formats multi-day uptime", () => {
    const result = formatPod({
      ...RAW_POD,
      runtime: { uptimeInSeconds: 172800 },
    });
    expect(result.uptimeHrs).toBe("2.0d");
  });
});

describe("formatPods", () => {
  it("maps array of pods", () => {
    const results = formatPods([RAW_POD, RAW_POD]);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("abc123def456");
    expect(results[1].name).toBe("training-run-01");
  });
});
