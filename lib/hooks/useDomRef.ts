import { getCurrentComponent } from "../core/runtime";

import { domRefs } from "./domRefs";

import type { RefElement } from "../types";

export function useDomRef<
  T extends Record<string, RefElement | RefElement[] | null>,
>(): {
  refs: T;
} {
  const context = getCurrentComponent("useDomRef");

  return {
    refs: domRefs<T>(context.element, () => context.childElements),
  };
}
