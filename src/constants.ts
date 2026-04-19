/** RunPod REST API base URL */
export const RUNPOD_REST_BASE = "https://rest.runpod.io/v1";

/** RunPod GraphQL API base URL */
export const RUNPOD_GRAPHQL_BASE = "https://api.runpod.io/graphql";

/** RunPod serverless jobs API base URL */
export const RUNPOD_JOBS_BASE = "https://api.runpod.ai/v2";

/** Default items per page */
export const DEFAULT_PER_PAGE = 25;

/** Maximum response characters before truncation */
export const CHARACTER_LIMIT = 4000;

/** Environment variable names */
export const ENV = {
  API_KEY: "RUNPOD_API_KEY",
  WRITE_ENABLED: "RUNPOD_WRITE_ENABLED",
  MCP_API_TOKEN: "MCP_API_TOKEN",
  TRANSPORT: "TRANSPORT",
  PORT: "PORT",
} as const;

/** Default HTTP port for Hono transport */
export const DEFAULT_PORT = 8782;
