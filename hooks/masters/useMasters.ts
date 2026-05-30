"use client";

/**
 * useMasters — the live, admin-editable dropdown catalog from
 * `api.masters.bundle`. This is the single source of truth for every <Select>
 * across the survey forms (assessment years, ownership types, property uses,
 * road types, situations, tax zones, water/sanitation, floor masters) PLUS the
 * tenant catalog (districts / ULBs / wards) scoped to the caller.
 *
 * Reactive: when an admin edits a master in the Masters module (which calls
 * `admin.upsertMaster`), Convex pushes the change and every open form updates.
 */
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function useMasters() {
  const bundle = useQuery(api.masters.bundle);
  return { masters: bundle, isLoading: bundle === undefined };
}

export function useWardsForMunicipality(municipalityId: string | undefined) {
  return useQuery(
    api.masters.wardsForMunicipality,
    municipalityId ? { municipalityId: municipalityId as any } : "skip",
  );
}
