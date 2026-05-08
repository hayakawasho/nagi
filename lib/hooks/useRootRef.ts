import { getCurrentComponent } from "../core/component";

import type { RefElement } from "../types";

export function useRootRef<T extends RefElement = RefElement>() {
  const context = getCurrentComponent("useRootRef");

  return context.element as T;
}
