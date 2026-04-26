import { getCurrentComponent } from "../core/internal/component";
import { domRefs } from "../core/internal/dom-refs";
import type { RefElement } from "../types";

export function useDomRef<
  T extends Record<string, RefElement | RefElement[] | null>,
>(
  ...refKey: (keyof T & string)[]
): {
  refs: T;
} {
  const context = getCurrentComponent("useDomRef");

  return {
    refs: domRefs(new Set(refKey), context.element),
  };
}
