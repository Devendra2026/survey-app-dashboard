import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import type { FunctionReference } from "convex/server";

const convexOptions = {
  skipConvexDeploymentUrlCheck: true,
} as const;

/** Preload a Convex query on the server with the signed-in user's Clerk JWT. */
export async function preloadConvexQuery<Query extends FunctionReference<"query">>(query: Query, args: Query["_args"]) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  return preloadQuery(query, args, { ...convexOptions, token: token ?? undefined });
}
