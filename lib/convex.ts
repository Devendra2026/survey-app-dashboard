import { ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  // Fail loud in dev — a missing URL silently breaks every query.
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Point it at the SAME Convex deployment used by the mobile app.");
}

export const convex = new ConvexReactClient(url);
