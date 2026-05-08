import { getCurrentComponent } from "../core/component";
import { domRefs } from "./dom-refs";

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
