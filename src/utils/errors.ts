/**
 * RunPod API error handler — maps errors to actionable messages.
 * Never exposes API keys or sensitive data in error output.
 */

import { RunpodApiError } from "../services/runpod.js";
import { ENV } from "../constants.js";

export function handleApiError(error: unknown): string {
  if (error instanceof RunpodApiError) {
    switch (error.status) {
      case 400:
        return `Error (400 Bad Request): ${error.detail}. Check parameters — a required field may be missing or malformed.`;
      case 401:
        return `Error (401 Unauthorized): Invalid or expired API key. Verify ${ENV.API_KEY} is set and valid.`;
      case 403:
        return `Error (403 Forbidden): API key lacks required permissions.`;
      case 404:
        return `Error (404 Not Found): Resource does not exist. Double-check the pod, endpoint, or job ID.`;
      case 429:
        return `Error (429 Rate Limited): RunPod API rate limit hit. Wait a moment and retry.`;
      case 500:
        return `Error (500 Internal Server Error): RunPod API internal error. Retry in a few seconds.`;
      case 503:
        return `Error (503 Service Unavailable): RunPod API temporarily unavailable. Retry shortly.`;
      default:
        return `Error (${error.status}): ${error.detail}`;
    }
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Error: RunPod API request timed out after 15s. The API may be slow or unreachable.";
    }
    if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
      const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
      return `Error: Could not connect to RunPod API${cause}. Retried once — check network connectivity.`;
    }
    return `Error: ${error.message}`;
  }

  return `Error: An unexpected error occurred: ${String(error)}`;
}
