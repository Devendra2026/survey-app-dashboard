import { describe, expect, it } from "vitest";
import { GPS_ACCEPT_MAX_ACCURACY_METERS } from "../gpsAccuracy";
import { validateGps } from "./gpsValidation";

const validGps = {
  latitude: 28.6139,
  longitude: 77.209,
  accuracyMeters: 5,
  capturedAt: Date.now(),
  provider: "browser",
};

describe("validateGps", () => {
  it("accepts valid GPS", () => {
    expect(validateGps(validGps)).toBeNull();
  });

  it("rejects out-of-range latitude", () => {
    expect(validateGps({ ...validGps, latitude: 91 })).toMatch(/Latitude/);
    expect(validateGps({ ...validGps, latitude: -91 })).toMatch(/Latitude/);
  });

  it("rejects out-of-range longitude", () => {
    expect(validateGps({ ...validGps, longitude: 181 })).toMatch(/Longitude/);
    expect(validateGps({ ...validGps, longitude: -181 })).toMatch(/Longitude/);
  });

  it("rejects accuracy above accept max when required", () => {
    expect(validateGps({ ...validGps, accuracyMeters: GPS_ACCEPT_MAX_ACCURACY_METERS + 1 })).toMatch(/within/);
  });

  it("skips accuracy check when requireAccuracy is false", () => {
    expect(
      validateGps({ ...validGps, accuracyMeters: GPS_ACCEPT_MAX_ACCURACY_METERS + 50 }, { requireAccuracy: false }),
    ).toBeNull();
  });

  it("still validates latitude when requireAccuracy is false", () => {
    expect(validateGps({ ...validGps, latitude: 100 }, { requireAccuracy: false })).toMatch(/Latitude/);
  });
});
