import { getCurrentComponent } from "../../core/runtime";

import type { RefElement } from "../../types";

function isStrictDescendantOfAny(
  node: RefElement,
  boundaries: RefElement[],
): boolean {
  return boundaries.some((b) => b !== node && b.contains(node));
}

function findRef(
  key: string,
  scope: RefElement,
  boundaries: RefElement[],
): RefElement | RefElement[] | null {
  const selector = `[data-ref="${CSS.escape(key)}"]`;
  const nodes = Array.from(
    scope.querySelectorAll<HTMLElement | SVGElement>(selector),
  ).filter((node) => !isStrictDescendantOfAny(node, boundaries));

  if (nodes.length === 0) {
    return null;
  }

  if (nodes.length === 1) {
    return nodes[0];
  }

  return nodes;
}

class DomRefCache {
  #cache = new Map<string, RefElement | RefElement[] | null>();

  constructor(
    private scope: RefElement,
    private getBoundaries: () => RefElement[],
  ) {}

  get(key: string): RefElement | RefElement[] | null {
    if (this.#cache.has(key)) {
      return this.#cache.get(key) ?? null;
    }

    const result = findRef(key, this.scope, this.getBoundaries());
    this.#cache.set(key, result);

    return result;
  }
}

function domRefs<T extends Record<string, RefElement | RefElement[] | null>>(
  scope: RefElement,
  getBoundaries: () => RefElement[],
): T {
  const cache = new DomRefCache(scope, getBoundaries);

  // All traps below are required to ensure consistent behavior as a virtual object.
  // The JS runtime automatically invokes traps other than get as well.
  return new Proxy({} as T, {
    get(_t, prop) {
      // Avoid treating refs as a thenable when it crosses Promise-like code.
      if (typeof prop === "symbol" || prop === "then") {
        return undefined;
      }

      return cache.get(prop);
    },
    has(_t, prop) {
      return typeof prop === "string";
    },
    ownKeys() {
      return [];
    },
    getOwnPropertyDescriptor() {
      return undefined;
    },
    set() {
      return false;
    },
    deleteProperty() {
      return false;
    },
  });
}

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
