import {
  GPS_ACCEPT_MAX_ACCURACY_METERS,
  GPS_MIN_SAMPLES_ACCEPT,
  GPS_MIN_SAMPLES_TARGET,
  GPS_SAMPLE_DURATION_MS,
  GPS_SAMPLE_POLL_MS,
  GPS_TARGET_ACCURACY_METERS,
} from "@/convex/gpsAccuracy";

export type BrowserGpsFix = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: number;
  provider: "browser";
  isMockLocation: false;
};

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Enable location in browser settings.";
    case error.POSITION_UNAVAILABLE:
      return "GPS unavailable. Move outdoors and retry.";
    case error.TIMEOUT:
      return "GPS timed out. Retry in open sky.";
    default:
      return error.message || "Failed to capture GPS location.";
  }
}

function isAcceptableFix(accuracyMeters: number, sampleCount: number): boolean {
  if (accuracyMeters <= GPS_TARGET_ACCURACY_METERS) {
    return sampleCount >= GPS_MIN_SAMPLES_TARGET;
  }
  if (accuracyMeters <= GPS_ACCEPT_MAX_ACCURACY_METERS) {
    return sampleCount >= GPS_MIN_SAMPLES_ACCEPT;
  }
  return false;
}

/**
 * Refine a GPS fix using watchPosition — keeps the best (lowest) accuracy reading
 * within the sample window, matching mobile sampling constants.
 */
export function captureBrowserGps(): Promise<BrowserGpsFix> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not available in this browser"));
      return;
    }

    let best: GeolocationPosition | null = null;
    let sampleCount = 0;
    let watchId: number | null = null;
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      fn();
    };

    const consider = (pos: GeolocationPosition) => {
      sampleCount += 1;
      if (!best || pos.coords.accuracy < best.coords.accuracy) {
        best = pos;
      }
      const accuracy = best.coords.accuracy;
      if (isAcceptableFix(accuracy, sampleCount)) {
        finish(() => resolve(toBrowserGpsFix(best!)));
      }
    };

    const timer = setTimeout(() => {
      if (best) {
        finish(() => resolve(toBrowserGpsFix(best!)));
      } else {
        finish(() => reject(new Error("GPS timed out. Retry in open sky.")));
      }
    }, GPS_SAMPLE_DURATION_MS);

    watchId = navigator.geolocation.watchPosition(
      consider,
      (err) => finish(() => reject(new Error(geolocationErrorMessage(err)))),
      { ...GEOLOCATION_OPTIONS, maximumAge: GPS_SAMPLE_POLL_MS },
    );

    navigator.geolocation.getCurrentPosition(
      consider,
      () => {
        /* watchPosition handles errors */
      },
      GEOLOCATION_OPTIONS,
    );
  });
}

function toBrowserGpsFix(pos: GeolocationPosition): BrowserGpsFix {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracyMeters: pos.coords.accuracy,
    capturedAt: Date.now(),
    provider: "browser",
    isMockLocation: false,
  };
}

export function assertClientGpsAccuracy(accuracyMeters: number): void {
  if (accuracyMeters > GPS_ACCEPT_MAX_ACCURACY_METERS) {
    throw new Error(
      `GPS must be within ±${GPS_ACCEPT_MAX_ACCURACY_METERS} m — retake in open sky (current ±${accuracyMeters.toFixed(1)} m)`,
    );
  }
}
