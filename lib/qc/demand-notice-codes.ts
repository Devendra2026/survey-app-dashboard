/** QR payload for demand notice property identification. */

export function buildPropertyVerifyUrl(propertyId: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/qc?propertyId=${encodeURIComponent(propertyId)}`;
  }
  return propertyId;
}

export function buildQrPayload(propertyId: string): string {
  return buildPropertyVerifyUrl(propertyId);
}
