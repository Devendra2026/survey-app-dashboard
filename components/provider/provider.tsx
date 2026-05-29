"use client";

import { convex } from "@/lib/convex";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    // Bridge Convex into React Query so `useQuery({...convexQuery(...)})` works
    // for the imperative paths while Convex's own useQuery stays reactive.
    const convexQueryClient = new ConvexQueryClient(convex);
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          queryKeyHashFn: convexQueryClient.hashFn(),
          queryFn: convexQueryClient.queryFn(),
          staleTime: 30_000,
        },
      },
    });
    convexQueryClient.connect(qc);
    return qc;
  });

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
