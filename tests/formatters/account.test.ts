import { describe, it, expect } from "vitest";
import {
  formatAccount,
  formatTemplate,
  formatTemplates,
} from "../../src/formatters/account.js";

const RAW_ACCOUNT = {
  id: "user_12345",
  email: "user@example.com",
  currentBalance: 125.789,
  currentSpendPerHr: 1.48,
  maxServerlessConcurrency: 100,
  clientBalance: 125.789,
  // Verbose fields
  apiKeys: [{ id: "key_1" }],
  notifyPodsStale: true,
  notifyPodsGeneral: true,
};

describe("formatAccount", () => {
  it("extracts essential fields", () => {
    const result = formatAccount(RAW_ACCOUNT);
    expect(result.id).toBe("user_12345");
    expect(result.email).toBe("user@example.com");
    expect(result.balance).toBe("$125.79");
    expect(result.currentSpendPerHr).toBe("$1.4800/hr");
  });

  it("strips verbose fields", () => {
    const result = formatAccount(RAW_ACCOUNT) as Record<string, unknown>;
    expect(result.apiKeys).toBeUndefined();
    expect(result.notifyPodsStale).toBeUndefined();
    expect(result.clientBalance).toBeUndefined();
    expect(result.maxServerlessConcurrency).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatAccount({});
    expect(result.id).toBe("");
    expect(result.email).toBe("");
    expect(result.balance).toBe("$0.00");
    expect(result.currentSpendPerHr).toBe("$0.0000/hr");
  });

  it("uses balance as fallback for currentBalance", () => {
    const result = formatAccount({ balance: 50.0 });
    expect(result.balance).toBe("$50.00");
  });
});

const RAW_TEMPLATE = {
  id: "tmpl_abc123",
  name: "PyTorch 2.2",
  imageName: "runpod/pytorch:2.2.0-py3.10-cuda12.1.0-devel",
  isServerless: true,
  isPublic: true,
  // Verbose fields
  readme: "# Long readme content...",
  dockerArgs: "--shm-size=16g",
  startJupyter: true,
  startSsh: true,
  volumeInGb: 20,
  ports: "8888/http",
  category: "AI",
};

describe("formatTemplate", () => {
  it("extracts essential fields", () => {
    const result = formatTemplate(RAW_TEMPLATE);
    expect(result.id).toBe("tmpl_abc123");
    expect(result.name).toBe("PyTorch 2.2");
    expect(result.imageName).toBe("runpod/pytorch:2.2.0-py3.10-cuda12.1.0-devel");
    expect(result.isServerless).toBe(true);
    expect(result.isPublic).toBe(true);
  });

  it("strips verbose fields", () => {
    const result = formatTemplate(RAW_TEMPLATE) as Record<string, unknown>;
    expect(result.readme).toBeUndefined();
    expect(result.dockerArgs).toBeUndefined();
    expect(result.startJupyter).toBeUndefined();
    expect(result.volumeInGb).toBeUndefined();
    expect(result.ports).toBeUndefined();
    expect(result.category).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatTemplate({});
    expect(result.id).toBe("");
    expect(result.name).toBe("unnamed");
    expect(result.imageName).toBe("unknown");
    expect(result.isServerless).toBe(false);
    expect(result.isPublic).toBe(false);
  });
});

describe("formatTemplates", () => {
  it("maps array of templates", () => {
    const results = formatTemplates([RAW_TEMPLATE, RAW_TEMPLATE]);
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("PyTorch 2.2");
  });
});
