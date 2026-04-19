/**
 * Token-efficient formatters for RunPod account and templates.
 */

interface AccountSummary {
  id: string;
  email: string;
  balance: string;
  currentSpendPerHr: string;
}

interface TemplateSummary {
  id: string;
  name: string;
  imageName: string;
  isServerless: boolean;
  isPublic: boolean;
}

export function formatAccount(raw: Record<string, unknown>): AccountSummary {
  return {
    id: (raw.id as string) || "",
    email: (raw.email as string) || "",
    balance: `$${((raw.currentBalance as number) || (raw.balance as number) || 0).toFixed(2)}`,
    currentSpendPerHr: `$${((raw.currentSpendPerHr as number) || 0).toFixed(4)}/hr`,
  };
}

export function formatTemplate(raw: Record<string, unknown>): TemplateSummary {
  return {
    id: (raw.id as string) || "",
    name: (raw.name as string) || "unnamed",
    imageName: (raw.imageName as string) || "unknown",
    isServerless: (raw.isServerless as boolean) ?? false,
    isPublic: (raw.isPublic as boolean) ?? false,
  };
}

export function formatTemplates(raw: Record<string, unknown>[]): TemplateSummary[] {
  return raw.map(formatTemplate);
}
