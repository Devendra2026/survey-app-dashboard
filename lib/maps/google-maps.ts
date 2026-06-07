/** Google Maps embed + static URLs for geo-tagged survey locations. */

export function googleMapsEmbedUrl(latitude: number, longitude: number, zoom = 17): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (key) {
    return `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(key)}&center=${latitude},${longitude}&zoom=${zoom}&maptype=roadmap`;
  }
  return `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=${zoom}&output=embed`;
}

export function googleMapsPlaceUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function googleMapsStaticUrl(latitude: number, longitude: number, width = 640, height = 360): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const size = `${width}x${height}`;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=17&size=${size}&scale=2&markers=color:red%7C${latitude},${longitude}&key=${encodeURIComponent(key)}`;
}
