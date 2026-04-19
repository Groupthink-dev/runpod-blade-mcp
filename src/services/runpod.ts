/**
 * RunPod API client — three fetch functions for REST, GraphQL, and serverless jobs.
 *
 * All share the same API key (RUNPOD_API_KEY) and error handling.
 * API key is never logged or included in error messages.
 */

import { RUNPOD_REST_BASE, RUNPOD_GRAPHQL_BASE, RUNPOD_JOBS_BASE, ENV } from "../constants.js";

let _apiKey: string | null = null;

function getApiKey(): string {
  if (_apiKey) return _apiKey;
  const key = (process.env[ENV.API_KEY] || "").trim();
  if (!key) {
    throw new Error(
      `${ENV.API_KEY} environment variable is not set. ` +
        "Get your API key at https://www.runpod.io/console/user/settings"
    );
  }
  _apiKey = key;
  return _apiKey;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Validate the API key by querying the GraphQL myself endpoint.
 */
export async function validateApiKey(): Promise<{ email: string; id: string }> {
  const data = await runpodGraphql<{ myself: { id: string; email: string } }>(
    `query { myself { id email } }`
  );
  return data.myself;
}

// ─── REST API (rest.runpod.io/v1) ────────────────────────────────

/**
 * Fetch wrapper for RunPod REST API.
 * Base: https://rest.runpod.io/v1
 */
export async function runpodRest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${RUNPOD_REST_BASE}${path}`;
  const headers = {
    ...authHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = "";
    try {
      const json = JSON.parse(body);
      message = json.error || json.message || json.msg || body;
    } catch {
      message = body;
    }
    throw new RunpodApiError(res.status, message, `REST ${options.method || "GET"} ${path}`);
  }

  return res;
}

// ─── GraphQL API (api.runpod.io/graphql) ─────────────────────────

/**
 * Execute a GraphQL query or mutation.
 * Returns the data field from the response.
 * Throws on GraphQL errors (which arrive as 200 with errors array).
 */
export async function runpodGraphql<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(RUNPOD_GRAPHQL_BASE, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ query, ...(variables ? { variables } : {}) }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new RunpodApiError(res.status, body, `GraphQL`);
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join("; ");
    throw new RunpodApiError(400, messages, "GraphQL");
  }

  return json.data as T;
}

// ─── Serverless Jobs API (api.runpod.ai/v2) ─────────────────────

/**
 * Fetch wrapper for RunPod serverless jobs API.
 * Base: https://api.runpod.ai/v2/{endpointId}
 */
export async function runpodJobs(
  endpointId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${RUNPOD_JOBS_BASE}/${endpointId}${path}`;
  const headers = {
    ...authHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = "";
    try {
      const json = JSON.parse(body);
      message = json.error || json.message || json.msg || body;
    } catch {
      message = body;
    }
    throw new RunpodApiError(
      res.status,
      message,
      `Jobs ${options.method || "GET"} /${endpointId}${path}`
    );
  }

  return res;
}

// ─── Error class ─────────────────────────────────────────────────

export class RunpodApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly source: string
  ) {
    super(`RunPod API error ${status}: ${detail}`);
    this.name = "RunpodApiError";
  }
}
