"use client";

import {
  readQcWorkScope,
  scopeFromUserAssignment,
  type QcWorkScope,
  writeQcWorkScope,
} from "@/lib/qc/work-scope";
import { useCurrentUser } from "@/lib/session";
import { useCallback, useEffect, useState } from "react";

export function useQcWorkScope() {
  const { user } = useCurrentUser();
  const [scope, setScopeState] = useState<QcWorkScope>({});

  useEffect(() => {
    const stored = readQcWorkScope();
    if (stored.districtId || stored.municipalityId || stored.wardNo) {
      setScopeState(stored);
      return;
    }
    if (!user) return;
    const initial = scopeFromUserAssignment(user);
    if (initial.districtId || initial.municipalityId || initial.wardNo) {
      writeQcWorkScope(initial);
      setScopeState(initial);
    }
  }, [user]);

  const setScope = useCallback((next: QcWorkScope) => {
    writeQcWorkScope(next);
    setScopeState(next);
  }, []);

  const patchScope = useCallback((patch: Partial<QcWorkScope>) => {
    setScopeState((prev) => {
      const next = { ...prev, ...patch };
      writeQcWorkScope(next);
      return next;
    });
  }, []);

  return { scope, setScope, patchScope };
}
