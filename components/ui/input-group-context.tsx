"use client";

import { createContext, use, useId, type ReactNode } from "react";

const InputGroupControlIdContext = createContext<string | undefined>(undefined);

function InputGroupControlIdProvider({ children }: { children: ReactNode }) {
  const controlId = useId();

  return <InputGroupControlIdContext.Provider value={controlId}>{children}</InputGroupControlIdContext.Provider>;
}

function useInputGroupControlId() {
  return use(InputGroupControlIdContext);
}

export { InputGroupControlIdProvider, useInputGroupControlId };
