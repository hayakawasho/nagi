import type { RefElement } from "../types";

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

export function domRefs<
  T extends Record<string, RefElement | RefElement[] | null>,
>(scope: RefElement, getBoundaries: () => RefElement[]): T {
  const cache = new Map<string, RefElement | RefElement[] | null>();

  return new Proxy({} as T, {
    get(_t, prop) {
      if (typeof prop === "symbol" || prop === "then") {
        return undefined;
      }

      if (cache.has(prop)) {
        return cache.get(prop);
      }

      const result = findRef(prop, scope, getBoundaries());
      cache.set(prop, result);

      return result;
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
