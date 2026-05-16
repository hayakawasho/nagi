import { getCurrentComponent } from "../core/runtime";

import type { RefElement } from "../types";

export function useRootRef<T extends RefElement = RefElement>() {
  const context = getCurrentComponent("useRootRef");

  return context.element as T;
}
