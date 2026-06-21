import type { Doc } from "../_generated/dataModel";
import { GPS_ACCEPT_MAX_ACCURACY_METERS } from "../gpsAccuracy";

type GpsCapture = NonNullable<Doc<"surveys">["gps"]>;

export class GpsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GpsValidationError";
  }
}

export function validateGps(gps: GpsCapture, options?: { requireAccuracy?: boolean }): string | null {
  const requireAccuracy = options?.requireAccuracy ?? true;
  if (!Number.isFinite(gps.latitude) || gps.latitude < -90 || gps.latitude > 90) {
    return "Latitude must be between -90 and 90";
  }
  if (!Number.isFinite(gps.longitude) || gps.longitude < -180 || gps.longitude > 180) {
    return "Longitude must be between -180 and 180";
  }
  if (!Number.isFinite(gps.capturedAt) || gps.capturedAt <= 0) {
    return "GPS capture timestamp is invalid";
  }
  if (!requireAccuracy) return null;
  if (!Number.isFinite(gps.accuracyMeters) || gps.accuracyMeters <= 0) {
    return "GPS accuracy must be a positive number";
  }
  if (gps.accuracyMeters > GPS_ACCEPT_MAX_ACCURACY_METERS) {
    return `GPS must be within ±${GPS_ACCEPT_MAX_ACCURACY_METERS} m — retake in open sky`;
  }
  return null;
}

export function assertValidGps(gps: GpsCapture): void {
  const message = validateGps(gps);
  if (message) throw new GpsValidationError(message);
}
