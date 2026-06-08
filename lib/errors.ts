import { ConvexError } from "convex/values";

/** Server error payload shape (see helpers.ts `clientError`). */
export interface ServerErr {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export function parseConvexError(err: unknown): ServerErr {
  if (err instanceof ConvexError && typeof err.data === "object" && err.data) {
    const d = err.data as Partial<ServerErr>;
    return { code: d.code ?? "ERROR", message: d.message ?? "Something went wrong", details: d.details };
  }
  if (err instanceof Error) return { code: "ERROR", message: err.message };
  return { code: "ERROR", message: "Unexpected error" };
}

/** Prefer the first field-level validation message over the generic summary. */
export function convexValidationSummary(err: unknown): string {
  const parsed = parseConvexError(err);
  const detail = parsed.details ? Object.values(parsed.details).flat()[0] : undefined;
  return detail ?? parsed.message;
}

/** Flatten field-level `details` into react-hook-form setError calls. */
export function applyServerFieldErrors(
  err: unknown,
  setError: (name: string, e: { type: string; message: string }) => void,
): ServerErr {
  const parsed = parseConvexError(err);
  if (parsed.details) {
    for (const [field, msgs] of Object.entries(parsed.details)) {
      setError(field, { type: "server", message: msgs.join(", ") });
    }
  }
  return parsed;
}
